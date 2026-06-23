// Parser/serializer iCalendar (RFC 5545) minimalista y autocontenido.
//
// Esto NO es un protocolo del ecosistema Dotrino: es un formato de archivo
// estándar (.ics). Por eso se implementa local en la app, sin dependencias de
// terceros (cuida la cadena de suministro). Cubre lo que la gente recibe de
// verdad: VEVENT con DTSTART/DTEND (todo el día y con hora, UTC o local),
// SUMMARY/LOCATION/DESCRIPTION/URL y RRULE (con cálculo best-effort de la
// próxima ocurrencia). No expande recurrencias completas ni VTIMEZONE.

const PRODID = '-//Dotrino//Wallet//ES'

// ---------- utilidades de texto ----------

// Desdobla líneas plegadas (CRLF/LF seguido de espacio o tab continúa la línea).
function unfold (text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

function escapeText (s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function unescapeText (s) {
  return String(s == null ? '' : s)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// Pliega una línea a <=75 octetos (aprox. por caracteres) con CRLF + espacio.
function foldLine (line) {
  const out = []
  let s = line
  while (s.length > 75) {
    out.push(s.slice(0, 75))
    s = ' ' + s.slice(75)
  }
  out.push(s)
  return out.join('\r\n')
}

// Separa "NOMBRE;PARAM=val:VALOR" respetando comillas en los parámetros.
function parseLine (line) {
  let i = 0
  let inQuotes = false
  for (; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if (c === ':' && !inQuotes) break
  }
  const head = line.slice(0, i)
  const value = line.slice(i + 1)
  const parts = []
  let cur = ''
  inQuotes = false
  for (const c of head) {
    if (c === '"') { inQuotes = !inQuotes; continue }
    if (c === ';' && !inQuotes) { parts.push(cur); cur = ''; continue }
    cur += c
  }
  parts.push(cur)
  const name = parts[0].toUpperCase()
  const params = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq === -1) continue
    params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1)
  }
  return { name, params, value }
}

// ---------- fechas ----------

// Convierte un valor DTSTART/DTEND a { allDay, local, ms }.
//   local: cadena de pared 'YYYY-MM-DDTHH:MM' (o 'YYYY-MM-DD' si allDay)
//   ms: epoch para ordenar/agrupar (UTC se interpreta como instante real;
//       TZID/flotante se interpretan como hora local del dispositivo).
function parseDate (value, params) {
  const v = (value || '').trim()
  const isDate = params.VALUE === 'DATE' || /^\d{8}$/.test(v)
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, hh, mm, ss, z] = m
  if (isDate || hh == null) {
    const dt = new Date(+y, +mo - 1, +d)
    return { allDay: true, local: `${y}-${mo}-${d}`, ms: dt.getTime() }
  }
  if (z === 'Z') {
    // UTC real → lo mostramos en la zona local del usuario.
    const ms = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +(ss || 0))
    const dt = new Date(ms)
    return { allDay: false, local: toLocalInput(dt), ms }
  }
  // TZID o flotante: best-effort como hora de pared local.
  const dt = new Date(+y, +mo - 1, +d, +hh, +mm, +(ss || 0))
  return { allDay: false, local: `${y}-${mo}-${d}T${hh}:${mm}`, ms: dt.getTime() }
}

// Date → 'YYYY-MM-DDTHH:MM' en hora local (apto para <input type=datetime-local>).
export function toLocalInput (dt) {
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`
}

// 'YYYY-MM-DD[THH:MM]' → epoch ms (hora local).
export function localToMs (local, allDay) {
  if (!local) return 0
  if (allDay) {
    const [y, mo, d] = local.split('-').map(Number)
    return new Date(y, mo - 1, d).getTime()
  }
  return new Date(local).getTime()
}

// epoch ms en local → básico iCalendar UTC 'YYYYMMDDTHHMMSSZ'
function msToUtcBasic (ms) {
  const dt = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}T${p(dt.getUTCHours())}${p(dt.getUTCMinutes())}${p(dt.getUTCSeconds())}Z`
}

function localDateBasic (local) {
  return local.slice(0, 10).replace(/-/g, '')
}

// ---------- parse ----------

