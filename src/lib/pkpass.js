// Lector .pkpass (Apple/Google Wallet) autocontenido.
//
// Un .pkpass es un ZIP con pass.json + imágenes + manifest.json + signature.
// Descomprimimos con DecompressionStream nativo (sin librería de ZIP) y
// parseamos pass.json a un modelo neutro para renderizar la tarjeta. NO
// verificamos la firma (el .pkpass original se conserva para re-exportar y
// añadir a la Wallet nativa, que sí la valida).

// ---------- base64 ----------
export function bytesToB64 (bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}
export function b64ToBytes (b64) {
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

// ---------- ZIP ----------
async function inflateRaw (bytes) {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([bytes]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// Lee el ZIP y devuelve { 'pass.json': Uint8Array, ... }
async function unzip (arrayBuffer) {
  const buf = new Uint8Array(arrayBuffer)
  const dv = new DataView(arrayBuffer)
  // Localiza el End Of Central Directory (firma 0x06054b50), escaneando atrás.
  let eocd = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('No es un ZIP válido (.pkpass)')
  const count = dv.getUint16(eocd + 10, true)
  let off = dv.getUint32(eocd + 16, true) // offset del central directory
  const td = new TextDecoder()
  const out = {}
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break
    const method = dv.getUint16(off + 10, true)
    const compSize = dv.getUint32(off + 20, true)
    const nameLen = dv.getUint16(off + 28, true)
    const extraLen = dv.getUint16(off + 30, true)
    const commentLen = dv.getUint16(off + 32, true)
    const localOff = dv.getUint32(off + 42, true)
    const name = td.decode(buf.subarray(off + 46, off + 46 + nameLen))
    // Cabecera local: el name/extra pueden tener longitudes distintas.
    const lNameLen = dv.getUint16(localOff + 26, true)
    const lExtraLen = dv.getUint16(localOff + 28, true)
    const dataStart = localOff + 30 + lNameLen + lExtraLen
    const comp = buf.subarray(dataStart, dataStart + compSize)
    if (!name.endsWith('/')) {
      out[name] = method === 0 ? comp.slice() : await inflateRaw(comp)
    }
    off += 46 + nameLen + extraLen + commentLen
  }
  return out
}

// ---------- pass.json → modelo neutro ----------
const STYLES = ['boardingPass', 'coupon', 'eventTicket', 'generic', 'storeCard']

function imgDataUri (bytes) {
  if (!bytes) return ''
  return `data:image/png;base64,${bytesToB64(bytes)}`
}

function pickImage (files, base) {
  return files[base + '@2x.png'] || files[base + '.png'] || files[base + '@3x.png'] || null
}

function toMs (iso) {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

function mapFields (arr) {
  return (arr || []).map((f) => ({
    label: f.label || '',
    value: f.value == null ? '' : String(f.value),
  }))
}

export async function parsePkpass (arrayBuffer) {
  const files = await unzip(arrayBuffer)
  if (!files['pass.json']) throw new Error('El .pkpass no contiene pass.json')
  const pass = JSON.parse(new TextDecoder().decode(files['pass.json']))
  const style = STYLES.find((s) => pass[s]) || 'generic'
  const body = pass[style] || {}

  const barcodesRaw = pass.barcodes || (pass.barcode ? [pass.barcode] : [])
  const bc = barcodesRaw[0]
  const barcode = bc
    ? { format: (bc.format || '').replace('PKBarcodeFormat', ''), message: bc.message || '', altText: bc.altText || '' }
    : null

  return {
    title: pass.logoText || pass.organizationName || pass.description || 'Pase',
    org: pass.organizationName || '',
    style,
    description: pass.description || '',
    fields: {
      header: mapFields(body.headerFields),
      primary: mapFields(body.primaryFields),
      secondary: mapFields(body.secondaryFields),
      auxiliary: mapFields(body.auxiliaryFields),
      back: mapFields(body.backFields),
    },
    barcode,
    colors: {
      bg: pass.backgroundColor || '#1b222d',
      fg: pass.foregroundColor || '#ffffff',
      label: pass.labelColor || pass.foregroundColor || '#cfd6e0',
    },
    logo: imgDataUri(pickImage(files, 'logo')),
    strip: imgDataUri(pickImage(files, 'strip')),
    thumbnail: imgDataUri(pickImage(files, 'thumbnail')),
    relevantMs: toMs(pass.relevantDate),
    expirationMs: toMs(pass.expirationDate),
    serial: pass.serialNumber || '',
  }
}

// Detecta si un ArrayBuffer es un ZIP (magic 'PK\x03\x04').
export function looksLikeZip (arrayBuffer) {
  const b = new Uint8Array(arrayBuffer.slice(0, 4))
  return b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5 || b[2] === 7)
}
