import { describe, it, expect } from 'vitest'
import { random, parseSortString, parseSortSteps, parseSortVisual, isDraftFinished, getCurrentStep } from '../../src/lib/draft'

describe('random', () => {
  it('generates a string of the specified length', () => {
    expect(random(8)).toHaveLength(8)
    expect(random(12)).toHaveLength(12)
    expect(random(16)).toHaveLength(16)
  })

  it('generates different strings each time', () => {
    const results = new Set(Array.from({ length: 20 }, () => random(16)))
    expect(results.size).toBe(20)
  })

  it('contains only alphanumeric characters', () => {
    const result = random(200)
    expect(result).toMatch(/^[a-zA-Z0-9]+$/)
  })
})

describe('parseSortSteps', () => {
  it('parses ban steps', () => {
    const steps = parseSortSteps('a#-b#')
    expect(steps).toEqual([
      { team: 'a', type: 'ban' },
      { team: 'b', type: 'ban' },
    ])
  })

  it('parses pick steps with count', () => {
    const steps = parseSortSteps('a1-b2')
    expect(steps).toEqual([
      { team: 'a', type: 'pick' },
      { team: 'b', type: 'pick' },
      { team: 'b', type: 'pick' },
    ])
  })

  it('parses mixed bans and picks', () => {
    const steps = parseSortSteps('a#-b#-a1-b2-a2-b1')
    expect(steps).toHaveLength(8)
    expect(steps[0]).toEqual({ team: 'a', type: 'ban' })
    expect(steps[1]).toEqual({ team: 'b', type: 'ban' })
    expect(steps[2]).toEqual({ team: 'a', type: 'pick' })
    expect(steps[3]).toEqual({ team: 'b', type: 'pick' })
    expect(steps[4]).toEqual({ team: 'b', type: 'pick' })
    expect(steps[5]).toEqual({ team: 'a', type: 'pick' })
    expect(steps[6]).toEqual({ team: 'a', type: 'pick' })
    expect(steps[7]).toEqual({ team: 'b', type: 'pick' })
  })

  it('returns empty for empty string', () => {
    expect(parseSortSteps('')).toEqual([])
  })

  it('parses the default sort string to 16 steps', () => {
    const steps = parseSortSteps('a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1')
    expect(steps).toHaveLength(16)
  })
})

describe('parseSortString', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseSortString(null, [])).toEqual([])
    expect(parseSortString(undefined, [])).toEqual([])
  })

  it('marks first step as current when no items', () => {
    const steps = parseSortString('a#-b#-a1-b1', [])
    expect(steps[0]).toMatchObject({ team: 'a', type: 'ban', current: true })
    expect(steps[1].current).toBeUndefined()
  })

  it('merges items and advances current', () => {
    const items = [
      { type: 'ban', team: 'a', hero: { key: 1, collection: 'deadlock_heroes' } },
    ]
    const steps = parseSortString('a#-b#-a1', items)
    expect(steps[0].hero).toEqual({ key: 1, collection: 'deadlock_heroes' })
    expect(steps[0].current).toBeUndefined()
    expect(steps[1].current).toBe(true)
  })

  it('no current when all steps filled', () => {
    const items = [{ hero: { key: 1 } }, { hero: { key: 2 } }]
    const steps = parseSortString('a1-b1', items)
    expect(steps.every(s => !s.current)).toBe(true)
  })

  it('preserves auto flag from items', () => {
    const items = [{ hero: { key: 1 }, auto: true }]
    const steps = parseSortString('a1-b1', items)
    expect(steps[0].auto).toBe(true)
  })
})

describe('parseSortVisual', () => {
  it('returns visual chips matching steps', () => {
    const chips = parseSortVisual('a#-b1-a2')
    expect(chips).toEqual([
      { team: 'a', type: 'ban' },
      { team: 'b', type: 'pick' },
      { team: 'a', type: 'pick' },
      { team: 'a', type: 'pick' },
    ])
  })
})

describe('isDraftFinished', () => {
  it('returns false when items < steps', () => {
    expect(isDraftFinished('a1-b1', [])).toBe(false)
    expect(isDraftFinished('a1-b1', [{ hero: { key: 1 } }])).toBe(false)
  })

  it('returns true when items >= steps', () => {
    const items = [{ hero: { key: 1 } }, { hero: { key: 2 } }]
    expect(isDraftFinished('a1-b1', items)).toBe(true)
  })

  it('returns false for empty sort', () => {
    expect(isDraftFinished('', [])).toBe(false)
  })
})

describe('getCurrentStep', () => {
  it('returns the next step based on items count', () => {
    expect(getCurrentStep('a#-b1', [])).toEqual({ team: 'a', type: 'ban' })
    expect(getCurrentStep('a#-b1', [{ hero: { key: 1 } }])).toEqual({ team: 'b', type: 'pick' })
  })

  it('returns undefined when all steps filled', () => {
    const items = [{ hero: { key: 1 } }, { hero: { key: 2 } }]
    expect(getCurrentStep('a1-b1', items)).toBeUndefined()
  })
})
