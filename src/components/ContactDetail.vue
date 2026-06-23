<script setup>
import { ref, computed } from 'vue'
import { t } from '@/i18n.js'
import { contactToVCF } from '@/lib/vcf.js'

const props = defineProps({ contact: Object })
const emit = defineEmits(['edit', 'delete', 'share', 'close'])

const confirming = ref(false)
const accent = computed(() => props.contact.color || 'var(--accent-2)')
const initials = computed(() => (props.contact.fn || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase())

function exportVcf () {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([contactToVCF(props.contact)], { type: 'text/vcard' }))
  a.download = `${(props.contact.fn || 'contacto').replace(/[^\w\d-]+/g, '-').slice(0, 40)}.vcf`
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="sheet" :style="{ '--card-accent': accent }">
      <div class="sheet-head">
        <span class="avatar-lg" :style="{ '--card-accent': accent }">
          <img v-if="contact.photo" :src="contact.photo" alt="" />
          <span v-else>{{ initials }}</span>
        </span>
        <h2>{{ contact.fn || '—' }}</h2>
        <button class="btn btn-ghost btn-icon" :aria-label="t('close')" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <p v-if="contact.jobTitle || contact.title || contact.org" style="color:var(--text-dim);margin:-6px 0 14px">
        {{ [contact.jobTitle || contact.title, contact.org].filter(Boolean).join(' · ') }}
      </p>

      <div class="detail-meta">
        <div v-for="(tel, i) in contact.tels" :key="'t'+i" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
          <p><a :href="`tel:${tel.value}`">{{ tel.value }}</a><span v-if="tel.type" style="color:var(--text-faint)"> · {{ tel.type }}</span></p>
        </div>
        <div v-for="(em, i) in contact.emails" :key="'e'+i" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
          <p><a :href="`mailto:${em.value}`">{{ em.value }}</a><span v-if="em.type" style="color:var(--text-faint)"> · {{ em.type }}</span></p>
        </div>
        <div v-for="(ad, i) in contact.adrs" :key="'a'+i" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <p>{{ ad.value }}</p>
        </div>
        <div v-for="(u, i) in contact.urls" :key="'u'+i" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
          <p><a :href="u" target="_blank" rel="noopener">{{ u }}</a></p>
        </div>
        <div v-if="contact.note" class="row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
          <p>{{ contact.note }}</p>
        </div>
      </div>

      <div class="action-list">
        <button class="btn" @click="$emit('edit', contact)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          {{ t('edit') }}
        </button>
        <button class="btn" data-testid="contact-share" @click="$emit('share', contact)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
          {{ t('share') }}
        </button>
        <button class="btn" @click="exportVcf">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
          {{ t('exportVcf') }}
        </button>
        <button v-if="!confirming" class="btn btn-danger" @click="confirming = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
          {{ t('delete') }}
        </button>
        <div v-else class="sheet-actions" style="margin-top:0">
          <button class="btn btn-ghost" @click="confirming = false">{{ t('cancel') }}</button>
          <button class="btn btn-danger" data-testid="contact-delete-confirm" @click="$emit('delete', contact)">{{ t('confirmDelete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-lg { width: 44px; height: 44px; border-radius: 50%; flex: none; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--card-accent) 26%, var(--bg-elev)); color: var(--text); font-weight: 700; }
.avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
</style>
