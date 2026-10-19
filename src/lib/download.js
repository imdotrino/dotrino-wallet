// Descargar o abrir un Blob generado en el cliente. Una sola copia para los
// detalles de evento (.ics), contacto (.vcf) y pase (.pkpass).

// Nombre de archivo seguro a partir de un título libre; `fallback` si queda vacío.
export function safeFilename (title, fallback, ext) {
  const base = (title || fallback).replace(/[^\w\d-]+/g, '-').slice(0, 40) || fallback
  return `${base}.${ext}`
}

export function downloadBlob (blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

// Abre el Blob en otra pestaña para que el sistema ofrezca su app (calendario, Wallet).
export function openBlob (blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 8000)
}
