<script setup>
import { ref, computed } from 'vue'
import { t, lang } from '@/i18n.js'
import { parseICS } from '@/lib/ics.js'
import { parseVCF } from '@/lib/vcf.js'
import { parsePkpass, looksLikeZip, bytesToB64 } from '@/lib/pkpass.js'
import { newId } from '@/lib/store.js'

const props = defineProps({
  prefill: { type: String, default: '' },
  prefillPasses: { type: Array, default: () => [] },
})
const emit = defineEmits(['import', 'cancel'])

const text = ref(props.prefill || '')
const pendingPasses = ref([...props.prefillPasses]) // pases ya parseados (binarios)
const dragging = ref(false)
const fileInput = ref(null)
const error = ref('')

const EVENT_COLORS = ['#f4b740', '#4dd0c4', '#9b8cff', '#6fcf73', '#ff9f43']
const CONTACT_COLORS = ['#4dd0c4', '#f4b740', '#ff6b6b', '#9b8cff', '#6fcf73']

const events = computed(() => parseICS(text.value).events)
const contacts = computed(() => parseVCF(text.value).contacts)
const total = computed(() => events.value.length + contacts.value.length + pendingPasses.value.length)

const summary = computed(() => {
  const w = (n, s, p) => `${n} ${n === 1 ? t('words.' + s) : t('words.' + p)}`
  const parts = []
  if (events.value.length) parts.push(w(events.value.length, 'event', 'events'))
  if (contacts.value.length) parts.push(w(contacts.value.length, 'contact', 'contacts'))
  if (pendingPasses.value.length) parts.push(w(pendingPasses.value.length, 'pass', 'passes'))
  return parts.length ? `${parts.join(' · ')} ${t('detected')}` : ''
})

async function handleFiles (files) {
  error.value = ''
  for (const f of Array.from(files || [])) {
    const isPkpass = /\.pkpass$/i.test(f.name) || f.type.includes('pkpass')
    if (isPkpass) { await addPass(f); continue }
    const buf = await f.arrayBuffer()
    if (looksLikeZip(buf)) { await addPass(f, buf); continue }
    text.value = new TextDecoder().decode(new Uint8Array(buf))
  }
}

async function addPass (f, buf) {
  try {
    const ab = buf || (await f.arrayBuffer())
    const parsed = await parsePkpass(ab)
    pendingPasses.value.push({ ...parsed, type: 'pass', rawB64: bytesToB64(new Uint8Array(ab)) })
  } catch {
    error.value = t('pkpassError')
  }
}

function onDrop (e) { dragging.value = false; handleFiles(e.dataTransfer?.files) }
function pick () { fileInput.value?.click() }

function doImport () {
  const out = []
  events.value.forEach((e, i) => out.push({ ...e, type: 'event', id: newId(), color: EVENT_COLORS[i % EVENT_COLORS.length], source: 'import' }))
  contacts.value.forEach((c, i) => out.push({ ...c, type: 'contact', id: newId(), color: CONTACT_COLORS[i % CONTACT_COLORS.length], source: 'import' }))
  pendingPasses.value.forEach((p) => out.push({ ...p, id: newId(), source: 'import' }))
  emit('import', out)
}
</script>

<template>
  <div class="overlay" @click.self="$emit('cancel')">
    <div class="sheet">
      <div class="sheet-head">
        <span class="sheet-accent"></span>
        <h2>{{ t('importTitle') }}</h2>
        <button class="btn btn-ghost btn-icon" :aria-label="t('close')" @click="$emit('cancel')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div class="dropzone" :class="{ drag: dragging }"
           @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
        {{ t('pasteHint') }}
      </div>

      <div class="field">
        <textarea v-model="text" data-testid="import-text" placeholder="BEGIN:VCALENDAR… / BEGIN:VCARD…"
                  style="min-height:110px;font-family:ui-monospace,monospace;font-size:.82rem"></textarea>
      </div>

      <input ref="fileInput" type="file" accept=".ics,.vcf,.pkpass,text/calendar,text/vcard,application/vnd.apple.pkpass"
             multiple style="display:none" @change="handleFiles($event.target.files)" />

      <div v-if="pendingPasses.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        <span v-for="(p, i) in pendingPasses" :key="i" class="chip">🎟 {{ p.title }}</span>
      </div>

      <div class="sheet-actions">
        <button class="btn btn-ghost" data-testid="import-file" @click="pick">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
          {{ t('chooseFile') }}
        </button>
        <button class="btn btn-primary" data-testid="import-save" :disabled="!total" @click="doImport">
          {{ t('importBtn') }}
        </button>
      </div>

      <p v-if="error" class="err" style="margin-top:12px">{{ error }}</p>
      <p v-else-if="(text || pendingPasses.length) && !total" class="err" style="margin-top:12px">{{ t('parsedNone') }}</p>
      <p v-else-if="total" style="color:var(--accent-2);font-size:.86rem;margin-top:12px;font-weight:600">{{ summary }}</p>
    </div>
  </div>
</template>
