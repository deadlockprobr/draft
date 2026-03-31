import type { Server, Socket } from 'socket.io'
import { getDraftById, getDraftByCodeUrl, updateDraft } from './db'
import { isDraftFinished, getCurrentStep, parseSortString, HEROES_API_URL, type Draft } from './draft'

// --- Webhook ---
export async function sendWebhook(draft: Draft) {
  if (!draft.callback_url) return
  const items = JSON.parse(draft.items || '[]')
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || '3000'}`
  const payload = {
    event: 'draft.finished',
    draft: {
      id: draft.id,
      code_url: draft.code_url,
      cover: `${baseUrl}/${draft.code_url}/cover`,
      name_a: draft.name_a,
      name_b: draft.name_b,
      sort: draft.sort,
      status: draft.status,
      items,
      created_at: draft.created_at,
    },
  }
  try {
    await fetch(draft.callback_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    console.log(`[WEBHOOK] Sent to ${draft.callback_url} for draft #${draft.id}`)
  } catch (err) {
    console.error(`[WEBHOOK] Failed for draft #${draft.id}:`, err)
  }
}

// --- Draft lock (prevents timer + manual pick race) ---
const draftLocks = new Map<number, boolean>()

export function acquireLock(draftId: number): boolean {
  if (draftLocks.get(draftId)) return false
  draftLocks.set(draftId, true)
  return true
}

export function releaseLock(draftId: number) {
  draftLocks.delete(draftId)
}

// Hero pool loaded once for auto-pick
let heroPool: { id: number; name: string }[] = []

async function loadHeroPool() {
  try {
    const res = await fetch(HEROES_API_URL)
    const data = await res.json()
    heroPool = (data ?? [])
      .filter((h: any) => !h.disabled && !h.in_development)
      .map((h: any) => ({ id: h.id, name: h.name }))
    console.log(`[HEROES] Loaded ${heroPool.length} heroes for auto-pick`)
  } catch (err) {
    console.error('[HEROES] Failed to load hero pool:', err)
  }
}

// Load on startup
loadHeroPool()

// --- Socket.IO server reference ---
let io: Server | null = null

export function setIO(server: Server) {
  io = server
}

// --- Pending hero selection (sent by client, used on timer expiry) ---
const pendingSelection = new Map<number, { key: number; collection: string }>()

export function setPendingSelection(draftId: number, hero: { key: number; collection: string } | null) {
  if (hero) {
    pendingSelection.set(draftId, hero)
  } else {
    pendingSelection.delete(draftId)
  }
}

export function clearPendingSelection(draftId: number) {
  pendingSelection.delete(draftId)
}

// --- Timer management ---
const timers = new Map<number, NodeJS.Timeout>()
const timerRemainingMap = new Map<number, { remaining: number; stepIndex: number }>()

export function getTimerRemaining(draftId: number): number | null {
  return timerRemainingMap.get(draftId)?.remaining ?? null
}

export function startTimer(draftId: number) {
  clearTimer(draftId)

  const draft = getDraftById(draftId)
  if (!draft || draft.status !== 'active') return

  const items = JSON.parse(draft.items || '[]')
  if (isDraftFinished(draft.sort, items)) return

  timerRemainingMap.set(draftId, { remaining: draft.timer_seconds, stepIndex: items.length })
  broadcastDraft(draft.code_url)

  const interval = setInterval(() => {
    const state = timerRemainingMap.get(draftId)
    if (!state) { clearInterval(interval); return }

    state.remaining--

    if (state.remaining <= 0) {
      clearInterval(interval)
      timers.delete(draftId)
      handleTimerExpired(draftId)
    } else {
      broadcastTimer(draft.code_url, state.remaining)
    }
  }, 1000)

  timers.set(draftId, interval)
}

export function clearTimer(draftId: number) {
  const existing = timers.get(draftId)
  if (existing) {
    clearInterval(existing)
    timers.delete(draftId)
  }
  timerRemainingMap.delete(draftId)
}

function pickRandomHero(items: any[]): { key: number; collection: string } | null {
  const usedIds = new Set(items.map((i: any) => i?.hero?.key).filter(Boolean))
  const available = heroPool.filter((h) => !usedIds.has(h.id))
  if (available.length === 0) return null
  const hero = available[Math.floor(Math.random() * available.length)]
  return { key: hero.id, collection: 'deadlock_heroes' }
}

function handleTimerExpired(draftId: number) {
  if (!acquireLock(draftId)) return
  try {
    const draft = getDraftById(draftId)
    if (!draft || draft.status !== 'active') return

    const items = JSON.parse(draft.items || '[]')
    const step = getCurrentStep(draft.sort, items)
    if (!step) return

    // Use pending selection if available, otherwise random
    const pending = pendingSelection.get(draftId)
    const hero = pending ?? pickRandomHero(items)
    clearPendingSelection(draftId)
    const newItems = [...items, { type: step.type, team: step.team, hero, order: items.length + 1, auto: !pending }]
    const updated = updateDraft(draftId, { items: JSON.stringify(newItems) })

    if (updated && isDraftFinished(updated.sort, newItems)) {
      const finished = updateDraft(draftId, { status: 'finished' })
      clearTimer(draftId)
      console.log(`[DRAFT FINISHED] Draft #${draftId} (${updated.name_a} vs ${updated.name_b}) has been completed.`)
      broadcastDraft(updated.code_url)
      if (finished) sendWebhook(finished)
    } else if (updated) {
      broadcastDraft(updated.code_url)
      startTimer(draftId)
    }
  } finally {
    releaseLock(draftId)
  }
}

// --- Broadcasting ---
export function broadcastDraft(codeUrl: string) {
  if (!io) return
  const draft = getDraftByCodeUrl(codeUrl)
  if (!draft) return

  const items = JSON.parse(draft.items || '[]')
  const steps = parseSortString(draft.sort, items)
  const timer = getTimerRemaining(draft.id)

  io.to(codeUrl).emit('draft:update', {
    id: draft.id,
    code_url: draft.code_url,
    code_a: draft.code_a,
    code_b: draft.code_b,
    name_a: draft.name_a,
    name_b: draft.name_b,
    sort: draft.sort,
    stream: draft.stream,
    ready_a: draft.ready_a,
    ready_b: draft.ready_b,
    items,
    steps,
    timer,
    timer_seconds: draft.timer_seconds,
    status: draft.status,
  })
}

function broadcastTimer(codeUrl: string, remaining: number) {
  if (!io) return
  io.to(codeUrl).emit('draft:timer', { remaining })
}

// --- Connection handler ---
export function handleConnection(socket: Socket) {
  socket.on('select-hero', (data: { draftId: number; hero: { key: number; collection: string } | null }) => {
    if (data.hero) {
      setPendingSelection(data.draftId, data.hero)
    } else {
      clearPendingSelection(data.draftId)
    }
  })

  socket.on('subscribe', (codeUrl: string) => {
    socket.join(codeUrl)

    const draft = getDraftByCodeUrl(codeUrl)
    if (draft) {
      const items = JSON.parse(draft.items || '[]')
      const steps = parseSortString(draft.sort, items)
      const timer = getTimerRemaining(draft.id)
      socket.emit('draft:update', {
        id: draft.id,
        code_url: draft.code_url,
        code_a: draft.code_a,
        code_b: draft.code_b,
        name_a: draft.name_a,
        name_b: draft.name_b,
        sort: draft.sort,
        stream: draft.stream,
        ready_a: draft.ready_a,
        ready_b: draft.ready_b,
        items,
        steps,
        timer,
        timer_seconds: draft.timer_seconds,
        status: draft.status,
      })
    }
  })
}
