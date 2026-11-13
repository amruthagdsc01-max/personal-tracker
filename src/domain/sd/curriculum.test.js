import { describe, it, expect } from 'vitest'
import { LESSONS, BY_ID, STAGES, PROBLEMS, ASSESSMENTS, TRADEOFF_QS, CASES, RUBRIC_DIMS, DIM_LESSONS, allPrereqs, interviewBank } from '../../data/sd/index.js'

describe('curriculum integrity', () => {
  it('has unique lesson ids and valid stages', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    for (const l of LESSONS) expect(STAGES.some((s) => s.id === l.stage)).toBe(true)
  })
  it('only references prerequisites and related lessons that exist, and never forward-depends', () => {
    const order = Object.fromEntries(LESSONS.map((l, i) => [l.id, i]))
    for (const l of LESSONS) {
      for (const p of l.prereq) { expect(BY_ID[p], `${l.id} -> ${p}`).toBeTruthy(); expect(order[p]).toBeLessThan(order[l.id]) }
      for (const r of l.related) expect(BY_ID[r], `${l.id} related ${r}`).toBeTruthy()
    }
  })
  it('has no cycles', () => {
    for (const l of LESSONS) expect(allPrereqs(l.id)).not.toContain(l.id)
  })
  it('every lesson has four levels with a valid check, five quiz items and complete teaching parts', () => {
    for (const l of LESSONS) {
      expect(l.levels, l.id).toHaveLength(4)
      for (const v of l.levels) { expect(v.body.length).toBeGreaterThan(0); expect(v.check.o[v.check.a], `${l.id} check`).toBeTruthy(); expect(v.check.o.length).toBeGreaterThanOrEqual(3) }
      expect(l.quiz, l.id).toHaveLength(5)
      expect(l.quiz.filter((q) => q.kind === 'concept')).toHaveLength(3)
      expect(l.quiz.filter((q) => q.kind === 'scenario')).toHaveLength(2)
      for (const q of l.quiz) { expect(q.o[q.a], `${l.id} quiz`).toBeTruthy(); expect(q.why.length).toBeGreaterThan(5) }
      expect(l.hook.hints.length).toBeGreaterThanOrEqual(3)
      expect(l.interview.points.length).toBeGreaterThanOrEqual(3)
      expect(l.challenge.points.length).toBeGreaterThanOrEqual(3)
      expect(l.summary.key.length).toBeGreaterThan(0)
      expect(l.refs.length).toBeGreaterThan(0)
      for (const r of l.refs) expect(r.url).toMatch(/^https:\/\//)
    }
  })
  it('does not always put the correct answer in the same position', () => {
    const pos = LESSONS.flatMap((l) => [...l.quiz.map((q) => q.a), ...l.levels.map((v) => v.check.a)])
    const counts = [0, 1, 2, 3].map((i) => pos.filter((p) => p === i).length)
    expect(Math.max(...counts) / pos.length).toBeLessThan(0.5)
  })
  it('covers stages 1-5 and keeps stage-6 problems complete', () => {
    for (const s of [1, 2, 3, 4, 5]) expect(LESSONS.some((l) => l.stage === s)).toBe(true)
    for (const p of PROBLEMS) {
      for (const r of p.prereq) expect(BY_ID[r], `${p.id} prereq ${r}`).toBeTruthy()
      expect(p.steps.length).toBeGreaterThanOrEqual(5)
      for (const s of p.steps) expect(s.opts.filter((o) => o.good)).toHaveLength(1)
      for (const d of RUBRIC_DIMS) expect(p.rubric[d.id]?.length, `${p.id}.${d.id}`).toBeGreaterThanOrEqual(2)
    }
    for (const d of RUBRIC_DIMS) for (const id of DIM_LESSONS[d.id]) expect(BY_ID[id]).toBeTruthy()
  })
  it('has an assessment per stage with all eight criteria and valid revisit links', () => {
    for (const s of STAGES) {
      const a = ASSESSMENTS[s.id]
      expect(a, `stage ${s.id}`).toBeTruthy()
      expect(a.points).toHaveLength(8)
      for (const ids of Object.values(a.revisit)) for (const id of ids) expect(BY_ID[id], id).toBeTruthy()
    }
  })
  it('builds an interview bank spanning difficulty levels', () => {
    const bank = interviewBank(TRADEOFF_QS)
    expect(bank.length).toBe(LESSONS.length + TRADEOFF_QS.length)
    expect(new Set(bank.map((q) => q.level))).toEqual(new Set(['Beginner', 'Intermediate', 'Advanced']))
    expect(new Set(bank.map((q) => q.id)).size).toBe(bank.length)
    expect(CASES.length).toBeGreaterThan(3)
  })
})
