// Capa fina sobre @dotrino/store (OBLIGATORIO como almacén del usuario, §4 de
// CONVENCIONES-APPS). Wallet guarda tres tipos de tarjeta (event/contact/pass)
// en un único "hilo" cuyas entradas llevan un campo `type`. Append-only con id
// estable: editar = borrar + volver a añadir con el mismo id (upsert).

import { Store } from '@dotrino/store'
import { getIdentity } from '@/services/identity.js'

const THREAD = 'items'
const APP_ID = 'wallet.dotrino.com'

let store = null

export async function getStore () {
  if (store) return store
  // Atado al PERFIL: así lo tuyo se respalda en tu bóveda y no se mezcla con otras
  // cuentas del aparato. Hasta 2026-09-30 conectaba sin identidad y todo quedaba en el
  // espacio común del navegador, sin respaldo; `adoptCommon` lo trae al perfil una vez
  // (sin borrar el original). Sin identidad NO se sigue: caer al espacio común otra vez
  // sería perder el respaldo en silencio.
  const identity = await getIdentity()
  if (!identity) throw Object.assign(new Error('the identity (id.dotrino.com) is not available'), { code: 'no-identity' })
  store = await Store.connect({ identity, maxPerThread: 5000, adoptCommon: [THREAD] })
  // "Recientes" del ecosistema: registra la apertura de la app.
  store.recordOpen(APP_ID).catch(() => {})
  return store
}

export async function loadItems () {
  const s = await getStore()
  const entries = await s.listThread(THREAD, { limit: 5000 })
  return entries.filter((e) => e && e.id && e.type)
}

// Upsert: si ya existe una entrada con ese id la reemplaza.
export async function saveItem (item) {
  const s = await getStore()
  const entry = { ...item }
  if (!entry.id) entry.id = newId()
  entry.ts = Date.now()
  await s.removeMessage(THREAD, entry.id).catch(() => {})
  await s.appendMessage(THREAD, entry)
  return entry
}

export async function deleteItem (id) {
  const s = await getStore()
  await s.removeMessage(THREAD, id)
}

export function newId () {
  try { return crypto.randomUUID() } catch { return 'id-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36) }
}
