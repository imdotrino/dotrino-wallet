/* Web Share Target — handler inyectado en el service worker (Workbox) vía
 * importScripts. Cuando Android comparte un archivo a Wallet, el sistema hace un
 * POST multipart a ./share-target; aquí leemos los archivos, los guardamos en
 * Cache Storage y redirigimos a la app, que los lee al cargar (?share-target).
 * No se puede pasar el archivo por la URL, por eso el handoff por caché. */
const SHARE_CACHE = 'wallet-share'

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'POST' || !url.pathname.endsWith('/share-target')) return

  event.respondWith((async () => {
    let count = 0
    try {
      const form = await event.request.formData()
      const files = form.getAll('file').filter(Boolean)
      const cache = await caches.open(SHARE_CACHE)
      for (const req of await cache.keys()) await cache.delete(req) // limpia envíos previos
      for (const f of files) {
        await cache.put(
          new Request('__shared__/' + count),
          new Response(f, {
            headers: {
              'content-type': f.type || 'application/octet-stream',
              'x-filename': encodeURIComponent(f.name || ('archivo-' + count)),
            },
          }),
        )
        count++
      }
    } catch (e) { /* sin archivos legibles */ }
    // Redirige a la app (mismo scope) con la marca para que lea la caché.
    return Response.redirect('./?share-target=' + count, 303)
  })())
})
