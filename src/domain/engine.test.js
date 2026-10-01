import { describe, expect, it } from 'vitest'
import { emptyState, BLOCKS } from './model.js'
import { makePlan, nextUnsolved, mentor, blockDone, visibleBlocks, standing } from './engine.js'
import { ALL_PROBLEMS, ALL_PROBLEMS_FULL } from '../data/dsa.js'
import { APTITUDE } from '../data/practice.js'

const fresh = () => { const s = emptyState(); s.profile.startDate = '2026-10-01'; return s }

describe('ezze engine', () => {
  it('daily blocks add up to five hours', () => {
    expect(BLOCKS.reduce((s, b) => s + b.minutes, 0)).toBe(300)
  })
  it('plans two distinct DSA problems in curriculum order', () => {
    const plan = makePlan(fresh(), '2026-10-01')
    expect(plan.dsa).toEqual([ALL_PROBLEMS[0].id, ALL_PROBLEMS[1].id])
  })
  it('the pointer only moves when problems are solved (missed days cost nothing)', () => {
    const s = fresh()
    expect(nextUnsolved(s, '2026-10-05').id).toBe(ALL_PROBLEMS[0].id)
    s.dsa[ALL_PROBLEMS[0].id] = { solved: true, date: '2026-10-05', lastDone: '2026-10-05' }
    expect(nextUnsolved(s, '2026-10-06').id).toBe(ALL_PROBLEMS[1].id)
  })
  it('DSA block completes only when both planned problems are done today', () => {
    const s = fresh()
    s.plans['2026-10-01'] = makePlan(s, '2026-10-01')
    const [a, b] = s.plans['2026-10-01'].dsa
    s.dsa[a] = { solved: true, date: '2026-10-01', lastDone: '2026-10-01' }
    expect(blockDone(s, '2026-10-01', 'dsa')).toBe(false)
    s.dsa[b] = { solved: true, date: '2026-10-01', lastDone: '2026-10-01' }
    expect(blockDone(s, '2026-10-01', 'dsa')).toBe(true)
  })
  it('rest days show no blocks and a calm mentor message', () => {
    const s = fresh(); s.dayTypes['2026-10-01'] = 'rest'
    expect(visibleBlocks(s, '2026-10-01')).toHaveLength(0)
    expect(mentor(s, '2026-10-01').headline).toMatch(/Rest/)
  })
  it('every aptitude question has a valid answer index and explanation', () => {
    APTITUDE.forEach((q) => { expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length); expect(q.why.length).toBeGreaterThan(5) })
  })
  it('problem and question ids are unique across the whole bank', () => {
    expect(new Set(ALL_PROBLEMS_FULL.map((p) => p.id)).size).toBe(ALL_PROBLEMS_FULL.length)
    expect(new Set(APTITUDE.map((q) => q.id)).size).toBe(APTITUDE.length)
  })
  it('SQL is a side track and stays out of the daily DSA plan', () => {
    expect(ALL_PROBLEMS.some((p) => p.side)).toBe(false)
    expect(ALL_PROBLEMS_FULL.some((p) => p.side)).toBe(true)
  })
  it('standing report is honest on day one and reflects progress later', () => {
    const s = fresh()
    const r0 = standing(s, '2026-10-01')
    expect(r0.overall).toBe(0)
    expect(r0.summary).toMatch(/beginning/)
    ALL_PROBLEMS.slice(0, 20).forEach((p) => { s.dsa[p.id] = { solved: true, date: '2026-10-05', lastDone: '2026-10-05' } })
    const r1 = standing(s, '2026-10-06')
    expect(r1.overall).toBeGreaterThan(0)
    expect(r1.areas.find((a) => a.id === 'dsa').status).toBe('ahead')
  })
})
