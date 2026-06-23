<script setup>
import { ref, computed, onMounted } from 'vue'
import { t } from '@/i18n.js'
import { qrDataUrl } from '@/lib/qr.js'
import { b64ToBytes } from '@/lib/pkpass.js'

const props = defineProps({ pass: Object })
const emit = defineEmits(['delete', 'share', 'close'])

const confirming = ref(false)
const qr = ref('')
const bg = computed(() => props.pass.colors?.bg || '#1b222d')
const fg = computed(() => props.pass.colors?.fg || '#fff')
const label = computed(() => props.pass.colors?.label || fg.value)
const isQR = computed(() => (props.pass.barcode?.format || '').toUpperCase() === 'QR')

const allFields = computed(() => {
  const f = props.pass.fields || {}
  return [...(f.primary || []), ...(f.secondary || []), ...(f.auxiliary || []), ...(f.header || []), ...(f.back || [])]
    .filter((x) => x.label || x.value)
})

function pkpassBlob () {
  return new Blob([b64ToBytes(props.pass.rawB64)], { type: 'application/vnd.apple.pkpass' })
}
function exportPkpass () {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(pkpassBlob())
  a.download = `${(props.pass.title || 'pase').replace(/[^\w\d-]+/g, '-').slice(0, 40)}.pkpass`
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
function openInWallet () {
  const url = URL.createObjectURL(pkpassBlob())
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 8000)
}

onMounted(async () => {
  if (props.pass.barcode?.message) qr.value = await qrDataUrl(props.pass.barcode.message)
})
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="sheet">
      <div class="sheet-head">
        <span class="sheet-accent" :style="{ background: bg }"></span>
        <h2>{{ pass.title || 'Pase' }}</h2>
        <button class="btn btn-ghost btn-icon" :aria-label="t('close')" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <!-- Reproducción del pase -->
      <div class="pass-hero" :style="{ background: bg, color: fg }">
        <div class="pass-hero-top">
          <img v-if="pass.logo" :src="pass.logo" alt="" />
          <span v-else style="font-weight:700">{{ pass.org }}</span>
        </div>
        <img v-if="pass.strip" :src="pass.strip" alt="" class="pass-strip" />
        <div class="pass-fields">
          <div v-for="(f, i) in allFields" :key="i" class="pf">
            <span class="pf-label" :style="{ color: label }">{{ f.label }}</span>
            <span class="pf-value">{{ f.value }}</span>
          </div>
        </div>
        <!-- barcode -->
        <div v-if="pass.barcode" class="pass-barcode">
          <img v-if="qr" :src="qr" alt="barcode" />
          <div class="pass-barcode-alt">{{ pass.barcode.altText || pass.barcode.message }}</div>
        </div>
        <div v-else class="pass-barcode"><div class="pass-barcode-alt">{{ t('noBarcode') }}</div></div>
      </div>

      <p v-if="pass.barcode && !isQR" class="err" style="color:var(--accent);margin-top:12px">{{ t('barcodeFallback') }}</p>

      <div class="action-list">
        <button class="btn" @click="openInWallet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="3" /><path d="M2 10h20M16 15h2" /></svg>
          {{ t('openInWallet') }}
        </button>
        <button class="btn" data-testid="pass-share" @click="$emit('share', pass)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
          {{ t('share') }}
        </button>
        <button class="btn" @click="exportPkpass">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
          {{ t('exportPkpass') }}
        </button>
        <button v-if="!confirming" class="btn btn-danger" @click="confirming = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
          {{ t('delete') }}
        </button>
        <div v-else class="sheet-actions" style="margin-top:0">
          <button class="btn btn-ghost" @click="confirming = false">{{ t('cancel') }}</button>
          <button class="btn btn-danger" data-testid="pass-delete-confirm" @click="$emit('delete', pass)">{{ t('confirmDelete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pass-hero { border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.pass-hero-top { display: flex; align-items: center; min-height: 30px; }
.pass-hero-top img { max-height: 34px; max-width: 70%; object-fit: contain; }
.pass-strip { width: 100%; border-radius: 8px; object-fit: cover; max-height: 120px; }
.pass-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
.pf { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pf-label { font-size: .62rem; text-transform: uppercase; letter-spacing: .06em; opacity: .85; }
.pf-value { font-size: 1.02rem; font-weight: 700; overflow-wrap: anywhere; }
.pass-barcode { background: #fff; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.pass-barcode img { width: 168px; height: 168px; image-rendering: pixelated; }
.pass-barcode-alt { color: #111; font-size: .8rem; font-family: ui-monospace, monospace; text-align: center; overflow-wrap: anywhere; }
</style>
