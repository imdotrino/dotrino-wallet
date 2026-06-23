<script setup>
import { computed } from 'vue'
import { formatWhen } from '@/lib/ics.js'
import { lang, t } from '@/i18n.js'

const props = defineProps({ event: Object })
defineEmits(['open'])

const when = computed(() => formatWhen(props.event, lang.value))
const accent = computed(() => props.event.color || 'var(--accent)')
</script>

<template>
  <button
    class="card"
    :style="{ '--card-accent': accent }"
    :data-event-id="event.id"
    data-testid="event-card"
    @click="$emit('open', event)"
  >
    <span class="when">{{ when }}</span>
    <span class="ctitle">{{ event.title || '—' }}</span>

    <span v-if="event.location" class="meta">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
      </svg>
      <span>{{ event.location }}</span>
    </span>

    <span class="badges">
      <span v-if="event.allDay" class="chip">{{ t('allDay') }}</span>
      <span v-if="event.rrule" class="chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {{ t('repeats') }}
      </span>
    </span>
  </button>
</template>