// Parsea texto .ics → { events: [...], count }.
// Cada evento: { uid, title, location, description, url, allDay, start, end, tz, rrule, raw }
export function parseICS (text) {
  const lines = unfold(String(text || '')).split('\n')
  const events = []
  let cur = null
  let rawLines = null
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    if (!line) continue
    if (line.toUpperCase() === 'BEGIN:VEVENT') {
      cur = { allDay: false, start: '', end: null, tz: null, rrule: null }
      rawLines = ['BEGIN:VEVENT']
      continue
    }
    if (line.toUpperCase() === 'END:VEVENT') {
      if (cur) {
        rawLines.push('END:VEVENT')
        cur.raw = rawLines.join('\r\n')
        if (cur.start) events.push(cur)
      }
      cur = null
      rawLines = null
      continue
    }
    if (!cur) continue
    rawLines.push(line)
    const { name, params, value } = parseLine(line)
    switch (name) {
      case 'UID': cur.uid = value; break
      case 'SUMMARY': cur.title = unescapeText(value); break
      case 'LOCATION': cur.location = unescapeText(value); break
      case 'DESCRIPTION': cur.description = unescapeText(value); break
      case 'URL': cur.url = value; break
      case 'RRULE': cur.rrule = value; break
      case 'DTSTART': {
        const d = parseDate(value, params)
        if (d) { cur.start = d.local; cur.allDay = d.allDay; cur._startMs = d.ms; cur.tz = params.TZID || (/[Z]$/.test(value) ? 'UTC' : null) }
        break
      }
      case 'DTEND': {
        const d = parseDate(value, params)
        if (d) { cur.end = d.local; cur._endMs = d.ms }
        break
      }
    }
  }
  return { events, count: events.length }
}

// ---------- serialize ----------

export function eventToICS (ev) {
  const uid = ev.uid || `${cryptoId()}@wallet.dotrino.com`
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${PRODID}`, 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT']
  lines.push(`UID:${uid}`)
  lines.push(`DTSTAMP:${msToUtcBasic(Date.now())}`)
  if (ev.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${localDateBasic(ev.start)}`)
    if (ev.end) lines.push(`DTEND;VALUE=DATE:${localDateBasic(ev.end)}`)
  } else {
    lines.push(`DTSTART:${msToUtcBasic(localToMs(ev.start, false))}`)
    if (ev.end) lines.push(`DTEND:${msToUtcBasic(localToMs(ev.end, false))}`)
  }
  if (ev.title) lines.push(`SUMMARY:${escapeText(ev.title)}`)
  if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`)
  if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`)
  if (ev.url) lines.push(`URL:${ev.url}`)
  if (ev.rrule) lines.push(`RRULE:${ev.rrule}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

function cryptoId () {
  try { return crypto.randomUUID() } catch { return 'id-' + Math.abs(Date.now()).toString(36) }
}

// ---------- recurrencia (best-effort) ----------

const RR_FREQ_STEP = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' }

function parseRRule (rrule) {
  const out = {}
  for (const part of String(rrule || '').split(';')) {
    const [k, v] = part.split('=')
    if (k) out[k.toUpperCase()] = v
  }
  return out
}

// Próxima ocurrencia >= fromMs (ms). null si no recurre o ya terminó.
// Soporta FREQ DAILY/WEEKLY/MONTHLY/YEARLY con INTERVAL, COUNT y UNTIL.
export function nextOccurrenceMs (ev, fromMs) {
  if (!ev.rrule) return null
  const rr = parseRRule(ev.rrule)
  const step = RR_FREQ_STEP[(rr.FREQ || '').toUpperCase()]
  if (!step) return null
  const interval = Math.max(1, parseInt(rr.INTERVAL || '1', 10))
  const count = rr.COUNT ? parseInt(rr.COUNT, 10) : Infinity
  let until = Infinity
  if (rr.UNTIL) {
    const d = parseDate(rr.UNTIL, {})
    if (d) until = d.ms
  }
  const base = new Date(localToMs(ev.start, ev.allDay))
  let occ = new Date(base.getTime())
  for (let i = 0; i < 1000 && i < count; i++) {
    const ms = occ.getTime()
    if (ms > until) return null
    if (ms >= fromMs) return ms
    if (step === 'day') occ.setDate(occ.getDate() + interval)
    else if (step === 'week') occ.setDate(occ.getDate() + 7 * interval)
    else if (step === 'month') occ.setMonth(occ.getMonth() + interval)
    else if (step === 'year') occ.setFullYear(occ.getFullYear() + interval)
  }
  return null
}

// ---------- formato humano ----------

export function formatWhen (ev, lang, now = Date.now()) {
  const locale = lang === 'en' ? 'en-US' : 'es-ES'
  let ms = localToMs(ev.start, ev.allDay)
  if (ev.rrule) {
    const next = nextOccurrenceMs(ev, now)
    if (next != null) ms = next
  }
  const dt = new Date(ms)
  if (ev.allDay) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(dt)
  }
  const date = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(dt)
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(dt)
  return `${date} · ${time}`
}

// epoch ms efectivo para ordenar (próxima ocurrencia si recurre).
export function effectiveMs (ev, now = Date.now()) {
  if (ev.rrule) {
    const next = nextOccurrenceMs(ev, now)
    if (next != null) return next
  }
  return localToMs(ev.start, ev.allDay)
}
