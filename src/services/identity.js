// Identidad = vault id.dotrino.com (@dotrino/identity, única fuente del
// ecosistema). No reimplementamos nada: solo cacheamos la instancia. Si el vault
// no está disponible, la app sigue funcionando (Wallet es útil sin identidad;
// solo se queda sin el botón de perfil del topbar).
import { Identity } from '@dotrino/identity'

let identity = null

export async function getIdentity () {
  if (identity) return identity
  try {
    identity = await Identity.connect()
  } catch (e) {
    console.warn('[identity] vault inalcanzable:', e && e.message)
    identity = null
  }
  return identity
}

export function myPubkey () { return identity?.me?.publickey || null }
export function myName () { return identity?.me?.nickname || null }
