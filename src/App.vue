<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWallet } from '@/stores/items.js'
import { lang, setLang, t } from '@/i18n.js'
import { eventToICS } from '@/lib/ics.js'
import { contactToVCF } from '@/lib/vcf.js'
import { parsePkpass, b64ToBytes, bytesToB64, looksLikeZip } from '@/lib/pkpass.js'
import EventCard from '@/components/EventCard.vue'
import EventDetail from '@/components/EventDetail.vue'
import EventForm from '@/components/EventForm.vue'
import ContactCard from '@/components/ContactCard.vue'
import ContactDetail from '@/components/ContactDetail.vue'
import ContactForm from '@/components/ContactForm.vue'
import PassCard from '@/components/PassCard.vue'
import PassDetail from '@/components/PassDetail.vue'
import ImportSheet from '@/components/ImportSheet.vue'
import iconUrl from '/icon.svg'

const store = useWallet()

const TABS = ['event', 'contact', 'pass']
const GROUP_ORDER = ['today', 'week', 'upcoming', 'past']

const detail = ref(null)          // { type, item }
const showEventForm = ref(false)
const editingEvent = ref(null)
const showContactForm = ref(false)
const editingContact = ref(null)
const showImport = ref(false)
const importPrefill = ref('')
const importPrefillPasses = ref([])
const toast = ref('')
const shareEl = ref(null)

function flash (msg) {
  toast.value = msg
  setTimeout(() => { if (toast.value === msg) toast.value = '' }, 2200)
}

