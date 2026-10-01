import { describe, expect, it } from 'vitest'
import { emptyState } from './model.js'
import { MOCK_SETS } from '../data/mocks.js'
import { CS_QUESTIONS } from '../data/cs.js'
import { QA } from '../data/interviewQA.js'
import { APTITUDE } from '../data/practice.js'
import { buildMock, rng, scoreMcq, scoreCoding, scoreQa, summarise, bandFor, timeNote, compareWithPrevious, scorecardText, fmtDuration, CUTOFF } from './mock.js'
import { mockStats, standing } from './engine.js'

const fresh = () => { const s = emptyState(); s.profile.startDate = '2026-10-01'; return s }

describe('mock content', () => {
  it('CS and QA banks are well-formed with unique ids', () => {
    CS_QUESTIONS.forEach((q) => { expect(q.answer).toBeLessThan(q.options.length); expect(new Set(q.options).size).toBe(q.options.length) })
    expect(new Set(CS_QUESTIONS.map((q) => q.id)).size).toBe(CS_QUESTIONS.length)
    QA.forEach((q) => expect(q.points.length).toBeGreaterThanOrEqual(3))
    expect(new Set(QA.map((q) => q.id)).size).toBe(QA.length)
  })
  it('every set builds with usable items in every round', () => {
    MOCK_SETS.forEach((set) => {
      const m = buildMock(set, fresh(), rng(7))
      expect(m.rounds).toHaveLength(set.rounds.length)
      m.rounds.forEach((r) => expect(r.items.length).toBeGreaterThan(0))
    })
  })
  it('shuffling keeps the correct answer pointing at the correct option', () => {
    const m = buildMock(MOCK_SETS.find((s) => s.id === 'blitz-cs'), fresh(), rng(3))
    const round = m.rounds[0]
    round.items.forEach((it) => {
      const orig = CS_QUESTIONS.find((q) => q.id === it.id)
      expect(it.options[it.answer]).toBe(orig.options[orig.answer])
    })
    expect(round.items).toHaveLength(20)
  })
  it('aptitude rounds use the aptitude bank', () => {
    const m = buildMock(MOCK_SETS[0], fresh(), rng(1))
    const ids = m.rounds[0].items.map((i) => i.id)
    ids.forEach((id) => expect(APTITUDE.some((q) => q.id === id)).toBe(true))
  })
  it('coding rounds avoid already-solved problems and never repeat one', () => {
    const s = fresh()
    s.dsa['two-sum'] = { solved: true }
    for (let seed = 0; seed < 20; seed++) {
      const m = buildMock(MOCK_SETS.find((x) => x.id === 'bigtech'), s, rng(seed))
      const ids = m.rounds.filter((r) => r.type === 'coding').flatMap((r) => r.items)
      expect(ids).not.toContain('two-sum')
    }
    const same = buildMock(MOCK_SETS.find((x) => x.id === 'product'), s, rng(5)).rounds.filter((r) => r.type === 'coding').flatMap((r) => r.items)
    expect(new Set(same).size).toBe(same.length)
  })
})

describe('mock scoring', () => {
  const mcq = { label: 'x', items: [{ topic: 'oop', q: 'a', options: ['p', 'q'], answer: 0, why: '' }, { topic: 'oop', q: 'b', options: ['p', 'q'], answer: 1, why: '' }, { topic: 'os', q: 'c', options: ['p', 'q'], answer: 0, why: '' }] }
  it('scores MCQs and records per-topic accuracy and wrong answers', () => {
    const r = scoreMcq(mcq, { 0: 0, 1: 0 }) // one right, one wrong, one unanswered
    expect(r.correct).toBe(1)
    expect(r.score).toBe(33)
    expect(r.byTopic.oop).toEqual([1, 2])
    expect(r.wrong).toHaveLength(2)
    expect(r.wrong[1].picked).toBe(null)
  })
  it('scores coding: solved 1, partial half, none 0', () => {
    const r = scoreCoding({ label: 'c', items: ['two-sum', 'three-sum-x'] }, { 0: { status: 'solved' }, 1: { status: 'partial' } })
    expect(r.score).toBe(75)
  })
  it('scores spoken answers on coverage (60%) plus self-rated clarity (40%)', () => {
    const id = QA[0].id
    const total = QA[0].points.length
    const full = scoreQa({ label: 'q', items: [id] }, [{ covered: QA[0].points.map((_, i) => i), rating: 5 }])
    expect(full.score).toBe(100)
    const none = scoreQa({ label: 'q', items: [id] }, [{ covered: [], rating: 0 }])
    expect(none.score).toBe(0)
    expect(none.items[0].missed).toHaveLength(total)
  })
  it('summary names weak topics only when there is enough evidence', () => {
    const rounds = [{ type: 'mcq', label: 'a', score: 40, byTopic: { dbms: [0, 3], oop: [3, 3], os: [0, 1] }, wrong: [] }]
    const s = summarise(rounds)
    expect(s.weak).toEqual(['dbms']) // os has only 1 question: not enough to judge
    expect(s.advice[0].to).toBe('learn')
  })
})

