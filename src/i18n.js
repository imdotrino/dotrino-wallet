// i18n minimalista del ecosistema: reactivo, sin dependencias. Español neutro
// (tuteo, SIN voseo) e inglés. Detecta el idioma del navegador y lo persiste en
// localStorage (preferencia de UI efímera, permitido por §4).
import { ref, computed } from 'vue'

const STORE_KEY = 'wallet.lang'

const messages = {
  es: {
    appName: 'Wallet',
    tagline: 'Tu billetera digital',
    tabs: { event: 'Eventos', contact: 'Contactos', pass: 'Pases' },
    add: 'Añadir',
    import: 'Importar',
    newEvent: 'Nuevo evento',
    newContact: 'Nuevo contacto',
    search: 'Buscar',
    noResults: 'Nada coincide con la búsqueda.',
    empty: {
      eventTitle: 'Aún no tienes eventos.', eventHint: 'Importa un .ics o crea uno nuevo.',
      contactTitle: 'Aún no tienes contactos.', contactHint: 'Importa un .vcf o crea uno nuevo.',
      passTitle: 'Aún no tienes pases.', passHint: 'Importa un .pkpass (tarjeta de embarque, entrada, cupón…).',
    },
    groups: { today: 'Hoy', week: 'Esta semana', upcoming: 'Próximos', past: 'Pasados' },
    allDay: 'Todo el día',
    repeats: 'Se repite',
    // acciones
    edit: 'Editar',
    share: 'Compartir',
    exportIcs: 'Exportar .ics',
    exportVcf: 'Exportar .vcf',
    exportPkpass: 'Exportar .pkpass',
    openInWallet: 'Abrir en Wallet',
    addToCalendar: 'Añadir al calendario',
    delete: 'Eliminar',
    confirmDelete: '¿Eliminar esta tarjeta?',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    // formulario evento
    title: 'Título',
    start: 'Inicio',
    end: 'Fin',
    allDayLabel: 'Todo el día',
    location: 'Lugar',
    description: 'Notas',
    url: 'Enlace',
    color: 'Color',
    titleRequired: 'Ponle un título al evento.',
    // formulario contacto
    contactName: 'Nombre',
    org: 'Organización',
    jobTitle: 'Cargo',
    phone: 'Teléfono',
    email: 'Correo',
    address: 'Dirección',
    notes: 'Notas',
    nameRequired: 'Ponle un nombre al contacto.',
    call: 'Llamar',
    sendMail: 'Escribir',
    // pase
    passDetails: 'Detalles',
    barcodeFallback: 'Código no-QR: se muestra un QR del valor como respaldo. Para escanear en la puerta, usa “Exportar .pkpass”.',
    noBarcode: 'Este pase no tiene código.',
    // import
    importTitle: 'Importar',
    pasteHint: 'Pega .ics o .vcf, o suelta/elige un archivo (.ics, .vcf, .pkpass).',
    chooseFile: 'Elegir archivo',
    detected: 'detectado(s)',
    words: { event: 'evento', events: 'eventos', contact: 'contacto', contacts: 'contactos', pass: 'pase', passes: 'pases' },
    parsedNone: 'No se reconoció ningún evento, contacto ni pase.',
    importBtn: 'Guardar',
    // toasts
    saved: 'Guardado',
    deleted: 'Eliminado',
    imported: 'elementos importados',
    copied: 'Copiado',
    pkpassError: 'No se pudo leer el .pkpass.',
  },
  en: {
    appName: 'Wallet',
    tagline: 'Your digital wallet',
    tabs: { event: 'Events', contact: 'Contacts', pass: 'Passes' },
    add: 'Add',
    import: 'Import',
    newEvent: 'New event',
    newContact: 'New contact',
    search: 'Search',
    noResults: 'Nothing matches your search.',
    empty: {
      eventTitle: 'No events yet.', eventHint: 'Import an .ics or create a new one.',
      contactTitle: 'No contacts yet.', contactHint: 'Import a .vcf or create a new one.',
      passTitle: 'No passes yet.', passHint: 'Import a .pkpass (boarding pass, ticket, coupon…).',
    },
    groups: { today: 'Today', week: 'This week', upcoming: 'Upcoming', past: 'Past' },
    allDay: 'All day',
    repeats: 'Repeats',
    edit: 'Edit',
    share: 'Share',
    exportIcs: 'Export .ics',
    exportVcf: 'Export .vcf',
    exportPkpass: 'Export .pkpass',
    openInWallet: 'Open in Wallet',
    addToCalendar: 'Add to calendar',
    delete: 'Delete',
    confirmDelete: 'Delete this card?',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    title: 'Title',
    start: 'Start',
    end: 'End',
    allDayLabel: 'All day',
    location: 'Location',
    description: 'Notes',
    url: 'Link',
    color: 'Color',
    titleRequired: 'Give the event a title.',
    contactName: 'Name',
    org: 'Organization',
    jobTitle: 'Title',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    notes: 'Notes',
    nameRequired: 'Give the contact a name.',
    call: 'Call',
    sendMail: 'Email',
    passDetails: 'Details',
    barcodeFallback: 'Non-QR code: a QR of the value is shown as a fallback. To scan at the gate, use “Export .pkpass”.',
    noBarcode: 'This pass has no barcode.',
    importTitle: 'Import',
    pasteHint: 'Paste .ics or .vcf, or drop/choose a file (.ics, .vcf, .pkpass).',
    chooseFile: 'Choose file',
    detected: 'detected',
    words: { event: 'event', events: 'events', contact: 'contact', contacts: 'contacts', pass: 'pass', passes: 'passes' },
    parsedNone: 'No event, contact or pass recognized.',
    importBtn: 'Save',
    saved: 'Saved',
    deleted: 'Deleted',
    imported: 'items imported',
    copied: 'Copied',
    pkpassError: 'Could not read the .pkpass.',
  },
}

function detect () {
  const saved = localStorage.getItem(STORE_KEY)
  if (saved === 'es' || saved === 'en') return saved
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'
}

export const lang = ref(detect())

export function setLang (l) {
  lang.value = l
  localStorage.setItem(STORE_KEY, l)
  document.documentElement.lang = l
}

// t('groups.today') con acceso por puntos.
export function t (key) {
  const dict = messages[lang.value] || messages.es
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict) ?? key
}

export const tt = computed(() => (key) => t(key))

document.documentElement.lang = lang.value
