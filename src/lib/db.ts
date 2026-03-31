import Database from 'better-sqlite3'
import path from 'path'
import type { Draft } from './draft'

const DB_PATH = path.resolve(process.cwd(), 'draft.db')

let db: Database.Database | null = null

export function initDb(): Database.Database {
  if (db) return db

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_url TEXT NOT NULL UNIQUE,
      code_admin TEXT NOT NULL,
      code_a TEXT NOT NULL,
      code_b TEXT NOT NULL,
      name_a TEXT NOT NULL,
      name_b TEXT NOT NULL,
      sort TEXT NOT NULL,
      stream INTEGER NOT NULL DEFAULT 0,
      ready_a INTEGER NOT NULL DEFAULT 0,
      ready_b INTEGER NOT NULL DEFAULT 0,
      items TEXT NOT NULL DEFAULT '[]',
      timer_seconds INTEGER NOT NULL DEFAULT 30,
      callback_url TEXT,
      status TEXT NOT NULL DEFAULT 'waiting',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  return db
}

export function getDb(): Database.Database {
  if (!db) return initDb()
  return db
}

export function createDraft(data: {
  code_url: string
  code_admin: string
  code_a: string
  code_b: string
  name_a: string
  name_b: string
  sort: string
  stream: boolean
  timer_seconds?: number
  callback_url?: string
}): Draft {
  const d = getDb()
  d.prepare(
    `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort, stream, timer_seconds, callback_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(data.code_url, data.code_admin, data.code_a, data.code_b, data.name_a, data.name_b, data.sort, data.stream ? 1 : 0, data.timer_seconds ?? 30, data.callback_url ?? null)

  const row = d.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
  return getDraftById(row.id)!
}

export function getDraftById(id: number): Draft | undefined {
  const row = getDb().prepare('SELECT * FROM drafts WHERE id = ?').get(id) as any
  if (!row) return undefined
  return normalizeDraft(row)
}

export function getDraftByAdminCode(code: string): Draft | undefined {
  const row = getDb().prepare('SELECT * FROM drafts WHERE code_admin = ?').get(code) as any
  if (!row) return undefined
  return normalizeDraft(row)
}

export function getDraftByCodeUrl(codeUrl: string): Draft | undefined {
  const row = getDb().prepare('SELECT * FROM drafts WHERE code_url = ?').get(codeUrl) as any
  if (!row) return undefined
  return normalizeDraft(row)
}

export function getDraftByTeamCode(codeUrl: string, codeTeam: string): { draft: Draft; team: 'a' | 'b' } | undefined {
  const draft = getDraftByCodeUrl(codeUrl)
  if (!draft) return undefined
  if (draft.code_a === codeTeam) return { draft, team: 'a' }
  if (draft.code_b === codeTeam) return { draft, team: 'b' }
  return undefined
}

export function updateDraft(id: number, data: Partial<Pick<Draft, 'ready_a' | 'ready_b' | 'items' | 'status'>>): Draft | undefined {
  const sets: string[] = []
  const values: any[] = []

  if (data.ready_a !== undefined) { sets.push('ready_a = ?'); values.push(data.ready_a ? 1 : 0) }
  if (data.ready_b !== undefined) { sets.push('ready_b = ?'); values.push(data.ready_b ? 1 : 0) }
  if (data.items !== undefined) { sets.push('items = ?'); values.push(data.items) }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status) }

  if (sets.length === 0) return getDraftById(id)

  values.push(id)
  const d = getDb()
  d.prepare(`UPDATE drafts SET ${sets.join(', ')} WHERE id = ?`).run(...values)
  return getDraftById(id)
}

function normalizeDraft(row: any): Draft {
  return {
    ...row,
    stream: !!row.stream,
    ready_a: !!row.ready_a,
    ready_b: !!row.ready_b,
  }
}

export function getStats() {
  const db = getDb()
  const created24h = (db.prepare(
    `SELECT COUNT(*) as count FROM drafts WHERE created_at >= datetime('now', '-24 hours')`
  ).get() as any).count
  const totalFinished = (db.prepare(
    `SELECT COUNT(*) as count FROM drafts WHERE status = 'finished'`
  ).get() as any).count
  return { created24h, totalFinished }
}

export function cleanupOldDrafts(olderThanHours = 24): number {
  const result = getDb().prepare(
    `DELETE FROM drafts WHERE created_at < datetime('now', '-' || ? || ' hours')`
  ).run(olderThanHours)
  return result.changes
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
