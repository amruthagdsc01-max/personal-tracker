// Learning engine for the System Design module: mastery, spaced repetition, daily plan, streaks,
// search, rubric scoring and the local mentor. Pure functions over the persisted `sd` state.
import { LESSONS, BY_ID, MASTERY, allPrereqs, STAGES, PROBLEMS, interviewBank, TRADEOFF_QS } from '../../data/sd/index.js'
import { addDays, daysBetween, parse, toISO } from '../dates.js'

export const PASS = 0.6
export const GOOD = 0.7
export const INTERVALS = [1, 3, 7, 14, 30, 60]
export const WEEK_GOAL = 5

export const emptySd = () => ({
  onboarded: false, level: null, startDate: null, days: [], les: {}, notes: {}, bm: [], probs: {}, mocks: [], asmt: {}, iq: {}, plan: {}, labs: {}, mentor: [],
})

/** Always returns a complete sd object, even for state saved before this feature existed. */
export const sdOf = (state) => ({ ...emptySd(), ...(state.sd || {}) })

const rec = (sd, id) => sd.les[id] || { checks: {}, quizzes: [], srs: { step: 0, due: null, lapses: 0 } }
export const lessonRec = rec

export const lastQuiz = (r) => r.quizzes[r.quizzes.length - 1] || null
export const quizRatio = (q) => (q ? q.score / q.total : 0)
export const quizPassed = (r) => r.quizzes.some((q) => quizRatio(q) >= PASS)
export const levelsPassed = (r) => [0, 1, 2, 3].filter((i) => r.checks[i]).length
/** Level n (0-3) is open once the previous level's check was answered correctly. */
export const levelOpen = (r, n) => n === 0 || !!r.checks[n - 1]

/** Prerequisites not yet understood well enough (quiz passed) for lesson `id`. */
export function missingPrereqs(sd, id) {
  return (BY_ID[id]?.prereq || []).filter((p) => !quizPassed(rec(sd, p)))
}
export const prereqsMet = (sd, id) => missingPrereqs(sd, id).length === 0

/**
 * Mastery is derived from evidence, never from having opened a page:
 *  learning -> some level check or quiz done
 *  explain  -> quiz >= 70% AND explained in own words (>= 60% of key points)
 *  apply    -> + the practical challenge answered (>= 60% of points)
 *  ready    -> + interview question answered (>= 60%), latest quiz >= 80%, and 2 successful spaced reviews
 *  revise   -> latest quiz below 60%, or a review is overdue
 */
export function mastery(sd, id, date) {
  const r = rec(sd, id)
  const q = lastQuiz(r)
  const touched = levelsPassed(r) > 0 || r.quizzes.length > 0 || r.expl || r.appl || r.intv
  if (!touched) return MASTERY[0]
  const best = Math.max(0, ...r.quizzes.map(quizRatio))
  const last = quizRatio(q)
  let m = 1
  if (best >= GOOD && r.expl?.cov >= PASS) m = 3
  if (m === 3 && r.appl?.cov >= PASS) m = 4
  if (m === 4 && r.intv?.cov >= PASS && last >= 0.8 && r.srs.step >= 2) m = 5
  if (q && last < PASS) m = 2
  else if (m > 1 && r.srs.due && date && r.srs.due < date) m = 2
  return MASTERY[m]
}

/** Record a finished end-of-lesson quiz and schedule the next review (spaced repetition). */
export function recordQuiz(sd, id, score, total, wrong, date) {
  const r = structuredClone(rec(sd, id))
  r.quizzes.push({ date, score, total, wrong })
  const pass = score / total >= GOOD
  r.srs = r.srs || { step: 0, due: null, lapses: 0 }
  if (pass) { r.srs.due = addDays(date, INTERVALS[Math.min(r.srs.step, INTERVALS.length - 1)]); r.srs.step += 1 }
  else { r.srs.step = 0; r.srs.lapses += 1; r.srs.due = addDays(date, 1) }
  return r
}
/** Record the outcome of a spaced-repetition review (same scheduling, no new quiz entry). */
export function recordReview(sd, id, correct, total, date) {
  const r = structuredClone(rec(sd, id))
  const pass = correct / total >= GOOD
  r.srs = r.srs || { step: 0, due: null, lapses: 0 }
  if (pass) { r.srs.due = addDays(date, INTERVALS[Math.min(r.srs.step, INTERVALS.length - 1)]); r.srs.step += 1 }
  else { r.srs.step = 0; r.srs.lapses += 1; r.srs.due = addDays(date, 1) }
  r.lastReview = date
  return r
}