// ---------- base64url para #fragment ----------
function toUrlSafe (b64) { return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
function fromUrlSafe (s) { return s.replace(/-/g, '+').replace(/_/g, '/') }
function encodeText (str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return toUrlSafe(btoa(bin))
}
function decodeText (s) {
  const bin = atob(fromUrlSafe(s))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

// ---------- alta / edición ----------
function openAdd () {
  if (store.tab === 'event') { editingEvent.value = null; showEventForm.value = true }
  else if (store.tab === 'contact') { editingContact.value = null; showContactForm.value = true }
  else openImport()
}
function openImport (prefill = '', passes = []) {
  importPrefill.value = prefill
  importPrefillPasses.value = passes
  showImport.value = true
}

function openDetail (type, item) { detail.value = { type, item } }
function closeDetail () { detail.value = null }

function editEvent (ev) { closeDetail(); editingEvent.value = ev; showEventForm.value = true }
function editContact (c) { closeDetail(); editingContact.value = c; showContactForm.value = true }

async function saveEvent (ev) {
  await store.upsert({ ...ev, type: 'event' })
  showEventForm.value = false; editingEvent.value = null
  store.tab = 'event'; flash(t('saved'))
}
async function saveContact (c) {
  await store.upsert({ ...c, type: 'contact' })
  showContactForm.value = false; editingContact.value = null
  store.tab = 'contact'; flash(t('saved'))
}
async function onDelete (item) { await store.remove(item.id); closeDetail(); flash(t('deleted')) }

async function onImport (items) {
  for (const it of items) await store.upsert(it)
  showImport.value = false
  // salta a la pestaña del primer tipo importado
  if (items[0]) store.tab = items[0].type
  flash(`${items.length} ${t('imported')}`)
  if (location.hash) history.replaceState(null, '', location.pathname + location.search)
}

// ---------- compartir ----------
function shareItem (item) {
  let frag = ''
  if (item.type === 'event') frag = 'ev=' + encodeText(eventToICS(item))
  else if (item.type === 'contact') frag = 'vc=' + encodeText(contactToVCF(item))
  else if (item.type === 'pass') frag = 'pk=' + toUrlSafe(item.rawB64)
  const el = shareEl.value
  if (!el) return
  el.url = `${location.origin}${location.pathname}#${frag}`
  el.text = item.title || item.fn || t('appName')
  el.setAttribute('lang', lang.value)
  el.open = true
}

// ---------- recepción por #fragment ----------
async function handleIncoming () {
  const h = location.hash
  let m
  if ((m = h.match(/[#&]ev=([^&]+)/))) { try { openImport(decodeText(m[1])) } catch {} }
  else if ((m = h.match(/[#&]vc=([^&]+)/))) { try { openImport(decodeText(m[1])) } catch {} }
  else if ((m = h.match(/[#&]pk=([^&]+)/))) {
    try {
      const rawB64 = fromUrlSafe(m[1])
      const bytes = b64ToBytes(rawB64)
      const parsed = await parsePkpass(bytes.buffer)
      openImport('', [{ ...parsed, type: 'pass', rawB64 }])
    } catch {}
  }
}

// ---------- archivos abiertos con la app (File Handling API) ----------
async function handleFiles (files) {
  let text = ''
  const passes = []
  for (const f of files) {
    if (!f) continue
    const isPkpass = /\.pkpass$/i.test(f.name || '') || (f.type || '').includes('pkpass')
    const ab = await f.arrayBuffer()
    if (isPkpass || looksLikeZip(ab)) {
      try { passes.push({ ...(await parsePkpass(ab)), type: 'pass', rawB64: bytesToB64(new Uint8Array(ab)) }) } catch {}
    } else {
      text += (text ? '\n' : '') + new TextDecoder().decode(new Uint8Array(ab))
    }
  }
  if (text || passes.length) openImport(text, passes)
}

function setupLaunchQueue () {
  if (!('launchQueue' in window) || !('LaunchParams' in window) || !('files' in window.LaunchParams.prototype)) return
  window.launchQueue.setConsumer(async (params) => {
    const files = []
    for (const h of params.files || []) { try { files.push(await h.getFile()) } catch {} }
    if (files.length) await handleFiles(files)
  })
}

// Web Share Target: el SW (share-target-sw.js) guardó los archivos compartidos
// en Cache Storage y redirigió con ?share-target=N. Los leemos y los importamos.
async function handleShareTarget () {
  const n = new URLSearchParams(location.search).get('share-target')
  if (n == null) return
  history.replaceState(null, '', location.pathname) // limpia la query
  try {
    const cache = await caches.open('wallet-share')
    const files = []
    for (const req of await cache.keys()) {
      const res = await cache.match(req)
      if (!res) continue
      const blob = await res.blob()
      const name = decodeURIComponent(res.headers.get('x-filename') || 'archivo')
      files.push(new File([blob], name, { type: res.headers.get('content-type') || '' }))
      await cache.delete(req)
    }
    if (files.length) await handleFiles(files)
  } catch { /* sin caché de compartir */ }
}

const tabIsEmpty = computed(() => store.tabIsEmpty)

onMounted(async () => {
  setupLaunchQueue() // registra el consumidor cuanto antes (los launch params se encolan)
  await store.load()
  // arranca en la primera pestaña con contenido
  const firstWith = TABS.find((t) => store.counts[t] > 0)
  if (firstWith) store.tab = firstWith
  await handleShareTarget()
  await handleIncoming()
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
      <dotrino-install
        class="install-btn"
        :lang="lang"
        android-apk="https://wallet.dotrino.com/app/wallet-1.0.4.apk"
        android-package="com.dotrino.wallet"
        style="--cc-install-color:var(--text);--cc-install-bg:var(--bg-elev);--cc-install-bg-hover:var(--bg-elev);--cc-install-radius:999px;--cc-install-pad:9px 15px;--cc-install-font-size:.9rem;--cc-install-accent:var(--accent);--cc-install-modal-bg:#161b22;--cc-install-modal-color:var(--text)"
      ></dotrino-install>
      <button class="btn btn-ghost" data-testid="import-open" @click="openImport()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
        {{ t('import') }}
      </button>
      <button v-if="store.tab !== 'pass'" class="btn btn-primary desktop-add" data-testid="add-open" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        {{ t('add') }}
      </button>
      <div class="lang-selector" role="group" aria-label="es / en">
        <button :class="{ on: lang === 'es' }" @click="setLang('es')">ES</button>
        <button :class="{ on: lang === 'en' }" @click="setLang('en')">EN</button>
      </div>
    </div>
  </header>

  <nav class="tabs" role="tablist">
    <button v-for="tb in TABS" :key="tb" class="tab" :class="{ on: store.tab === tb }"
            role="tab" :aria-selected="store.tab === tb" :data-testid="'tab-' + tb" @click="store.tab = tb">
      {{ t('tabs.' + tb) }}
      <span v-if="store.counts[tb]" class="tab-count">{{ store.counts[tb] }}</span>
    </button>
  </nav>

  <main class="wrap">
    <div class="searchbar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
      <input v-model="store.query" type="search" data-testid="search" :placeholder="t('search')" :aria-label="t('search')" />
    </div>

    <!-- vacío -->
    <div v-if="tabIsEmpty && !store.query" class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="3" /><path d="M2 10h20" /></svg>
      <h2>{{ t('empty.' + store.tab + 'Title') }}</h2>
      <p>{{ t('empty.' + store.tab + 'Hint') }}</p>
      <button v-if="store.tab !== 'pass'" class="btn btn-primary" style="display:inline-flex" @click="openAdd">
        {{ store.tab === 'event' ? t('newEvent') : t('newContact') }}
      </button>
      <button v-else class="btn btn-primary" style="display:inline-flex" @click="openImport()">{{ t('import') }}</button>
    </div>
    <div v-else-if="tabIsEmpty" class="empty" style="padding:8vh 0">{{ t('noResults') }}</div>

    <!-- EVENTOS -->
    <template v-else-if="store.tab === 'event'">
      <section v-for="key in GROUP_ORDER" :key="key" v-show="store.eventGroups[key].length">
        <h3 class="group-title">{{ t('groups.' + key) }}</h3>
        <div class="cards">
          <EventCard v-for="ev in store.eventGroups[key]" :key="ev.id" :event="ev" @open="openDetail('event', $event)" />
        </div>
      </section>
    </template>

    <!-- CONTACTOS -->
    <div v-else-if="store.tab === 'contact'" class="cards">
      <ContactCard v-for="c in store.contactsSorted" :key="c.id" :contact="c" @open="openDetail('contact', $event)" />
    </div>

    <!-- PASES -->
    <div v-else class="cards">
      <PassCard v-for="p in store.passesSorted" :key="p.id" :pass="p" @open="openDetail('pass', $event)" />
    </div>
  </main>

  <button v-if="store.tab !== 'pass'" class="fab" data-testid="add-fab" :aria-label="t('add')" @click="openAdd">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
  </button>

  <!-- detalles -->
  <EventDetail v-if="detail && detail.type === 'event'" :event="detail.item"
    @edit="editEvent" @delete="onDelete" @share="shareItem" @close="closeDetail" />
  <ContactDetail v-if="detail && detail.type === 'contact'" :contact="detail.item"
    @edit="editContact" @delete="onDelete" @share="shareItem" @close="closeDetail" />
  <PassDetail v-if="detail && detail.type === 'pass'" :pass="detail.item"
    @delete="onDelete" @share="shareItem" @close="closeDetail" />

  <!-- formularios -->
  <EventForm v-if="showEventForm" :event="editingEvent"
    @save="saveEvent" @cancel="showEventForm = false; editingEvent = null" />
  <ContactForm v-if="showContactForm" :contact="editingContact"
    @save="saveContact" @cancel="showContactForm = false; editingContact = null" />

  <ImportSheet v-if="showImport" :prefill="importPrefill" :prefillPasses="importPrefillPasses"
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
