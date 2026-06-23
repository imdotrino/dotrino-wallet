<script setup>
import { reactive, ref, watch } from 'vue'
import { t } from '@/i18n.js'
import { toLocalInput } from '@/lib/ics.js'

const props = defineProps({ event: Object })
const emit = defineEmits(['save', 'cancel'])

const COLORS = ['#f4b740', '#4dd0c4', '#ff6b6b', '#9b8cff', '#6fcf73', '#ff9f43', '#5aa9ff']

function blank () {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return {
    id: '', uid: '', title: '', allDay: false,
    start: toLocalInput(now), end: '',
    location: '', url: '', description: '', rrule: null,
    color: COLORS[0], source: 'manual',
  }
}

const form = reactive(props.event ? normalize({ ...props.event }) : blank())
const error = ref('')

function normalize (e) {
  // Asegura formato de input según allDay.
  if (e.allDay) {
    e.start = (e.start || '').slice(0, 10)
    e.end = (e.end || '').slice(0, 10)
  } else {
    e.start = (e.start || '').slice(0, 16)
    e.end = (e.end || '').slice(0, 16)
  }
  if (!e.color) e.color = COLORS[0]
  return e
}

// Al cambiar allDay, recorta/expande el formato de las fechas.
watch(() => form.allDay, (allDay) => {
  if (allDay) {
    form.start = (form.start || '').slice(0, 10)
    form.end = (form.end || '').slice(0, 10)
  } else {
    if (form.start && form.start.length === 10) form.start += 'T09:00'
    if (form.end && form.end.length === 10) form.end += 'T10:00'
  }
})

function submit () {
  if (!form.title.trim()) { error.value = t('titleRequired'); return }
  emit('save', { ...form, title: form.title.trim() })
}
</script>

<template>
  <div class="overlay" @click.self="$emit('cancel')">
    <div class="sheet" :style="{ '--card-accent': form.color }">
      <div class="sheet-head">
        <span class="sheet-accent"></span>
        <h2>{{ props.event ? t('edit') : t('newEvent') }}</h2>
        <button class="btn btn-ghost btn-icon" :aria-label="t('close')" @click="$emit('cancel')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div class="field">
        <label>{{ t('title') }}</label>
        <input type="text" v-model="form.title" data-testid="ev-title" :placeholder="t('title')" />
      </div>
      <p v-if="error" class="err">{{ error }}</p>

      <label class="check" style="margin-bottom:14px">
        <input type="checkbox" v-model="form.allDay" data-testid="ev-allday" />
        {{ t('allDayLabel') }}
      </label>

      <div class="field-row">
        <div class="field">
          <label>{{ t('start') }}</label>
          <input v-if="form.allDay" type="date" v-model="form.start" data-testid="ev-start" />
          <input v-else type="datetime-local" v-model="form.start" data-testid="ev-start" />
        </div>
        <div class="field">
          <label>{{ t('end') }}</label>
          <input v-if="form.allDay" type="date" v-model="form.end" />
          <input v-else type="datetime-local" v-model="form.end" />
        </div>
      </div>

      <div class="field">
        <label>{{ t('location') }}</label>
        <input type="text" v-model="form.location" :placeholder="t('location')" />
      </div>
      <div class="field">
        <label>{{ t('url') }}</label>
        <input type="url" v-model="form.url" placeholder="https://" />
      </div>
      <div class="field">
        <label>{{ t('description') }}</label>
        <textarea v-model="form.description" :placeholder="t('description')"></textarea>
      </div>
      <div class="field">
        <label>{{ t('color') }}</label>
        <div class="swatches">
          <button v-for="c in COLORS" :key="c" class="swatch" :class="{ on: form.color === c }"
                  :style="{ background: c }" :aria-label="c" @click="form.color = c"></button>
        </div>
      </div>

      <div class="sheet-actions">
        <button class="btn btn-ghost" @click="$emit('cancel')">{{ t('cancel') }}</button>
        <button class="btn btn-primary" data-testid="ev-save" @click="submit">{{ t('save') }}</button>
      </div>
    </div>
  </div>
</template>
