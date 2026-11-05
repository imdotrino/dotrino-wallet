// Identidad = vault id.dotrino.com (@dotrino/identity, única fuente del
// ecosistema). No reimplementamos nada: solo cacheamos la instancia. Si el vault
// no está disponible, la app sigue funcionando (Wallet es útil sin identidad;
// solo se queda sin el botón de perfil del topbar).
import { Identity } from '@dotrino/identity'

/** @type {import('@dotrino/identity').Identity | null} */
let identity = null

/** @returns {Promise<import('@dotrino/identity').Identity | null>} */
export async function getIdentity () {
  if (identity) return identity
  try {
    identity = await Identity.connect()
  } catch (e) {
    console.warn('[identity] vault unreachable:', e && /** @type {Error} */ (e).message)
    identity = null
  }
  return identity
}

/** @returns {string | null} */
export function myPubkey () { return identity?.me?.publickey || null }
/** @returns {string | null} */
export function myName () { return identity?.me?.nickname || null }
