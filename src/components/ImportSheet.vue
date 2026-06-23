<script setup>
import { ref, computed } from 'vue'
import { t } from '@/i18n.js'
import { parseICS } from '@/lib/ics.js'
import { newId } from '@/lib/store.js'

const props = defineProps({ prefill: { type: String, default: '' } })
const emit = defineEmits(['import', 'cancel'])

const text = ref(props.prefill || '')
const dragging = ref(false)
const fileInput = ref(null)

const parsed = computed(() => parseICS(text.value).events)

const COLORS = ['#f4b740', '#4dd0c4', '#ff6b6b', '#9b8cff', '#6fcf73', '#ff9f43', '#5aa9ff']

function readFiles (files) {
  const f = files && files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => { text.value = String(r.result || '') }
  r.readAsText(f)
}

function onDrop (e) {
  dragging.value = false
  readFiles(e.dataTransfer?.files)
}

function pick () { fileInput.value?.click() }

function doImport () {
  const events = parsed.value.map((e, i) => ({
    ...e,
    id: newId(),
    color: COLORS[i % COLORS.length],
    source: 'import',
  }))
  emit('import', events)
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

      <div
        class="dropzone"
        :class="{ drag: dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        {{ t('pasteHint') }}
      </div>

      <div class="field">
        <textarea v-model="text" data-testid="import-text" placeholder="BEGIN:VCALENDAR…" style="min-height:120px;font-family:ui-monospace,monospace;font-size:.82rem"></textarea>
      </div>

      <input ref="fileInput" type="file" accept=".ics,text/calendar" style="display:none" @change="readFiles($event.target.files)" />

      <div class="sheet-actions">
        <button class="btn btn-ghost" @click="pick">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
          {{ t('chooseFile') }}
        </button>
        <button class="btn btn-primary" data-testid="import-save" :disabled="!parsed.length" @click="doImport">
          {{ t('importBtn') }}
        </button>
      </div>

      <p v-if="text && !parsed.length" class="err" style="margin-top:12px">{{ t('parsedNone') }}</p>
      <p v-else-if="parsed.length" style="color:var(--accent-2);font-size:.86rem;margin-top:12px;font-weight:600">
        {{ parsed.length }} {{ parsed.length === 1 ? t('parsedOne') : t('parsedMany') }}
      </p>
    </div>
  </div>
</template>
