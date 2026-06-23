// Capa fina sobre @dotrino/store (OBLIGATORIO como almacén del usuario, §4 de
// CONVENCIONES-APPS). Modelamos los eventos como un único "hilo" cuyas entradas
// son los eventos. El store es append-only con id estable: para editar borramos
// la entrada y la volvemos a añadir con el mismo id (upsert).

import { Store } from '@dotrino/store'

const THREAD = 'events'
const APP_ID = 'agenda.dotrino.com'

let store = null

export async function getStore () {
  if (store) return store
  store = await Store.connect()
  await store.setMaxPerThread(5000).catch(() => {})
  // "Recientes" del ecosistema: registra la apertura de la app.
  store.recordOpen(APP_ID).catch(() => {})
  return store
}

export async function loadEvents () {
  const s = await getStore()
  const entries = await s.listThread(THREAD, { limit: 5000 })
  return entries.filter((e) => e && e.id && e.start)
}

// Upsert: si ya existe una entrada con ese id la reemplaza.
export async function saveEvent (ev) {
  const s = await getStore()
  const entry = { ...ev }
  if (!entry.id) entry.id = newId()
  entry.ts = Date.now()
  await s.removeMessage(THREAD, entry.id).catch(() => {})
  await s.appendMessage(THREAD, entry)
  return entry
}

export async function deleteEvent (id) {
  const s = await getStore()
  await s.removeMessage(THREAD, id)
}

export async function statsInfo () {
  const s = await getStore()
  return s.getStats()
}

export function newId () {
  try { return crypto.randomUUID() } catch { return 'id-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36) }
}
