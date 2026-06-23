<script setup>
import { ref, computed } from 'vue'
import { t, lang } from '@/i18n.js'
import { formatWhen, eventToICS } from '@/lib/ics.js'

const props = defineProps({ event: Object })
const emit = defineEmits(['edit', 'delete', 'share', 'close'])

const confirming = ref(false)
const when = computed(() => formatWhen(props.event, lang.value))
const accent = computed(() => props.event.color || 'var(--accent)')

function filename () {
  const base = (props.event.title || 'evento').replace(/[^\w\d-]+/g, '-').slice(0, 40) || 'evento'
  return `${base}.ics`
}

function blobUrl () {
  return URL.createObjectURL(new Blob([eventToICS(props.event)], { type: 'text/calendar' }))
}

function exportIcs () {
  const a = document.createElement('a')
  a.href = blobUrl()
  a.download = filename()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

// Abre el .ics para que el SO ofrezca añadirlo al calendario del dispositivo.
function addToCalendar () {
  const url = blobUrl()
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 8000)
}
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="sheet" :style="{ '--card-accent': accent }">
      <div class="sheet-head">
        <span class="sheet-accent"></span>
        <h2>{{ event.title || '—' }}</h2>
        <button class="btn btn-ghost btn-icon" :aria-label="t('close')" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div class="detail-meta">
        <div class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <p>{{ when }}<template v-if="event.allDay"> · {{ t('allDay') }}</template></p>
        </div>
        <div v-if="event.rrule" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
          <p>{{ t('repeats') }} · {{ event.rrule }}</p>
        </div>
        <div v-if="event.location" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <p>{{ event.location }}</p>
        </div>
        <div v-if="event.url" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
          <a :href="event.url" target="_blank" rel="noopener">{{ event.url }}</a>
        </div>
        <div v-if="event.description" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
          <p>{{ event.description }}</p>
        </div>
      </div>

      <div class="action-list">
        <button class="btn" @click="$emit('edit', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          {{ t('edit') }}
        </button>
        <button class="btn" data-testid="ev-share" @click="$emit('share', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
          {{ t('share') }}
        </button>
        <button class="btn" @click="addToCalendar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" /></svg>
          {{ t('addToCalendar') }}
        </button>
        <button class="btn" @click="exportIcs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
          {{ t('exportIcs') }}
        </button>

        <button v-if="!confirming" class="btn btn-danger" @click="confirming = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
          {{ t('delete') }}
        </button>
        <div v-else class="sheet-actions" style="margin-top:0">
          <button class="btn btn-ghost" @click="confirming = false">{{ t('cancel') }}</button>
          <button class="btn btn-danger" data-testid="ev-delete-confirm" @click="$emit('delete', event)">{{ t('confirmDelete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
