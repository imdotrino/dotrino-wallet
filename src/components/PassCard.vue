<script setup>
import { computed } from 'vue'

const props = defineProps({ pass: Object })
defineEmits(['open'])

const bg = computed(() => props.pass.colors?.bg || '#1b222d')
const fg = computed(() => props.pass.colors?.fg || '#ffffff')
const label = computed(() => props.pass.colors?.label || fg.value)
const primary = computed(() => (props.pass.fields?.primary || [])[0] || null)
const secondary = computed(() => (props.pass.fields?.secondary || []).slice(0, 2))
</script>

<template>
  <button class="pass-card" :style="{ background: bg, color: fg }"
          :data-item-id="pass.id" data-testid="pass-card" @click="$emit('open', pass)">
    <div class="pass-top">
      <img v-if="pass.logo" :src="pass.logo" alt="" class="pass-logo" />
      <span v-else class="pass-org">{{ pass.org || pass.title }}</span>
      <span class="pass-code-hint" v-if="pass.barcode" :style="{ color: label }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14" stroke-linecap="round"/></svg>
      </span>
    </div>

    <div v-if="primary" class="pass-primary">
      <span class="pass-flabel" :style="{ color: label }">{{ primary.label }}</span>
      <span class="pass-fvalue">{{ primary.value }}</span>
    </div>
    <div v-else class="pass-primary">
      <span class="pass-fvalue">{{ pass.title }}</span>
    </div>

    <div v-if="secondary.length" class="pass-secondary">
      <span v-for="(f, i) in secondary" :key="i" class="pass-sfield">
        <span class="pass-flabel" :style="{ color: label }">{{ f.label }}</span>
        <span class="pass-svalue">{{ f.value }}</span>
      </span>
    </div>
  </button>
</template>

<style scoped>
.pass-card {
  position: relative; text-align: left; width: 100%;
  border: 1px solid rgba(255,255,255,.12); border-radius: var(--radius);
  padding: 15px 16px; display: flex; flex-direction: column; gap: 12px;
  min-height: 150px; overflow: hidden; transition: transform .12s ease;
}
.pass-card:hover { transform: translateY(-2px); }
.pass-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pass-logo { max-height: 30px; max-width: 60%; object-fit: contain; }
.pass-org { font-weight: 700; font-size: .92rem; opacity: .92; }
.pass-code-hint svg { width: 22px; height: 22px; opacity: .8; }
.pass-primary { display: flex; flex-direction: column; gap: 2px; }
.pass-flabel { font-size: .64rem; text-transform: uppercase; letter-spacing: .06em; opacity: .85; }
.pass-fvalue { font-size: 1.5rem; font-weight: 800; line-height: 1.1; }
.pass-secondary { display: flex; gap: 22px; margin-top: auto; }
.pass-sfield { display: flex; flex-direction: column; gap: 1px; }
.pass-svalue { font-size: .95rem; font-weight: 600; }
</style>
