// i18n minimalista del ecosistema: reactivo, sin dependencias. Español neutro
// (tuteo, SIN voseo) e inglés. Detecta el idioma del navegador y lo persiste en
// localStorage (preferencia de UI efímera, permitido por §4).
import { ref, computed } from 'vue'

const STORE_KEY = 'agenda.lang'

const messages = {
  es: {
    appName: 'Agenda',
    tagline: 'Tu billetera de eventos',
    add: 'Añadir',
    import: 'Importar .ics',
    newEvent: 'Nuevo evento',
    search: 'Buscar eventos',
    empty: 'Aún no tienes eventos guardados.',
    emptyHint: 'Importa un archivo .ics o crea uno nuevo.',
    noResults: 'Ningún evento coincide con la búsqueda.',
    groups: { today: 'Hoy', week: 'Esta semana', upcoming: 'Próximos', past: 'Pasados' },
    allDay: 'Todo el día',
    repeats: 'Se repite',
    // acciones
    edit: 'Editar',
    share: 'Compartir',
    exportIcs: 'Exportar .ics',
    addToCalendar: 'Añadir al calendario',
    delete: 'Eliminar',
    confirmDelete: '¿Eliminar este evento?',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    // formulario
    title: 'Título',
    start: 'Inicio',
    end: 'Fin',
    allDayLabel: 'Todo el día',
    location: 'Lugar',
    description: 'Notas',
    url: 'Enlace',
    color: 'Color',
    titleRequired: 'Ponle un título al evento.',
    // import
    importTitle: 'Importar eventos',
    pasteHint: 'Pega el contenido .ics o suelta/elige un archivo.',
    chooseFile: 'Elegir archivo',
    parsedOne: 'evento detectado',
    parsedMany: 'eventos detectados',
    parsedNone: 'No se encontraron eventos en el archivo.',
    importBtn: 'Guardar eventos',
    // toasts
    saved: 'Evento guardado',
    deleted: 'Evento eliminado',
    imported: 'eventos importados',
    copied: 'Copiado',
  },
  en: {
    appName: 'Agenda',
    tagline: 'Your wallet of events',
    add: 'Add',
    import: 'Import .ics',
    newEvent: 'New event',
    search: 'Search events',
    empty: 'You have no saved events yet.',
    emptyHint: 'Import an .ics file or create a new one.',
    noResults: 'No event matches your search.',
    groups: { today: 'Today', week: 'This week', upcoming: 'Upcoming', past: 'Past' },
    allDay: 'All day',
    repeats: 'Repeats',
    edit: 'Edit',
    share: 'Share',
    exportIcs: 'Export .ics',
    addToCalendar: 'Add to calendar',
    delete: 'Delete',
    confirmDelete: 'Delete this event?',
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
    importTitle: 'Import events',
    pasteHint: 'Paste .ics content or drop/choose a file.',
    chooseFile: 'Choose file',
    parsedOne: 'event detected',
    parsedMany: 'events detected',
    parsedNone: 'No events found in the file.',
    importBtn: 'Save events',
    saved: 'Event saved',
    deleted: 'Event deleted',
    imported: 'events imported',
    copied: 'Copied',
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
