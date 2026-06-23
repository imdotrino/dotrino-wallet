// Genera un QR como data-URL PNG en el cliente (lib `qrcode`, ya usada en el
// ecosistema). Para los códigos de barras de los pases .pkpass: el formato QR
// se renderiza fiel; PDF417/Aztec/Code128 no se rasterizan sin una librería
// pesada, así que el llamador muestra el valor y un QR del mensaje como respaldo.
import QRCode from 'qrcode'

export async function qrDataUrl (text, opts = {}) {
  if (!text) return ''
  try {
    return await QRCode.toDataURL(String(text), {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 6,
      color: { dark: '#000000', light: '#ffffff' },
      ...opts,
    })
  } catch {
    return ''
  }
}
