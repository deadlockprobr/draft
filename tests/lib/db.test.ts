import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { type Draft } from '../../src/lib/draft'

describe('Database operations', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
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
  })

  afterEach(() => {
    db.close()
  })

  it('creates a draft with all fields', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort, stream, timer_seconds, callback_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run('url123', 'admin123', 'teamA', 'teamB', 'Alpha', 'Beta', 'a#-b#-a1-b1', 0, 30, 'https://example.com/webhook')

    const row = db.prepare('SELECT * FROM drafts WHERE id = 1').get() as any
    expect(row.name_a).toBe('Alpha')
    expect(row.name_b).toBe('Beta')
    expect(row.code_url).toBe('url123')
    expect(row.code_admin).toBe('admin123')
    expect(row.status).toBe('waiting')
    expect(row.items).toBe('[]')
    expect(row.timer_seconds).toBe(30)
    expect(row.callback_url).toBe('https://example.com/webhook')
  })

  it('finds a draft by code_url', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('findme', 'admin1', 'cA', 'cB', 'A', 'B', 'a1-b1')

    const row = db.prepare('SELECT * FROM drafts WHERE code_url = ?').get('findme') as any
    expect(row.name_a).toBe('A')
  })

  it('finds a draft by code_admin', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('url1', 'secretadmin', 'cA', 'cB', 'A', 'B', 'a1-b1')

    const row = db.prepare('SELECT * FROM drafts WHERE code_admin = ?').get('secretadmin') as any
    expect(row).toBeTruthy()
    expect(row.code_url).toBe('url1')
  })

  it('updates draft fields', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('url2', 'admin2', 'cA', 'cB', 'A', 'B', 'a1-b1')

    db.prepare('UPDATE drafts SET ready_a = 1, status = ? WHERE id = 1').run('active')

    const row = db.prepare('SELECT * FROM drafts WHERE id = 1').get() as any
    expect(row.ready_a).toBe(1)
    expect(row.status).toBe('active')
  })

  it('updates items JSON', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('url3', 'admin3', 'cA', 'cB', 'A', 'B', 'a1-b1')

    const items = JSON.stringify([{ type: 'pick', team: 'a', hero: { key: 1 } }])
    db.prepare('UPDATE drafts SET items = ? WHERE id = 1').run(items)

    const row = db.prepare('SELECT * FROM drafts WHERE id = 1').get() as any
    const parsed = JSON.parse(row.items)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].hero.key).toBe(1)
  })

  it('enforces unique code_url', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('unique1', 'admin1', 'cA', 'cB', 'A', 'B', 'a1-b1')

    expect(() => {
      db.prepare(
        `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run('unique1', 'admin2', 'cA2', 'cB2', 'A2', 'B2', 'a1-b1')
    }).toThrow()
  })

  it('finds a draft by code_url but not by wrong code', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('findCode', 'admin1', 'cA', 'cB', 'A', 'B', 'a1-b1')

    const found = db.prepare('SELECT * FROM drafts WHERE code_url = ?').get('findCode')
    const notFound = db.prepare('SELECT * FROM drafts WHERE code_url = ?').get('wrongCode')
    expect(found).toBeTruthy()
    expect(notFound).toBeUndefined()
  })

  it('allows null callback_url', () => {
    db.prepare(
      `INSERT INTO drafts (code_url, code_admin, code_a, code_b, name_a, name_b, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('url4', 'admin4', 'cA', 'cB', 'A', 'B', 'a1-b1')

    const row = db.prepare('SELECT * FROM drafts WHERE id = 1').get() as any
    expect(row.callback_url).toBeNull()
  })
})