export function dueReviews(sd, date) {
  return LESSONS.map((l) => ({ id: l.id, due: rec(sd, l.id).srs?.due })).filter((x) => x.due && x.due <= date).sort((a, b) => (a.due < b.due ? -1 : 1))
}

/** Questions for a short revision of lesson `id`: previously missed ones first, then others. */
export function reviewQuestions(sd, id, n = 3) {
  const l = BY_ID[id]
  const r = rec(sd, id)
  const missed = new Set(r.quizzes.flatMap((q) => q.wrong || []))
  const idx = l.quiz.map((_, i) => i).sort((a, b) => Number(missed.has(b)) - Number(missed.has(a)) || a - b)
  return idx.slice(0, n).map((i) => ({ i, ...l.quiz[i] }))
}

/** Curriculum position: the lesson to learn next (continue a started one, else the next ready one in order). */
export function nextLesson(sd) {
  const started = LESSONS.find((l) => { const r = rec(sd, l.id); return levelsPassed(r) > 0 && !quizPassed(r) })
  if (started) return started
  const fresh = LESSONS.find((l) => {
    const r = rec(sd, l.id)
    return !quizPassed(r) && levelsPassed(r) === 0 && prereqsMet(sd, l.id)
  })
  return fresh || null
}

export const LAB_FOR = {
  'load-balancing': 'lb', caching: 'cache', 'replication-sharding': 'replication', queues: 'queue', 'rate-limiting': 'ratelimit', estimation: 'estimate', scaling: 'playground', cdn: 'cache', 'why-slow': 'playground',
}

/** The fixed plan for one day, following the 60-minute structure. Stored once so it does not shift mid-day. */
export function makeSdPlan(sd, date) {
  const due = dueReviews(sd, date)
  const learn = nextLesson(sd)
  return { revise: due[0]?.id || null, learn: learn?.id || null, demo: learn ? (LAB_FOR[learn.id] || null) : null, made: date }
}
export const BLOCKS = [
  { id: 'revise', label: 'Revise yesterday', minutes: 5 },
  { id: 'learn', label: 'Learn a new concept', minutes: 20 },
  { id: 'demo', label: 'See it work', minutes: 15 },
  { id: 'quiz', label: 'Quiz and problem solving', minutes: 15 },
  { id: 'notes', label: 'Summary and notes', minutes: 5 },
]

/** A block counts as done only when something was actually answered or written today. */
export function blockDone(sd, date, id) {
  const p = sd.plan?.[date]
  if (!p) return false
  return !!p.done?.[id]
}
/** Blocks that apply today: the revision block only exists when something is actually due. */
export const blocksFor = (plan) => BLOCKS.filter((b) => !(b.id === 'revise' && !plan?.revise))

/** Days with at least one verified learning action. */
export const activeDays = (sd) => [...new Set(sd.days)].sort()

export function streakInfo(sd, date) {
  const days = new Set(activeDays(sd))
  // today not done yet does not break the streak: count back from today or yesterday
  let d = days.has(date) ? date : addDays(date, -1)
  let streak = 0
  while (days.has(d)) { streak += 1; d = addDays(d, -1) }
  let longest = 0, run = 0, prev = null
  for (const x of activeDays(sd)) { run = prev && daysBetween(prev, x) === 1 ? run + 1 : 1; longest = Math.max(longest, run); prev = x }
  const last = activeDays(sd).slice(-1)[0] || null
  const gap = last ? daysBetween(last, date) : null
  return { streak, longest, total: days.size, last, gap }
}

export function weekInfo(sd, date) {
  const d = parse(date)
  const monday = toISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)))
  const days = activeDays(sd).filter((x) => x >= monday && x <= addDays(monday, 6))
  return { monday, count: days.length, goal: WEEK_GOAL, days }
}

export function stageProgress(sd, date) {
  return STAGES.map((s) => {
    const ls = LESSONS.filter((l) => l.stage === s.id)
    const ms = ls.map((l) => mastery(sd, l.id, date))
    const understood = ls.filter((l) => quizPassed(rec(sd, l.id))).length
    const total = ls.length
    return { ...s, lessons: ls, total: s.id === 6 ? PROBLEMS.length : total, understood: s.id === 6 ? PROBLEMS.filter((p) => sd.probs?.[p.id]?.done).length : understood, mastered: ms.filter((m) => m.id >= 3).length, ready: ms.filter((m) => m.id === 5).length, assessed: sd.asmt?.[s.id] || null }
  })
}

