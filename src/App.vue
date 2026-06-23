<script setup>
import { ref, onMounted } from 'vue'
import { useEvents } from '@/stores/events.js'
import { lang, setLang, t } from '@/i18n.js'
import { eventToICS } from '@/lib/ics.js'
import EventCard from '@/components/EventCard.vue'
import EventDetail from '@/components/EventDetail.vue'
import EventForm from '@/components/EventForm.vue'
import ImportSheet from '@/components/ImportSheet.vue'
import iconUrl from '/icon.svg'

const store = useEvents()

const detailEvent = ref(null)
const showForm = ref(false)
const editing = ref(null)
const showImport = ref(false)
const importPrefill = ref('')
const toast = ref('')
const shareEl = ref(null)

const GROUP_ORDER = ['today', 'week', 'upcoming', 'past']

function flash (msg) {
  toast.value = msg
  setTimeout(() => { if (toast.value === msg) toast.value = '' }, 2200)
}

// ---------- base64url para #fragment ----------
function encodeFragment (str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function decodeFragment (b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// ---------- acciones ----------
function openNew () { editing.value = null; showForm.value = true }
function openEdit (ev) { editing.value = ev; detailEvent.value = null; showForm.value = true }
function openImport (prefill = '') { importPrefill.value = prefill; showImport.value = true }

async function onSave (ev) {
  await store.upsert(ev)
  showForm.value = false
  editing.value = null
  flash(t('saved'))
}

async function onDelete (ev) {
  await store.remove(ev.id)
  detailEvent.value = null
  flash(t('deleted'))
}

async function onImport (events) {
  for (const ev of events) await store.upsert(ev)
  showImport.value = false
  flash(`${events.length} ${t('imported')}`)
  // limpia el fragmento entrante
  if (location.hash) history.replaceState(null, '', location.pathname + location.search)
}

function shareEvent (ev) {
  const url = `${location.origin}${location.pathname}#ev=${encodeFragment(eventToICS(ev))}`
  const el = shareEl.value
  if (!el) return
  el.url = url
  el.text = ev.title || t('appName')
  el.setAttribute('lang', lang.value)
  el.open = true
}

onMounted(async () => {
  await store.load()
  // ¿Llegó un evento compartido por #fragment?
  const m = location.hash.match(/[#&]ev=([^&]+)/)
  if (m) {
    try { openImport(decodeFragment(m[1])) } catch { /* fragmento inválido */ }
  }
})
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <img :src="iconUrl" alt="" />
      <b>{{ t('appName') }}</b>
      <span>· {{ t('tagline') }}</span>
    </div>
    <div class="topbar-actions">
      <button class="btn btn-ghost" data-testid="import-open" @click="openImport()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
        {{ t('import') }}
      </button>
      <button class="btn btn-primary desktop-add" data-testid="add-open" @click="openNew">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        {{ t('add') }}
      </button>
      <div class="lang-selector" role="group" aria-label="es / en">
        <button :class="{ on: lang === 'es' }" @click="setLang('es')">ES</button>
        <button :class="{ on: lang === 'en' }" @click="setLang('en')">EN</button>
      </div>
    </div>
  </header>

  <main class="wrap">
    <div class="searchbar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
      <input v-model="store.query" type="search" data-testid="search" :placeholder="t('search')" :aria-label="t('search')" />
    </div>

    <div v-if="store.isEmpty" class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      <h2>{{ t('empty') }}</h2>
      <p>{{ t('emptyHint') }}</p>
      <button class="btn btn-primary" @click="openNew" style="display:inline-flex">{{ t('newEvent') }}</button>
    </div>

    <template v-else>
      <template v-for="key in GROUP_ORDER" :key="key">
        <section v-if="store.groups[key].length">
          <h3 class="group-title">{{ t('groups.' + key) }}</h3>
          <div class="cards">
            <EventCard v-for="ev in store.groups[key]" :key="ev.id" :event="ev" @open="detailEvent = $event" />
          </div>
        </section>
      </template>
      <p v-if="store.query && !GROUP_ORDER.some(k => store.groups[k].length)" class="empty" style="padding:8vh 0">
        {{ t('noResults') }}
      </p>
    </template>
  </main>

  <button class="fab" data-testid="add-fab" :aria-label="t('add')" @click="openNew">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
  </button>

  <EventDetail v-if="detailEvent" :event="detailEvent"
    @edit="openEdit" @delete="onDelete" @share="shareEvent" @close="detailEvent = null" />
  <EventForm v-if="showForm" :event="editing"
    @save="onSave" @cancel="showForm = false; editing = null" />
  <ImportSheet v-if="showImport" :prefill="importPrefill"
    @import="onImport" @cancel="showImport = false" />

  <dotrino-share
    ref="shareEl"
    :lang="lang"
    style="--ccs-bg:#161b22;--ccs-text:#e6edf3;--ccs-muted:#9aa6b6;--ccs-border:#2a3340;--ccs-accent:#f4b740;--ccs-accent-text:#1a1407;--ccs-input-bg:#0e1116;--ccs-overlay:rgba(4,7,11,.6)"
    @cc-share-close="shareEl && (shareEl.open = false)"
  ></dotrino-share>

  <Transition name="toast">
    <div v-if="toast" class="toast" data-testid="toast">{{ toast }}</div>
  </Transition>
</template>