describe('mock history in the standing report', () => {
  it('is neutral at first and reflects mocks afterwards', () => {
    const s = fresh()
    expect(standing(s, '2026-10-02').areas.find((a) => a.id === 'mock').status).toBe('start')
    s.mocks.push({ date: '2026-10-02', name: 'x', overall: 80, topics: { oop: [4, 5] } })
    const area = standing(s, '2026-10-03').areas.find((a) => a.id === 'mock')
    expect(area.status).toBe('ahead')
    expect(mockStats(s, '2026-10-03').count).toBe(1)
  })
})

describe('full-length scorecard', () => {
  const round = { type: 'mcq', label: 'Quiz', minutes: 10, items: [{ topic: 'oop', q: 'a', options: ['p', 'q'], answer: 0, why: '' }, { topic: 'oop', q: 'b', options: ['p', 'q'], answer: 0, why: '' }] }
  it('records pass mark, attempts and time used on every round result', () => {
    const r = scoreMcq(round, { 0: 0, 1: 0 }, { timeUsed: 300 })
    expect(r.cut).toBe(CUTOFF.mcq)
    expect(r.passed).toBe(true)
    expect(r.attempted).toBe(2)
    expect(r.timeUsed).toBe(300)
    expect(r.allowed).toBe(600)
    expect(scoreMcq(round, { 0: 1 }, { timeUsed: 600 }).passed).toBe(false)
  })
  it('counts skipped spoken answers as not attempted', () => {
    const r = scoreQa({ type: 'qa', label: 'q', minutes: 5, items: [QA[0].id, QA[1].id] }, [{ covered: [0], rating: 3 }, { covered: [], rating: 0, skipped: true }])
    expect(r.attempted).toBe(1)
  })
  it('readiness band needs both a high score and every round cleared', () => {
    expect(bandFor(80, true).tone).toBe('good')
    expect(bandFor(80, false).tone).toBe('ok')
    expect(bandFor(50, false).tone).toBe('warn')
    expect(bandFor(20, false).tone).toBe('low')
  })
  it('time notes are honest about running out of time or rushing', () => {
    const base = { type: 'mcq', total: 10, attempted: 10, allowed: 600, cut: 60, score: 80 }
    expect(timeNote({ ...base, timeUsed: 600, attempted: 6 })).toMatch(/ran out.*4 unattempted/)
    expect(timeNote({ ...base, timeUsed: 590 })).toMatch(/full time/)
    expect(timeNote({ ...base, timeUsed: 200, score: 30 })).toMatch(/slow down/)
    expect(timeNote({ ...base, timeUsed: 300 })).toMatch(/5 min to spare/)
  })
  it('compares with the previous attempt of the same set and mode only', () => {
    const mocks = [
      { setId: 'service', mode: 'practice', overall: 90, rounds: [{ label: 'A', score: 90 }] },
      { setId: 'service', mode: 'full', overall: 50, rounds: [{ label: 'A', score: 40 }, { label: 'B', score: 60 }] },
      { setId: 'ai', mode: 'full', overall: 99, rounds: [] },
    ]
    const c = compareWithPrevious(mocks, 'service', 'full', 65, [{ label: 'A', score: 70 }, { label: 'B', score: 55 }])
    expect(c.delta).toBe(15)
    expect(c.roundDeltas).toEqual([30, -5])
    expect(compareWithPrevious(mocks, 'bigtech', 'full', 50, [])).toBe(null)
  })
  it('formats durations and the shareable scorecard text', () => {
    expect(fmtDuration(125)).toBe('2m 05s')
    expect(fmtDuration(3900)).toBe('1h 5m')
    const t = scorecardText({ name: 'Set', mode: 'full', date: '2026-10-05', overall: 72, band: { label: 'Close' }, rounds: [{ label: 'Quiz', score: 72, cut: 60, passed: true }], totalUsed: 600, totalAllowed: 900, focusLost: 2, weak: ['DBMS'] })
    expect(t).toMatch(/72%/); expect(t).toMatch(/Left the tab: 2 times/); expect(t).toMatch(/Work on: DBMS/)
  })
})
