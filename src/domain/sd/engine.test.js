import { describe, it, expect } from 'vitest'
import { emptySd, recordQuiz, recordReview, mastery, nextLesson, makeSdPlan, dueReviews, streakInfo, weekInfo, readiness, suggestChecks, coverage, searchLessons, mentorReply, prereqsMet, levelOpen, weakTopics, mapLayout, reviewQuestions, blockDone } from './engine.js'
import { LESSONS } from '../../data/sd/index.js'

const D1 = '2026-03-02'
const withQuiz = (sd, id, score, date = D1) => ({ ...sd, les: { ...sd.les, [id]: recordQuiz(sd, id, score, 5, [], date) } })

describe('mastery is evidence based', () => {
  it('opening a lesson does nothing; a level check makes it learning', () => {
    const sd = emptySd()
    expect(mastery(sd, 'web-journey', D1).key).toBe('none')
    sd.les['web-journey'] = { checks: { 0: true }, quizzes: [], srs: { step: 0, due: null, lapses: 0 } }
    expect(mastery(sd, 'web-journey', D1).key).toBe('learning')
  })
  it('walks up the levels only with real evidence', () => {
    let sd = withQuiz(emptySd(), 'caching', 4)
    expect(mastery(sd, 'caching', D1).key).toBe('learning')
    sd.les.caching.expl = { date: D1, cov: 0.8 }
    expect(mastery(sd, 'caching', D1).key).toBe('explain')
    sd.les.caching.appl = { date: D1, cov: 0.7 }
    expect(mastery(sd, 'caching', D1).key).toBe('apply')
    sd.les.caching.intv = { date: D1, cov: 0.7 }
    expect(mastery(sd, 'caching', D1).key).toBe('apply')
    sd = withQuiz(sd, 'caching', 5, '2026-03-03')
    sd.les.caching.srs.step = 2
    expect(mastery(sd, 'caching', '2026-03-03').key).toBe('ready')
  })
  it('drops to needs revision after a failed quiz or an overdue review', () => {
    let sd = withQuiz(emptySd(), 'caching', 5)
    sd.les.caching.expl = { cov: 1 }
    expect(mastery(sd, 'caching', D1).key).toBe('explain')
    expect(mastery(sd, 'caching', '2026-04-20').key).toBe('revise')
    sd = withQuiz(emptySd(), 'caching', 2)
    expect(mastery(sd, 'caching', D1).key).toBe('revise')
  })
})

describe('spaced repetition', () => {
  it('lengthens the interval on passes and resets on a failure', () => {
    const sd = withQuiz(emptySd(), 'caching', 5, D1)
    expect(sd.les.caching.srs.due).toBe('2026-03-03')
    sd.les.caching = recordReview(sd, 'caching', 3, 3, '2026-03-03')
    expect(sd.les.caching.srs.due).toBe('2026-03-06')
    sd.les.caching = recordReview(sd, 'caching', 1, 3, '2026-03-06')
    expect(sd.les.caching.srs).toMatchObject({ step: 0, lapses: 1, due: '2026-03-07' })
  })
  it('lists due reviews oldest first and prefers previously missed questions', () => {
    let sd = withQuiz(emptySd(), 'caching', 5, '2026-03-01')
    sd = withQuiz(sd, 'indexing', 5, '2026-03-02')
    expect(dueReviews(sd, '2026-03-04').map((x) => x.id)).toEqual(['caching', 'indexing'])
    sd.les.caching.quizzes[0].wrong = [3]
    expect(reviewQuestions(sd, 'caching', 2)[0].i).toBe(3)
  })
})

describe('gating and the daily plan', () => {
  it('only offers lessons whose prerequisites were understood', () => {
    const sd = emptySd()
    expect(nextLesson(sd).id).toBe('web-journey')
    expect(prereqsMet(sd, 'ip-dns')).toBe(false)
    expect(levelOpen({ checks: {} }, 1)).toBe(false)
    expect(nextLesson(withQuiz(sd, 'web-journey', 5)).id).toBe('ip-dns')
  })
  it('continues a half-finished lesson before starting a new one', () => {
    const sd = emptySd()
    sd.les['web-journey'] = { checks: { 0: true, 1: true }, quizzes: [], srs: { step: 0, due: null, lapses: 0 } }
    expect(nextLesson(sd).id).toBe('web-journey')
  })
  it('plans a revision when something is due and a new lesson otherwise', () => {
    const sd = withQuiz(emptySd(), 'web-journey', 5, '2026-03-01')
    const p = makeSdPlan(sd, '2026-03-02')
    expect(p).toMatchObject({ revise: 'web-journey', learn: 'ip-dns' })
    expect(blockDone({ ...sd, plan: { '2026-03-02': { ...p, done: {} } } }, '2026-03-02', 'learn')).toBe(false)
  })
})

describe('streaks never punish', () => {
  it('counts consecutive days, keeps yesterday alive, and reports the gap after a miss', () => {
    const sd = { ...emptySd(), days: ['2026-03-01', '2026-03-02', '2026-03-03'] }
    expect(streakInfo(sd, '2026-03-03').streak).toBe(3)
    expect(streakInfo(sd, '2026-03-04').streak).toBe(3)
    const after = streakInfo(sd, '2026-03-08')
    expect(after.streak).toBe(0); expect(after.longest).toBe(3); expect(after.total).toBe(3); expect(after.gap).toBe(5)
    expect(weekInfo(sd, '2026-03-04').count).toBe(2) // Sunday 03-01 belongs to the previous week
  })
  it('starts with zero readiness (no fake numbers)', () => {
    expect(readiness(emptySd(), D1)).toMatchObject({ pct: 0, mock: null })
  })
})

describe('answers and rubric', () => {
  it('suggests rubric ticks from keywords and computes coverage', () => {
    const pts = LESSONS.find((l) => l.id === 'caching').interview.points
    const c = suggestChecks('I would use cache-aside with Redis and a TTL; on a write I invalidate the key.', pts)
    expect(c[0]).toBe(true)
    expect(coverage(c)).toBeGreaterThan(0.3)
    expect(coverage([])).toBe(0)
  })
  it('finds weak prerequisites behind a failing topic', () => {
    let sd = withQuiz(emptySd(), 'databases', 3)
    sd = withQuiz(sd, 'indexing', 1)
    expect(weakTopics(sd, D1).find((x) => x.id === 'indexing').weakPre).toContain('databases')
  })
})

describe('search and mentor', () => {
  it('finds lessons by topic and honours filters', () => {
    expect(searchLessons('what is a cache hit ratio')[0].lesson.id).toBe('caching')
    expect(searchLessons('replication lag', { stage: 3 }).every((x) => x.lesson.stage === 3)).toBe(true)
    expect(searchLessons('zzzzqqq')).toEqual([])
  })
  it('answers from the curriculum and admits what it does not know', () => {
    expect(mentorReply('explain caching in simpler words').text).toMatch(/Simpler version/)
    expect(mentorReply('give me an example of idempotency').sources).toContain('idempotency-retries')
    expect(mentorReply('xylophone quantum banana').text).toMatch(/could not find/)
    expect(mentorReply('give me a hint', { lessonId: 'caching', sd: emptySd() }).hint).toBe(true)
  })
  it('lays out the dependency map without overlapping nodes', () => {
    const { pos, edges } = mapLayout()
    expect(Object.keys(pos)).toHaveLength(LESSONS.length)
    expect(edges.length).toBeGreaterThan(LESSONS.length)
    expect(new Set(Object.values(pos).map((p) => `${p.x},${p.y}`)).size).toBe(LESSONS.length)
  })
})
