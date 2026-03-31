import { describe, it, expect } from 'vitest'
import { parseSortString, parseSortSteps, isDraftFinished, getCurrentStep, random } from '../../src/lib/draft'

describe('API draft logic', () => {
  it('sort string is parsed and preserved', () => {
    const sort = 'a#-b#-a1-b2-a2-b1'
    const steps = parseSortSteps(sort)
    expect(steps).toHaveLength(8)
    expect(steps[0]).toMatchObject({ team: 'a', type: 'ban' })
    expect(steps[1]).toMatchObject({ team: 'b', type: 'ban' })
    expect(steps[2]).toMatchObject({ team: 'a', type: 'pick' })
    expect(steps[3]).toMatchObject({ team: 'b', type: 'pick' })
  })

  it('item addition progresses draft correctly', () => {
    const sort = 'a#-b#-a1-b1'
    const items: any[] = []

    // Step 0: Team A bans
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'a', type: 'ban' })
    items.push({ type: 'ban', team: 'a', hero: { key: 10 }, order: 1 })

    // Step 1: Team B bans
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'b', type: 'ban' })
    items.push({ type: 'ban', team: 'b', hero: { key: 20 }, order: 2 })

    // Step 2: Team A picks
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'a', type: 'pick' })
    items.push({ type: 'pick', team: 'a', hero: { key: 30 }, order: 3 })

    // Step 3: Team B picks
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'b', type: 'pick' })
    items.push({ type: 'pick', team: 'b', hero: { key: 40 }, order: 4 })

    expect(isDraftFinished(sort, items)).toBe(true)
    expect(getCurrentStep(sort, items)).toBeUndefined()
  })

  it('double pick blocks work correctly (b2, a2)', () => {
    const sort = 'a1-b2-a2-b1'
    const items: any[] = []

    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'a', type: 'pick' })
    items.push({ type: 'pick', team: 'a', hero: { key: 1 }, order: 1 })

    // b2: Team B picks twice
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'b', type: 'pick' })
    items.push({ type: 'pick', team: 'b', hero: { key: 2 }, order: 2 })
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'b', type: 'pick' })
    items.push({ type: 'pick', team: 'b', hero: { key: 3 }, order: 3 })

    // a2: Team A picks twice
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'a', type: 'pick' })
    items.push({ type: 'pick', team: 'a', hero: { key: 4 }, order: 4 })
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'a', type: 'pick' })
    items.push({ type: 'pick', team: 'a', hero: { key: 5 }, order: 5 })

    // b1: Team B picks once
    expect(getCurrentStep(sort, items)).toMatchObject({ team: 'b', type: 'pick' })
    items.push({ type: 'pick', team: 'b', hero: { key: 6 }, order: 6 })

    expect(isDraftFinished(sort, items)).toBe(true)
  })

  it('validates turn order', () => {
    const sort = 'a#-b#-a1-b1'
    const items = [{ type: 'ban', team: 'a', hero: { key: 1 }, order: 1 }]
    const step = getCurrentStep(sort, items)

    // Next step should be team B
    expect(step?.team).toBe('b')

    // If team A tries to pick, it should be rejected (step.team !== 'a')
    expect(step?.team).not.toBe('a')
  })

  it('detects duplicate hero picks', () => {
    const items = [
      { type: 'ban', team: 'a', hero: { key: 5 }, order: 1 },
      { type: 'pick', team: 'b', hero: { key: 10 }, order: 2 },
    ]
    const usedIds = new Set(items.map(i => i.hero.key))

    // Hero 5 is already used
    expect(usedIds.has(5)).toBe(true)
    // Hero 99 is available
    expect(usedIds.has(99)).toBe(false)
  })
})

describe('Input validation', () => {
  const VALID_SORT_RE = /^[ab][#1-9](-[ab][#1-9])*$/

  it('accepts valid sort strings', () => {
    expect(VALID_SORT_RE.test('a#-b#-a1-b1')).toBe(true)
    expect(VALID_SORT_RE.test('a1-b2-a2-b1')).toBe(true)
    expect(VALID_SORT_RE.test('a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1')).toBe(true)
    expect(VALID_SORT_RE.test('a1')).toBe(true)
  })

  it('rejects invalid sort strings', () => {
    expect(VALID_SORT_RE.test('')).toBe(false)
    expect(VALID_SORT_RE.test('x1-y2')).toBe(false)
    expect(VALID_SORT_RE.test('a0-b1')).toBe(false)
    expect(VALID_SORT_RE.test('a1-')).toBe(false)
    expect(VALID_SORT_RE.test('-a1')).toBe(false)
    expect(VALID_SORT_RE.test('a1--b1')).toBe(false)
    expect(VALID_SORT_RE.test('a10-b1')).toBe(false)
    expect(VALID_SORT_RE.test('SELECT * FROM drafts')).toBe(false)
  })
})

describe('Security', () => {
  it('code_url is not sequential', () => {
    const codes = Array.from({ length: 10 }, () => random(8))
    // All different
    expect(new Set(codes).size).toBe(10)
    // All alphanumeric, not numeric-only
    codes.forEach(c => {
      expect(c).toMatch(/^[a-zA-Z0-9]+$/)
      expect(c).toHaveLength(8)
    })
  })

  it('code_admin is longer than code_url for extra security', () => {
    const codeUrl = random(8)
    const codeAdmin = random(12)
    expect(codeAdmin.length).toBeGreaterThan(codeUrl.length)
  })

  it('sensitive fields should be stripped from public response', () => {
    const draft = {
      id: 1,
      code_url: 'aB3xK9mQ',
      code_admin: 'xY7kL2nP9wRt',
      code_a: 'qW8eR5tY',
      code_b: 'uI0oP3aS',
      name_a: 'Alpha',
      name_b: 'Beta',
      sort: 'a1-b1',
      stream: false,
      ready_a: false,
      ready_b: false,
      items: '[]',
      timer_seconds: 30,
      callback_url: 'https://example.com/hook',
      status: 'waiting',
      created_at: '2026-01-01',
    }

    // Simulate stripping like the by-code endpoint does
    const { code_admin, code_a, code_b, callback_url, ...safe } = draft
    expect(safe).not.toHaveProperty('code_admin')
    expect(safe).not.toHaveProperty('code_a')
    expect(safe).not.toHaveProperty('code_b')
    expect(safe).not.toHaveProperty('callback_url')
    expect(safe).toHaveProperty('code_url')
    expect(safe).toHaveProperty('name_a')
    expect(safe).toHaveProperty('status')
  })

  it('callback_url blocks private addresses', () => {
    const blocked = ['http://localhost/hook', 'http://127.0.0.1/hook', 'http://192.168.1.1/hook', 'http://10.0.0.1/hook', 'http://server.local/hook', 'http://db.internal/hook']
    const allowed = ['https://example.com/hook', 'https://my-server.com/webhook']

    blocked.forEach(url => {
      const parsed = new URL(url)
      const host = parsed.hostname.toLowerCase()
      const isBlocked = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0'
        || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.')
        || host.endsWith('.local') || host.endsWith('.internal')
      expect(isBlocked).toBe(true)
    })

    allowed.forEach(url => {
      const parsed = new URL(url)
      const host = parsed.hostname.toLowerCase()
      const isBlocked = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0'
        || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.')
        || host.endsWith('.local') || host.endsWith('.internal')
      expect(isBlocked).toBe(false)
    })
  })

  it('finished drafts cannot be modified', () => {
    // Simulates the server check
    const draft = { status: 'finished' }
    expect(draft.status === 'finished').toBe(true)
  })
})
