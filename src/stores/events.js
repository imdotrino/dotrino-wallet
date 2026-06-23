import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadEvents, saveEvent, deleteEvent, newId } from '@/lib/store.js'
import { effectiveMs } from '@/lib/ics.js'

const DAY = 86400000

export const useEvents = defineStore('events', () => {
  const items = ref([])
  const loading = ref(true)
  const query = ref('')

  async function load () {
    loading.value = true
    try {
      items.value = await loadEvents()
    } finally {
      loading.value = false
    }
  }

  async function upsert (ev) {
    const saved = await saveEvent(ev)
    const i = items.value.findIndex((e) => e.id === saved.id)
    if (i >= 0) items.value[i] = saved
    else items.value.push(saved)
    return saved
  }

  async function remove (id) {
    await deleteEvent(id)
    items.value = items.value.filter((e) => e.id !== id)
  }

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return items.value
    return items.value.filter((e) =>
      [e.title, e.location, e.description].filter(Boolean).join(' ').toLowerCase().includes(q))
  })

  // Agrupa por proximidad temporal en: hoy, esta semana, próximos, pasados.
  const groups = computed(() => {
    const now = Date.now()
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const todayStart = start.getTime()
    const todayEnd = todayStart + DAY
    const weekEnd = todayStart + 7 * DAY

    const buckets = { today: [], week: [], upcoming: [], past: [] }
    for (const e of filtered.value) {
      const ms = effectiveMs(e, now)
      if (ms < todayStart) buckets.past.push(e)
      else if (ms < todayEnd) buckets.today.push(e)
      else if (ms < weekEnd) buckets.week.push(e)
      else buckets.upcoming.push(e)
    }
    const byMs = (a, b) => effectiveMs(a, now) - effectiveMs(b, now)
    buckets.today.sort(byMs)
    buckets.week.sort(byMs)
    buckets.upcoming.sort(byMs)
    buckets.past.sort((a, b) => effectiveMs(b, now) - effectiveMs(a, now)) // pasados: más reciente primero
    return buckets
  })

  const isEmpty = computed(() => !loading.value && items.value.length === 0)

  return { items, loading, query, load, upsert, remove, filtered, groups, isEmpty, newId }
})
