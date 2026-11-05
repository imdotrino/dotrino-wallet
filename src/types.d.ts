declare module "*.vue" {
  const component: any;
  export default component;
}
declare module "virtual:pwa-register" {
  export function registerSW(options?: any): (reloadPage?: boolean) => Promise<void>;
  export const updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

// ---------- El modelo de la app ----------
// Lo guardado en el store son objetos planos: un solo hilo con tres tipos de tarjeta.

interface WalletEventData {
  uid?: string
  title?: string
  location?: string
  description?: string
  url?: string
  allDay: boolean
  /** 'YYYY-MM-DD' (todo el día) o 'YYYY-MM-DDTHH:MM', hora local. */
  start: string
  end: string | null
  tz: string | null
  rrule: string | null
  raw?: string
  _startMs?: number
  _endMs?: number
}

interface ContactLine { value: string, type: string }

interface WalletContactData {
  fn: string
  n?: { family: string, given: string, additional: string, prefix: string, suffix: string }
  tels: ContactLine[]
  emails: ContactLine[]
  urls: string[]
  adrs: ContactLine[]
  org: string
  title: string
  jobTitle?: string
  note: string
  photo: string
  bday: string
  raw?: string
}

interface PassField { label: string, value: string }

interface WalletPassData {
  title: string
  org: string
  style: string
  description: string
  fields: { header: PassField[], primary: PassField[], secondary: PassField[], auxiliary: PassField[], back: PassField[] }
  barcode: { format: string, message: string, altText: string } | null
  colors: { bg: string, fg: string, label: string }
  logo: string
  strip: string
  thumbnail: string
  relevantMs: number | null
  expirationMs: number | null
  serial: string
  /** El .pkpass original en base64, para re-exportarlo. */
  rawB64?: string
}

type WalletItemType = 'event' | 'contact' | 'pass'

/** Una tarjeta guardada: los campos de su tipo más lo común. */
type WalletItem = {
  id: string
  type: WalletItemType
  color?: string
  source?: string
  ts?: number
} & Partial<WalletEventData> & Partial<WalletContactData> & Partial<WalletPassData>
