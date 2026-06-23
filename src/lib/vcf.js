// Parser/serializer vCard (RFC 6350 / 2426) minimalista y autocontenido.
// Formato de archivo estándar (.vcf), no protocolo del ecosistema → se
// implementa local, sin dependencias de terceros. Cubre lo habitual: FN, N,
// TEL, EMAIL, ORG, TITLE, ADR, URL, NOTE, BDAY y PHOTO embebida.

function unfold (text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

function unescapeText (s) {
  return String(s == null ? '' : s)
    .replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}
function escapeText (s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function foldLine (line) {
  const out = []
  let s = line
  while (s.length > 75) { out.push(s.slice(0, 75)); s = ' ' + s.slice(75) }
  out.push(s)
  return out.join('\r\n')
}

// "group.NAME;PARAM=val:VALUE" → { name, params, value }
function parseLine (line) {
  let i = 0, inQuotes = false
  for (; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if (c === ':' && !inQuotes) break
  }
  const head = line.slice(0, i)
  const value = line.slice(i + 1)
  const parts = []
  let cur = ''; inQuotes = false
  for (const c of head) {
    if (c === '"') { inQuotes = !inQuotes; continue }
    if (c === ';' && !inQuotes) { parts.push(cur); cur = ''; continue }
    cur += c
  }
  parts.push(cur)
  let name = parts[0]
  if (name.includes('.')) name = name.split('.').pop() // quita el group "item1."
  name = name.toUpperCase()
  const params = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq === -1) { params.TYPE = (params.TYPE ? params.TYPE + ',' : '') + p; continue }
    const k = p.slice(0, eq).toUpperCase()
    params[k] = p.slice(eq + 1)
  }
  return { name, params, value }
}

function typeLabel (params) {
  const raw = (params.TYPE || '').toLowerCase()
  if (!raw) return ''
  return raw.split(',').filter((x) => x && x !== 'pref' && x !== 'voice')[0] || ''
}

function photoDataUri (value, params) {
  const v = (value || '').trim()
  if (!v) return ''
  if (/^(https?:|data:)/i.test(v)) return v
  const enc = (params.ENCODING || '').toLowerCase()
  if (enc === 'b' || enc === 'base64' || /^[A-Za-z0-9+/=\s]+$/.test(v)) {
    const type = (params.TYPE || 'JPEG').toLowerCase().replace('jpeg', 'jpeg')
    return `data:image/${type};base64,${v.replace(/\s+/g, '')}`
  }
  return ''
}

// Parsea texto .vcf → { contacts: [...], count }
export function parseVCF (text) {
  const lines = unfold(text).split('\n')
  const contacts = []
  let cur = null, rawLines = null
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    if (!line) continue
    const up = line.toUpperCase()
    if (up === 'BEGIN:VCARD') {
      cur = { fn: '', tels: [], emails: [], urls: [], adrs: [], org: '', title: '', note: '', photo: '', bday: '' }
      rawLines = ['BEGIN:VCARD']
      continue
    }
    if (up === 'END:VCARD') {
      if (cur) {
        rawLines.push('END:VCARD')
        cur.raw = rawLines.join('\r\n')
        if (!cur.fn) cur.fn = deriveName(cur)
        contacts.push(cur)
      }
      cur = null; rawLines = null
      continue
    }
    if (!cur) continue
    rawLines.push(line)
    const { name, params, value } = parseLine(line)
    switch (name) {
      case 'FN': cur.fn = unescapeText(value); break
      case 'N': {
        const [family = '', given = '', additional = '', prefix = '', suffix = ''] = value.split(';').map(unescapeText)
        cur.n = { family, given, additional, prefix, suffix }
        break
      }
      case 'TEL': cur.tels.push({ value: unescapeText(value), type: typeLabel(params) }); break
      case 'EMAIL': cur.emails.push({ value: unescapeText(value), type: typeLabel(params) }); break
      case 'URL': cur.urls.push(value); break
      case 'ORG': cur.org = unescapeText(value).replace(/;+$/, '').replace(/;/g, ' · '); break
      case 'TITLE': cur.title = unescapeText(value); break
      case 'NOTE': cur.note = unescapeText(value); break
      case 'BDAY': cur.bday = value; break
      case 'ADR': {
        const parts = value.split(';').map(unescapeText)
        const formatted = parts.slice(2).filter(Boolean).join(', ')
        if (formatted) cur.adrs.push({ value: formatted, type: typeLabel(params) })
        break
      }
      case 'PHOTO': { const d = photoDataUri(value, params); if (d) cur.photo = d; break }
    }
  }
  return { contacts, count: contacts.length }
}

function deriveName (c) {
  if (c.n) return [c.n.given, c.n.family].filter(Boolean).join(' ').trim()
  if (c.emails[0]) return c.emails[0].value
  if (c.tels[0]) return c.tels[0].value
  return ''
}

export function contactToVCF (c) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`FN:${escapeText(c.fn || deriveName(c))}`)
  if (c.n) lines.push(`N:${[c.n.family, c.n.given, c.n.additional, c.n.prefix, c.n.suffix].map(escapeText).join(';')}`)
  else if (c.fn) lines.push(`N:${escapeText(c.fn)};;;;`)
  if (c.org) lines.push(`ORG:${escapeText(c.org)}`)
  if (c.title) lines.push(`TITLE:${escapeText(c.title)}`)
  for (const t of c.tels || []) lines.push(`TEL${t.type ? ';TYPE=' + t.type : ''}:${escapeText(t.value)}`)
  for (const e of c.emails || []) lines.push(`EMAIL${e.type ? ';TYPE=' + e.type : ''}:${escapeText(e.value)}`)
  for (const a of c.adrs || []) lines.push(`ADR${a.type ? ';TYPE=' + a.type : ''}:;;${escapeText(a.value)};;;;`)
  for (const u of c.urls || []) lines.push(`URL:${u}`)
  if (c.bday) lines.push(`BDAY:${c.bday}`)
  if (c.note) lines.push(`NOTE:${escapeText(c.note)}`)
  if (c.photo && c.photo.startsWith('data:')) {
    const m = c.photo.match(/^data:image\/([a-z]+);base64,(.*)$/i)
    if (m) lines.push(`PHOTO;ENCODING=b;TYPE=${m[1].toUpperCase()}:${m[2]}`)
  }
  lines.push('END:VCARD')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

// Clave de orden alfabético (apellido si hay N, si no FN).
export function sortKey (c) {
  if (c.n && c.n.family) return (c.n.family + ' ' + (c.n.given || '')).toLowerCase()
  return (c.fn || '').toLowerCase()
}