const TIER_W = { must: 1, should: 0.6, advanced: 0.4, optional: 0.2 }
/** Interview readiness: weighted average of mastery over the curriculum, plus any mock-interview evidence. */
export function readiness(sd, date) {
  let got = 0, max = 0
  for (const l of LESSONS) { const w = TIER_W[l.tier]; max += w * 5; got += w * mastery(sd, l.id, date).id }
  const lessons = max ? got / max : 0
  const mocks = sd.mocks || []
  const recent = mocks.slice(-3)
  const mock = recent.length ? recent.reduce((a, m) => a + m.pct, 0) / recent.length / 100 : null
  const pct = mock === null ? lessons : lessons * 0.7 + mock * 0.3
  return { pct: Math.round(pct * 100), lessons: Math.round(lessons * 100), mock: mock === null ? null : Math.round(mock * 100), mocks: mocks.length }
}

/** Weak topics: needs-revision lessons with the prerequisites most likely to be the real cause. */
export function weakTopics(sd, date) {
  return LESSONS.map((l) => {
    const m = mastery(sd, l.id, date)
    const r = rec(sd, l.id)
    const wrongCount = r.quizzes.reduce((a, q) => a + (q.wrong?.length || 0), 0)
    const weakPre = allPrereqs(l.id).filter((p) => { const pm = mastery(sd, p, date); return rec(sd, p).quizzes.length && pm.id < 3 }).slice(0, 3)
    return { id: l.id, m, wrongCount, lapses: r.srs?.lapses || 0, weakPre }
  }).filter((x) => x.m.id === 2 || x.lapses >= 2).sort((a, b) => b.lapses - a.lapses || b.wrongCount - a.wrongCount)
}

// ---------- free-text answers: keyword suggestions the learner can correct ----------
const norm = (s) => ` ${(s || '').toLowerCase().replace(/[^a-z0-9+#%./ -]/g, ' ')} `
/** Which rubric points does the text seem to cover? (a suggestion; the learner confirms) */
export const suggestChecks = (text, points) => {
  const t = norm(text)
  // very short keywords ("ms", "ip", "dns") must match as whole words, not inside other words
  return points.map((p) => p.k.some((k) => { const w = k.toLowerCase(); return w.length <= 3 ? t.includes(` ${w} `) || t.includes(` ${w}.`) || t.includes(` ${w},`) : t.includes(w) }))
}
export const coverage = (checks) => (checks.length ? checks.filter(Boolean).length / checks.length : 0)

export function dimensionScores(checksByDim) {
  return Object.fromEntries(Object.entries(checksByDim).map(([d, c]) => [d, Math.round(coverage(c) * 100)]))
}
export const overallPct = (scores) => {
  const v = Object.values(scores)
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0
}

