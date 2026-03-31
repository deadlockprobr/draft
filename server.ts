import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import next from 'next'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initDb, createDraft, getDraftById, getDraftByCodeUrl, getDraftByAdminCode, updateDraft, cleanupOldDrafts } from './src/lib/db'
import { random, isDraftFinished, getCurrentStep } from './src/lib/draft'
import { setIO, handleConnection, broadcastDraft, startTimer, clearTimer, clearPendingSelection, sendWebhook, acquireLock, releaseLock } from './src/lib/ws-state'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev })
const handle = app.getRequestHandler()

function getBaseUrl(req: express.Request): string {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${port}`
  return `${proto}://${host}`
}

function addCoverUrl(draft: any, baseUrl: string) {
  return { ...draft, cover: `${baseUrl}/${draft.code_url}/cover` }
}

app.prepare().then(() => {
  initDb()

  const server = express()

  // Trust proxy (behind reverse proxy/load balancer)
  server.set('trust proxy', 1)

  // Security
  server.use(helmet({
    contentSecurityPolicy: false, // Next.js manages its own CSP
    crossOriginEmbedderPolicy: false, // Allow embedding for stream overlays
  }))
  server.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
  }))

  // Rate limiting
  const createDraftLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 20, // max 20 drafts per IP per 5 min
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many drafts created. Try again later.' },
  })

  const apiReadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 120, // max 120 reads per IP per minute
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Try again later.' },
  })

  const apiWriteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 60, // max 60 writes per IP per minute
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Try again later.' },
  })

  // Serve static files from public/ before Next.js catches them as dynamic routes
  server.use('/images', express.static('public/images'))

  // --- Internal API (Express handles DB directly) ---

  // Validation helpers
  const VALID_SORT_RE = /^[ab][#1-9](-[ab][#1-9])*$/
  const MAX_NAME_LEN = 50
  const MAX_SORT_LEN = 200
  const MAX_CALLBACK_LEN = 500
  const VALID_TIMER_VALUES = [0, 15, 30, 45, 60, 90]

  // Create draft
  server.post('/api/internal/draft', createDraftLimiter, express.json({ limit: '16kb' }), (req, res) => {
    try {
      const { name_a, name_b, sort, stream, timer_seconds, callback_url } = req.body

      if (!name_a || typeof name_a !== 'string') return res.status(400).json({ error: 'name_a is required' })
      if (!name_b || typeof name_b !== 'string') return res.status(400).json({ error: 'name_b is required' })
      if (!sort || typeof sort !== 'string') return res.status(400).json({ error: 'sort is required' })

      const trimA = name_a.trim()
      const trimB = name_b.trim()
      if (!trimA || trimA.length > MAX_NAME_LEN) return res.status(400).json({ error: `name_a must be 1-${MAX_NAME_LEN} characters` })
      if (!trimB || trimB.length > MAX_NAME_LEN) return res.status(400).json({ error: `name_b must be 1-${MAX_NAME_LEN} characters` })
      if (sort.length > MAX_SORT_LEN) return res.status(400).json({ error: 'sort string too long' })
      if (!VALID_SORT_RE.test(sort)) return res.status(400).json({ error: 'Invalid sort format' })

      const timer = timer_seconds !== undefined ? Number(timer_seconds) : 30
      if (!VALID_TIMER_VALUES.includes(timer)) return res.status(400).json({ error: `timer_seconds must be one of: ${VALID_TIMER_VALUES.join(', ')}` })

      if (callback_url !== undefined && callback_url !== null) {
        if (typeof callback_url !== 'string' || callback_url.length > MAX_CALLBACK_LEN) {
          return res.status(400).json({ error: 'Invalid callback_url' })
        }
        let parsedUrl: URL
        try { parsedUrl = new URL(callback_url) } catch { return res.status(400).json({ error: 'callback_url must be a valid URL' }) }
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          return res.status(400).json({ error: 'callback_url must use http or https' })
        }
        // Block private/internal hostnames (SSRF protection)
        const host = parsedUrl.hostname.toLowerCase()
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0'
          || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.')
          || host.endsWith('.local') || host.endsWith('.internal')) {
          return res.status(400).json({ error: 'callback_url cannot point to private/internal addresses' })
        }
      }

      const draft = createDraft({
        code_url: random(8),
        code_admin: random(12),
        code_a: random(8),
        code_b: random(8),
        name_a: trimA, name_b: trimB, sort,
        stream: !!stream,
        timer_seconds: timer,
        callback_url: callback_url || undefined,
      })
      res.json({ data: addCoverUrl(draft, getBaseUrl(req)) })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Get draft by admin code (must be before :id to avoid conflict)
  server.get('/api/internal/draft/by-admin/:code', apiReadLimiter, (req, res) => {
    try {
      const draft = getDraftByAdminCode(req.params.code as string)
      if (!draft) return res.status(404).json({ error: 'Not found' })
      res.json({ data: { ...draft, items: JSON.parse(draft.items || '[]') } })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Get draft by code_url (public API)
  server.get('/api/internal/draft/by-code/:code', apiReadLimiter, (req, res) => {
    try {
      const draft = getDraftByCodeUrl(req.params.code as string)
      if (!draft) return res.status(404).json({ error: 'Not found' })
      // Public: strip sensitive codes
      const { code_admin, code_a, code_b, callback_url, ...safe } = draft
      res.json({ data: addCoverUrl({ ...safe, items: JSON.parse(draft.items || '[]') }, getBaseUrl(req)) })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Get draft by ID (internal only)
  server.get('/api/internal/draft/:id', apiReadLimiter, (req, res) => {
    try {
      const draft = getDraftById(Number(req.params.id))
      if (!draft) return res.status(404).json({ error: 'Not found' })
      res.json({ data: { ...draft, items: JSON.parse(draft.items || '[]') } })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // PATCH draft (ready or pick/ban)
  server.patch('/api/internal/draft/:id', apiWriteLimiter, express.json({ limit: '16kb' }), (req, res) => {
    try {
      const draftId = Number(req.params.id)
      if (isNaN(draftId) || draftId <= 0) return res.status(400).json({ error: 'Invalid draft ID' })

      const body = req.body
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request body' })

      const existing = getDraftById(draftId)
      if (!existing) return res.status(404).json({ error: 'Not found' })

      // Prevent modifications to finished drafts
      if (existing.status === 'finished') return res.status(400).json({ error: 'Draft is already finished' })

      // Ready update
      if (body.ready_a !== undefined || body.ready_b !== undefined) {
        if (existing.status !== 'waiting') return res.status(400).json({ error: 'Draft is not in waiting state' })
        if (body.ready_a !== undefined && typeof body.ready_a !== 'boolean') return res.status(400).json({ error: 'ready_a must be a boolean' })
        if (body.ready_b !== undefined && typeof body.ready_b !== 'boolean') return res.status(400).json({ error: 'ready_b must be a boolean' })

        const updateData: any = {}
        if (body.ready_a !== undefined) updateData.ready_a = body.ready_a
        if (body.ready_b !== undefined) updateData.ready_b = body.ready_b

        const updated = updateDraft(draftId, updateData)
        if (!updated) return res.status(500).json({ error: 'Update failed' })

        if (updated.ready_a && updated.ready_b && updated.status === 'waiting') {
          updateDraft(draftId, { status: 'active' })
          clearPendingSelection(draftId)
          startTimer(draftId)
        }

        broadcastDraft(updated.code_url)
        const final = getDraftById(draftId)
        return res.json({ data: { ...final, items: JSON.parse(final?.items || '[]') } })
      }

      // Pick/Ban
      if (body.hero !== undefined && body.team) {
        if (existing.status !== 'active') return res.status(400).json({ error: 'Draft is not active' })
        if (body.team !== 'a' && body.team !== 'b') return res.status(400).json({ error: 'team must be "a" or "b"' })
        if (!body.hero || typeof body.hero !== 'object' || typeof body.hero.key !== 'number') {
          return res.status(400).json({ error: 'hero must have a numeric key' })
        }

        if (!acquireLock(draftId)) return res.status(409).json({ error: 'Draft is being updated, try again' })

        try {
          // Re-read after lock to get freshest state
          const locked = getDraftById(draftId)
          if (!locked) { releaseLock(draftId); return res.status(404).json({ error: 'Not found' }) }

          const currentItems = JSON.parse(locked.items || '[]')

          // Prevent duplicate hero picks
          const usedHeroIds = new Set(currentItems.map((i: any) => i?.hero?.key).filter(Boolean))
          if (usedHeroIds.has(body.hero.key)) { releaseLock(draftId); return res.status(400).json({ error: 'Hero already picked or banned' }) }

          const step = getCurrentStep(locked.sort, currentItems)
          if (!step) { releaseLock(draftId); return res.status(400).json({ error: 'Draft has no more steps' }) }
          if (step.team !== body.team) { releaseLock(draftId); return res.status(400).json({ error: 'Not your turn' }) }

          const newItem = {
            type: step.type,
            team: step.team,
            hero: body.hero,
            order: currentItems.length + 1,
          }
          const newItems = [...currentItems, newItem]
          const updated = updateDraft(draftId, { items: JSON.stringify(newItems) })
          if (!updated) { releaseLock(draftId); return res.status(500).json({ error: 'Update failed' }) }

          if (isDraftFinished(updated.sort, newItems)) {
            const finished = updateDraft(draftId, { status: 'finished' })
            clearPendingSelection(draftId)
            clearTimer(draftId)
            console.log(`[DRAFT FINISHED] Draft #${draftId} (${updated.name_a} vs ${updated.name_b}) has been completed.`)
            if (finished) sendWebhook(finished)
          } else if (updated.status === 'active') {
            clearPendingSelection(draftId)
            startTimer(draftId)
        }

          broadcastDraft(updated.code_url)
          const final = getDraftById(draftId)
          return res.json({ data: { ...final, items: newItems } })
        } finally {
          releaseLock(draftId)
        }
      }

      res.status(400).json({ error: 'Invalid request' })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Next.js handles everything else
  server.all('*', (req, res) => {
    return handle(req, res)
  })

  const httpServer = createServer(server)

  const io = new Server(httpServer, { path: '/ws' })
  setIO(io)

  io.on('connection', handleConnection)

  // Cleanup old drafts once a week (drafts older than 2 months)
  const TWO_MONTHS_HOURS = 60 * 24 * 2
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
  cleanupOldDrafts(TWO_MONTHS_HOURS) // Run on startup
  setInterval(() => {
    const deleted = cleanupOldDrafts(TWO_MONTHS_HOURS)
    if (deleted > 0) console.log(`[CLEANUP] Removed ${deleted} drafts older than 2 months`)
  }, ONE_WEEK_MS)

  httpServer.listen(port, () => {
    console.log(`> Draft server running on http://localhost:${port}`)
  })
})
