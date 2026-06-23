<script setup>
import { reactive, ref } from 'vue'
import { t } from '@/i18n.js'

const props = defineProps({ contact: Object })
const emit = defineEmits(['save', 'cancel'])

const COLORS = ['#4dd0c4', '#f4b740', '#ff6b6b', '#9b8cff', '#6fcf73', '#ff9f43', '#5aa9ff']

function fromContact (c) {
  return {
    id: c.id || '', fn: c.fn || '', org: c.org || '', jobTitle: c.jobTitle || c.title || '',
    phone: (c.tels && c.tels[0] && c.tels[0].value) || '',
    email: (c.emails && c.emails[0] && c.emails[0].value) || '',
    address: (c.adrs && c.adrs[0] && c.adrs[0].value) || '',
    url: (c.urls && c.urls[0]) || '',
    note: c.note || '', photo: c.photo || '', color: c.color || COLORS[0],
    // preserva extras que el formulario no edita
    _extraTels: (c.tels || []).slice(1), _extraEmails: (c.emails || []).slice(1),
    _extraAdrs: (c.adrs || []).slice(1), _extraUrls: (c.urls || []).slice(1),
    _n: c.n,
  }
}

const form = reactive(props.contact ? fromContact(props.contact) : fromContact({}))
const error = ref('')

function submit () {
  if (!form.fn.trim()) { error.value = t('nameRequired'); return }
  const c = {
    type: 'contact', id: form.id, fn: form.fn.trim(), org: form.org.trim(),
    jobTitle: form.jobTitle.trim(),
    tels: [...(form.phone.trim() ? [{ value: form.phone.trim(), type: '' }] : []), ...form._extraTels],
    emails: [...(form.email.trim() ? [{ value: form.email.trim(), type: '' }] : []), ...form._extraEmails],
    adrs: [...(form.address.trim() ? [{ value: form.address.trim(), type: '' }] : []), ...form._extraAdrs],
    urls: [...(form.url.trim() ? [form.url.trim()] : []), ...form._extraUrls],
    note: form.note.trim(), photo: form.photo, color: form.color, n: form._n, source: 'manual',
  }
  emit('save', c)
}
</script>

<template>
  <div class="overlay" @click.self="$emit('cancel')">
    <div class="sheet" :style="{ '--card-accent': form.color }">
      <div class="sheet-head">
        <span class="sheet-accent"></span>
        <h2>{{ props.contact ? t('edit') : t('newContact') }}</h2>
        <button class="btn btn-ghost btn-icon" :aria-label="t('close')" @click="$emit('cancel')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div class="field">
        <label>{{ t('contactName') }}</label>
        <input type="text" v-model="form.fn" data-testid="ct-name" :placeholder="t('contactName')" />
      </div>
      <p v-if="error" class="err">{{ error }}</p>

      <div class="field-row">
        <div class="field"><label>{{ t('org') }}</label><input type="text" v-model="form.org" /></div>
        <div class="field"><label>{{ t('jobTitle') }}</label><input type="text" v-model="form.jobTitle" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>{{ t('phone') }}</label><input type="text" v-model="form.phone" inputmode="tel" /></div>
        <div class="field"><label>{{ t('email') }}</label><input type="text" v-model="form.email" inputmode="email" /></div>
      </div>
      <div class="field"><label>{{ t('address') }}</label><input type="text" v-model="form.address" /></div>
      <div class="field"><label>{{ t('url') }}</label><input type="url" v-model="form.url" placeholder="https://" /></div>
      <div class="field"><label>{{ t('notes') }}</label><textarea v-model="form.note"></textarea></div>
      <div class="field">
        <label>{{ t('color') }}</label>
        <div class="swatches">
          <button v-for="c in COLORS" :key="c" class="swatch" :class="{ on: form.color === c }"
                  :style="{ background: c }" :aria-label="c" @click="form.color = c"></button>
        </div>
      </div>

      <div class="sheet-actions">
        <button class="btn btn-ghost" @click="$emit('cancel')">{{ t('cancel') }}</button>
        <button class="btn btn-primary" data-testid="ct-save" @click="submit">{{ t('save') }}</button>
      </div>
    </div>
  </div>
</template>