// ---------- search ----------
const lessonText = (l) => [l.title, l.hook.story, ...l.levels.flatMap((v) => [...v.body, ...(v.steps || []), ...(v.body2 || [])]), l.connects, ...Object.values(l.sections).flat(), ...l.summary.key].join(' \n ')
const INDEX = LESSONS.map((l) => ({ id: l.id, title: l.title.toLowerCase(), text: lessonText(l).toLowerCase(), raw: lessonText(l) }))
const STOP = new Set('the a an of to in is are and or for how what why when do does it on with from that this can i my me you your about'.split(' '))
export const tokens = (q) => q.toLowerCase().split(/[^a-z0-9+#]+/).filter((t) => t.length > 1 && !STOP.has(t))

export function searchLessons(q, { stage = 0, tier = '' } = {}) {
  const t = tokens(q)
  if (!t.length) return []
  return INDEX.map((d) => {
    let score = 0
    for (const w of t) {
      if (d.title.includes(w)) score += 6
      const n = d.text.split(w).length - 1
      score += Math.min(n, 5)
    }
    const l = BY_ID[d.id]
    return { lesson: l, score, snippet: snippet(d.raw, t) }
  }).filter((x) => x.score > 0 && (!stage || x.lesson.stage === stage) && (!tier || x.lesson.tier === tier)).sort((a, b) => b.score - a.score)
}
function snippet(raw, t) {
  const sentences = raw.replace(/\*\*/g, '').split(/(?<=[.?!])\s+|\n/).map((s) => s.trim()).filter((s) => s.length > 30)
  let best = '', bs = 0
  for (const s of sentences) { const sc = t.filter((w) => s.toLowerCase().includes(w)).length; if (sc > bs) { bs = sc; best = s } }
  return best.length > 220 ? `${best.slice(0, 217)}…` : best
}

// ---------- mentor (local, grounded in the curriculum; no invented facts) ----------
/** Mentor reply built only from lesson content. Returns { text, sources:[lessonId], followUp? } */
export function mentorReply(question, { lessonId = null, sd, date } = {}) {
  const q = question.toLowerCase()
  const cur = lessonId ? BY_ID[lessonId] : null
  const hits = searchLessons(question)
  const target = (hits[0] && hits[0].score >= 6 ? hits[0].lesson : null) || cur
  const strip = (s) => s.replace(/\*\*/g, '').replace(/`/g, '')
  const intent =
    /(simpl|eli5|plain|easier|don'?t understand|confus)/.test(q) ? 'simple'
      : /(example|real[- ]world|scenario|production)/.test(q) ? 'example'
        : /(when (should|do)|when not|trade|versus| vs |disadvantage|downside)/.test(q) ? 'tradeoff'
          : /(hint|stuck|help me think)/.test(q) ? 'hint'
            : /(quiz|test me|question me|follow-?up|practice)/.test(q) ? 'quiz'
              : /(mock|interview me)/.test(q) ? 'mock'
                : /(why|how does|how do|what is|what are|explain)/.test(q) ? 'explain' : 'explain'
  if (!target) return { text: 'I can only answer from the lessons on this platform and I could not find that topic. Try the Search tab or ask about a concept such as caching, load balancing, replication or idempotency.', sources: [] }
  const L = target
  const src = [L.id]
  if (intent === 'simple') return { text: `Simpler version of "${L.title}":\n\n${L.levels[0].body.slice(0, 2).map(strip).join('\n\n')}\n\nIf this still feels fuzzy, the real gap is probably a prerequisite: ${L.prereq.map((p) => BY_ID[p].title).join('; ') || 'none, this is a starting point'}.`, sources: src, followUp: L.hook.ask }
  if (intent === 'example') return { text: `A concrete example from "${L.title}":\n\n${strip(L.levels[2].body[0])}\n\nIn production: ${strip(L.sections.real[0])}`, sources: src }
  if (intent === 'tradeoff') return { text: `Trade-offs for "${L.title}":\n\nUse it when: ${L.sections.when.map(strip).join(' ')}\nAvoid it when: ${L.sections.whenNot.map(strip).join(' ')}\nYou trade: ${L.sections.tradeoffs.map(strip).join(' ')}`, sources: src }
  if (intent === 'hint') { const used = (sd?.mentor || []).filter((m) => m.lessonId === L.id && m.hint).length; const h = L.challenge.hints[Math.min(used, L.challenge.hints.length - 1)]; return { text: `Hint ${Math.min(used + 1, L.challenge.hints.length)} for the "${L.title}" challenge: ${h}\n\nTry answering again before asking for the next hint.`, sources: src, hint: true } }
  if (intent === 'quiz') { const qs = L.quiz[Math.floor(((sd?.mentor || []).length) % L.quiz.length)]; return { text: `Follow-up question on "${L.title}":\n\n${qs.q}\n\n(Think first. When you are ready ask "reveal" or answer in the lesson quiz.)`, sources: src, reveal: `${qs.o[qs.a]}. ${qs.why}` } }
  if (intent === 'mock') return { text: `Let's practise "${L.title}" as an interview question:\n\n${L.interview.q}\n\nOpen Interview mode to write your answer and score it against the key points.`, sources: src, action: 'interview' }
  const m = hits[0]
  return { text: `${strip(L.levels[0].body[0])}\n\n${m?.snippet && !strip(L.levels[0].body[0]).includes(m.snippet.slice(0, 40)) ? `Related detail: ${m.snippet}\n\n` : ''}Why it matters: ${strip(L.connects)}`, sources: src, followUp: `Check yourself: ${L.interview.q}` }
}

export { interviewBank, TRADEOFF_QS }

// ---------- dependency map ----------
export function mapLayout() {
  const col = {}
  const pos = {}
  const W = 190, H = 64, GX = 70, GY = 28
  for (const l of LESSONS) {
    col[l.stage] = (col[l.stage] || 0)
    pos[l.id] = { x: (l.stage - 1) * (W + GX), y: col[l.stage] * (H + GY), w: W, h: H }
    col[l.stage] += 1
  }
  const edges = LESSONS.flatMap((l) => l.prereq.map((p) => [p, l.id]))
  const width = STAGES.slice(0, 5).length * (W + GX) - GX
  const height = Math.max(...Object.values(col)) * (H + GY)
  return { pos, edges, width, height }
}
