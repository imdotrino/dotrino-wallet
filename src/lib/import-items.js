import { newId } from '@/lib/store.js'

// Colores que se reparten, en ciclo, a lo importado (cada tipo con su paleta).
const EVENT_COLORS = ['#f4b740', '#4dd0c4', '#9b8cff', '#6fcf73', '#ff9f43']
const CONTACT_COLORS = ['#4dd0c4', '#f4b740', '#ff6b6b', '#9b8cff', '#6fcf73']

/**
 * Convierte lo detectado (eventos de un .ics, contactos de un .vcf y pases ya
 * parseados) en ítems listos para guardar: con id nuevo, color en ciclo y
 * `source: 'import'`. Lo usan la importación automática y la hoja de importar.
 */
export function buildImportItems ({ events = [], contacts = [], passes = [] }) {
  const out = []
  events.forEach((e, i) => out.push({ ...e, type: 'event', id: newId(), color: EVENT_COLORS[i % EVENT_COLORS.length], source: 'import' }))
  contacts.forEach((c, i) => out.push({ ...c, type: 'contact', id: newId(), color: CONTACT_COLORS[i % CONTACT_COLORS.length], source: 'import' }))
  passes.forEach((p) => out.push({ ...p, id: newId(), source: 'import' }))
  return out
}
