# Wallet · Dotrino

**Tu billetera digital.** Guarda **eventos** (`.ics`), **contactos** (`.vcf`) y
**pases** (`.pkpass` — tarjetas de embarque, entradas, cupones) como **tarjetas**,
en tu propio servidor (vía `@dotrino/store`). Organizadas en pestañas, buscables,
con importar / crear / editar / compartir / exportar.

> **Parte del ecosistema [Dotrino](https://dotrino.com).** Misión: aplicaciones
> que resuelven problemas comunes, respetando tu privacidad — sin anuncios, sin
> cookies, sin rastreo de datos, sin vender tu identidad a nadie.

## Qué hace

- **Eventos `.ics`**: importa/crea/edita, agrupados por proximidad (Hoy · Esta
  semana · Próximos · Pasados), todo el día y recurrentes; exporta o añade al
  calendario del dispositivo.
- **Contactos `.vcf`**: importa/crea/edita tarjetas de contacto (teléfono, correo,
  organización, dirección, foto); llama/escribe; exporta `.vcf`.
- **Pases `.pkpass`**: importa pases de Apple/Google Wallet y míralos con su look
  (logo, colores, campos, código). Exporta el `.pkpass` original o ábrelo en la
  Wallet nativa.
- **Compartir** cualquier tarjeta por enlace `#fragment` + QR (`<dotrino-share>`):
  el contenido viaja en el fragmento, **nunca** llega al servidor.
- **Bilingüe** es/en, **PWA** instalable y offline.

### Notas sobre `.pkpass`

El `.pkpass` es un ZIP firmado; lo descomprimimos en el navegador con
`DecompressionStream` (sin librería de ZIP) y parseamos `pass.json`. El código
**QR** se renderiza fiel; **PDF417/Aztec/Code128** no se rasterizan sin una
librería pesada, así que para esos se muestra el valor y un QR de respaldo —
para escanear en la puerta, **exporta el `.pkpass` original** o ábrelo en la
Wallet nativa (que además valida la firma). Los pases no se crean a mano.

## Privacidad

Todo se guarda en **tu** almacén del ecosistema (`store.dotrino.com`, IndexedDB
local, sync cifrado opcional a tu Drive). No hay backend propio. El contenido
compartido viaja por `#fragment` (no indexable). Analítica cookieless
autohosteada (GoatCounter), solo en producción. Sin trackers de terceros.

## Desarrollo

```bash
npm install
npm run dev      # https local (cert autofirmado: aceptar)
npm run build    # -> dist/
```

Stack: Vite + Vue 3 + Pinia. Parsers propios sin dependencias de terceros:
`src/lib/ics.js` (iCalendar), `src/lib/vcf.js` (vCard), `src/lib/pkpass.js`
(ZIP + pass.json). QR de pases con `qrcode`. Convenciones del ecosistema en
[`CONVENCIONES-APPS.md`](../CONVENCIONES-APPS.md).

## Pendiente (v2)

- Suscripción a **feeds webcal** (calendarios remotos que se refrescan).
- Recordatorios/notificaciones (`@dotrino/notifications`).
- Rasterizar barcodes PDF417/Aztec de los pases.
