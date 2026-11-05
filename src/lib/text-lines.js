// Utilidades de texto comunes a iCalendar (RFC 5545) y vCard (RFC 6350): los dos
// formatos comparten plegado de líneas, escapado y la forma "NOMBRE;PARAM=v:VALOR".
// Viven aquí una sola vez para que un arreglo del plegado o del escapado llegue a
// los dos parsers (ics.js y vcf.js).

// Desdobla líneas plegadas (CRLF/LF seguido de espacio o tab continúa la línea).
/**
 * @param {unknown} text
 * @returns {string}
 */
export function unfold (text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

/**
 * @param {unknown} s
 * @returns {string}
 */
export function escapeText (s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * @param {unknown} s
 * @returns {string}
 */
export function unescapeText (s) {
  return String(s == null ? '' : s)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// Pliega una línea a <=75 octetos (aprox. por caracteres) con CRLF + espacio.
/**
 * @param {string} line
 * @returns {string}
 */
export function foldLine (line) {
  /** @type {string[]} */
  const out = []
  let s = line
  while (s.length > 75) {
    out.push(s.slice(0, 75))
    s = ' ' + s.slice(75)
  }
  out.push(s)
  return out.join('\r\n')
}

/**
 * Separa "group.NOMBRE;PARAM=val:VALOR" respetando comillas en los parámetros.
 * @param {string} line
 * @param {object} [opts]
 * @param {boolean} [opts.stripGroup=false]  quita el prefijo de grupo ("item1.") del nombre (vCard)
 * @param {(params: Record<string,string>, raw: string) => void} [opts.onBareParam]  qué hacer con un
 *   parámetro sin "=" (vCard 2.1: "TEL;CELL"); por defecto se ignora
 * @returns {{ name: string, params: Record<string,string>, value: string }}
 */
export function parseLine (line, { stripGroup = false, onBareParam } = {}) {
  let i = 0
  let inQuotes = false
  for (; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if (c === ':' && !inQuotes) break
  }
  const head = line.slice(0, i)
  const value = line.slice(i + 1)
  /** @type {string[]} */
  const parts = []
  let cur = ''
  inQuotes = false
  for (const c of head) {
    if (c === '"') { inQuotes = !inQuotes; continue }
    if (c === ';' && !inQuotes) { parts.push(cur); cur = ''; continue }
    cur += c
  }
  parts.push(cur)
  let name = parts[0]
  if (stripGroup && name.includes('.')) name = /** @type {string} */ (name.split('.').pop())
  name = name.toUpperCase()
  /** @type {Record<string, string>} */
  const params = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq === -1) { if (onBareParam) onBareParam(params, p); continue }
    params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1)
  }
  return { name, params, value }
}
