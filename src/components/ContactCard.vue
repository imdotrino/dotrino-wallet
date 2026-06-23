<script setup>
import { computed } from 'vue'

const props = defineProps({ contact: Object })
defineEmits(['open'])

const initials = computed(() => {
  const n = props.contact.fn || ''
  return n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
})
const subtitle = computed(() => {
  const c = props.contact
  return [c.jobTitle || c.title, c.org].filter(Boolean).join(' · ') ||
    (c.emails && c.emails[0] && c.emails[0].value) ||
    (c.tels && c.tels[0] && c.tels[0].value) || ''
})
const accent = computed(() => props.contact.color || 'var(--accent-2)')
</script>

<template>
  <button class="card card-contact" :style="{ '--card-accent': accent }"
          :data-item-id="contact.id" data-testid="contact-card" @click="$emit('open', contact)">
    <div class="contact-row">
      <span class="avatar" :style="{ '--card-accent': accent }">
        <img v-if="contact.photo" :src="contact.photo" alt="" />
        <span v-else>{{ initials }}</span>
      </span>
      <span class="contact-main">
        <span class="ctitle">{{ contact.fn || '—' }}</span>
        <span v-if="subtitle" class="csub">{{ subtitle }}</span>
      </span>
    </div>
  </button>
</template>

<style scoped>
.card-contact::before { background: var(--card-accent, var(--accent-2)); }
.contact-row { display: flex; align-items: center; gap: 13px; }
.avatar {
  width: 46px; height: 46px; border-radius: 50%; flex: none; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--card-accent) 26%, var(--bg-elev));
  color: var(--text); font-weight: 700; font-size: 1.05rem;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.contact-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.csub { color: var(--text-dim); font-size: .85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
