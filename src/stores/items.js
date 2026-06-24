import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadItems, saveItem, deleteItem, newId } from '@/lib/store.js'
import { effectiveMs } from '@/lib/ics.js'
import { sortKey } from '@/lib/vcf.js'

const DAY = 86400000

export const useWallet = defineStore('wallet', () => {
  const items = ref([])
  const loading = ref(true)
  const query = ref('')
  const tab = ref('event') // 'event' | 'contact' | 'pass'

  async function load () {
    loading.value = true
    try { items.value = await loadItems() } finally { loading.value = false }
  }

  async function upsert (item) {
    // El item puede venir de un ref de Vue (Proxy reactivo); el store guarda por
    // postMessage al iframe y NO puede clonar un Proxy (DataCloneError). Lo aplanamos
    // a un objeto plano serializable (JSON round-trip lee a través de los proxies).
    const plain = JSON.parse(JSON.stringify(item))
    const saved = await saveItem(plain)
    const i = items.value.findIndex((e) => e.id === saved.id)
    if (i >= 0) items.value[i] = saved
    else items.value.push(saved)
    return saved
  }

  async function remove (id) {
    await deleteItem(id)
    items.value = items.value.filter((e) => e.id !== id)
  }

  const counts = computed(() => {
    const c = { event: 0, contact: 0, pass: 0 }
    for (const it of items.value) if (c[it.type] != null) c[it.type]++
    return c
  })

  function matches (it, q) {
    let hay = ''
    if (it.type === 'event') hay = [it.title, it.location, it.description].filter(Boolean).join(' ')
    else if (it.type === 'contact') hay = [it.fn, it.org, ...(it.emails || []).map((e) => e.value), ...(it.tels || []).map((t) => t.value)].filter(Boolean).join(' ')
    else if (it.type === 'pass') hay = [it.title, it.org, ...Object.values(it.fields || {}).flat().map((f) => f.value + ' ' + f.label)].filter(Boolean).join(' ')
    return hay.toLowerCase().includes(q)
  }

  // Ítems de la pestaña activa, filtrados por búsqueda.
  const visible = computed(() => {
    const q = query.value.trim().toLowerCase()
    return items.value.filter((it) => it.type === tab.value && (!q || matches(it, q)))
  })

  // Eventos agrupados por proximidad temporal.
  const eventGroups = computed(() => {
    const now = Date.now()
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const todayStart = start.getTime()
    const buckets = { today: [], week: [], upcoming: [], past: [] }
    for (const e of visible.value) {
      const ms = effectiveMs(e, now)
      if (ms < todayStart) buckets.past.push(e)
      else if (ms < todayStart + DAY) buckets.today.push(e)
      else if (ms < todayStart + 7 * DAY) buckets.week.push(e)
      else buckets.upcoming.push(e)
    }
    const byMs = (a, b) => effectiveMs(a, now) - effectiveMs(b, now)
    buckets.today.sort(byMs); buckets.week.sort(byMs); buckets.upcoming.sort(byMs)
    buckets.past.sort((a, b) => effectiveMs(b, now) - effectiveMs(a, now))
    return buckets
  })

  // Contactos ordenados alfabéticamente.
  const contactsSorted = computed(() =>
    [...visible.value].sort((a, b) => sortKey(a).localeCompare(sortKey(b))))

  // Pases por fecha relevante/vencimiento (los sin fecha al final), luego título.
  const passesSorted = computed(() =>
    [...visible.value].sort((a, b) => {
      const am = a.relevantMs ?? a.expirationMs ?? Infinity
      const bm = b.relevantMs ?? b.expirationMs ?? Infinity
      if (am !== bm) return am - bm
      return (a.title || '').localeCompare(b.title || '')
    }))

  const tabIsEmpty = computed(() => !loading.value && visible.value.length === 0)
  const allEmpty = computed(() => !loading.value && items.value.length === 0)

  return {
    items, loading, query, tab,
    load, upsert, remove, newId,
    counts, visible, eventGroups, contactsSorted, passesSorted, tabIsEmpty, allEmpty,
  }
})
