# Agenda · Dotrino

**Tu billetera de eventos.** Guarda invitaciones y archivos `.ics` como
**tarjetas**, en tu propio servidor (vía `@dotrino/store`). Sin rejilla de
calendario: una colección ordenada por proximidad (Hoy · Esta semana · Próximos
· Pasados) que puedes buscar, editar, exportar y compartir.

> **Parte del ecosistema [Dotrino](https://dotrino.com).** Misión: aplicaciones
> que resuelven problemas comunes, respetando tu privacidad — sin anuncios, sin
> cookies, sin rastreo de datos, sin vender tu identidad a nadie.

## Qué hace

- **Importa** eventos `.ics` (pega el contenido, suelta o elige un archivo). Soporta
  varios `VEVENT` por archivo, eventos de todo el día, con hora (UTC/local) y
  recurrentes (`RRULE`, con cálculo de la próxima ocurrencia).
- **Crea** eventos a mano con un formulario simple.
- Cada evento es una **tarjeta** con su color, fecha, lugar y badges (todo el
  día / se repite).
- **Comparte** un evento por enlace `#fragment` + QR (`<dotrino-share>`): el
  contenido viaja en el fragmento, **nunca** llega al servidor.
- **Exporta** `.ics` o **añade al calendario** del dispositivo.
- **Bilingüe** es/en, **PWA** instalable y offline.

## Privacidad

- Todo se guarda en **tu** almacén del ecosistema (`store.dotrino.com`, IndexedDB
  local, con sync cifrado opcional a tu Drive). No hay backend propio.
- El contenido compartido viaja por `#fragment` (no indexable, no llega al
  servidor). Analítica cookieless autohosteada (GoatCounter), solo en producción.
- Sin trackers de terceros, sin cookies, sin anuncios.

## Desarrollo

```bash
npm install
npm run dev      # https local (cert autofirmado: aceptar)
npm run build    # -> dist/
```

Stack: Vite + Vue 3 + Pinia. El parser/serializer iCalendar (`src/lib/ics.js`) es
propio y sin dependencias de terceros. Convenciones comunes del ecosistema en
[`CONVENCIONES-APPS.md`](../CONVENCIONES-APPS.md).

## Pendiente (v2)

- Suscripción a **feeds webcal** (calendarios remotos que se refrescan).
- Recordatorios/notificaciones (`@dotrino/notifications`).
