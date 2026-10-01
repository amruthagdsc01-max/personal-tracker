import { ALL_PROBLEMS, DSA_TOPICS, PROBLEM_BY_ID } from '../data/dsa.js'
import { APTITUDE, APT_TOPICS } from '../data/practice.js'
import { CS_QUESTIONS, CS_TOPICS } from '../data/cs.js'
import { QA, QA_CATS } from '../data/interviewQA.js'
import { currentTopic } from './engine.js'

/* ---------- randomness (seedable so tests are deterministic) ---------- */
export function rng(seed = Date.now()) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const shuffle = (arr, r) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

/** Take items spread evenly across groups (so a 20-question round isn't all one topic). */
function spread(pool, groupOf, count, r) {
  const groups = {}
  shuffle(pool, r).forEach((x) => (groups[groupOf(x)] ||= []).push(x))
  const keys = shuffle(Object.keys(groups), r)
  const out = []
  while (out.length < count && keys.some((k) => groups[k].length)) keys.forEach((k) => { if (out.length < count && groups[k].length) out.push(groups[k].shift()) })
  return out
}

/* ---------- building a session ---------- */
export function pickProblems(state, diffs, r) {
  const core = DSA_TOPICS.filter((t) => !t.side)
  const cur = Math.max(0, core.findIndex((t) => t.id === currentTopic(state)?.id))
  const reachable = new Set(core.slice(0, cur + 3).map((t) => t.id))
  const used = new Set()
  return diffs.map((d) => {
    const tiers = [
      ALL_PROBLEMS.filter((p) => p.diff === d && reachable.has(p.topicId) && !state.dsa[p.id]?.solved),
      ALL_PROBLEMS.filter((p) => p.diff === d && !state.dsa[p.id]?.solved),
      ALL_PROBLEMS.filter((p) => p.diff === d),
    ]
    const pool = tiers.map((t) => t.filter((p) => !used.has(p.id))).find((t) => t.length) || []
    const pick = shuffle(pool, r)[0]
    if (pick) used.add(pick.id)
    return pick?.id
  }).filter(Boolean)
}

export function buildMock(set, state, r = rng()) {
  const rounds = set.rounds.map((rd) => {
    if (rd.type === 'mcq') {
      const bank = rd.bank === 'apt' ? APTITUDE : CS_QUESTIONS
      const pool = bank.filter((q) => rd.topics.includes(q.topic))
      const picked = spread(pool, (q) => q.topic, Math.min(rd.count, pool.length), r)
      const items = picked.map((q) => {
        const order = shuffle(q.options.map((_, i) => i), r)
        return { id: q.id, bank: rd.bank, topic: q.topic, q: q.q, why: q.why, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
      })
      return { ...rd, items }
    }
    if (rd.type === 'coding') return { ...rd, items: pickProblems(state, rd.diffs, r) }
    const pool = QA.filter((q) => rd.cats.includes(q.cat))
    return { ...rd, items: spread(pool, (q) => q.cat, Math.min(rd.count, pool.length), r).map((q) => q.id) }
  })
  return { setId: set.id, name: set.name, rounds }
}

/* ---------- scoring (each returns a round result with score 0–100) ---------- */
/** Illustrative pass marks per round type — real cut-offs differ by company and year. */
export const CUTOFF = { mcq: 60, coding: 50, qa: 55 }
const finish = (round, res, meta, attempted) => {
  const cut = round.cut ?? CUTOFF[round.type]
  return { ...res, cut, passed: res.score >= cut, attempted, allowed: round.minutes * 60, timeUsed: meta?.timeUsed ?? null }
}

export function scoreMcq(round, answers, meta) {
  const byTopic = {}
  const wrong = []
  let correct = 0
  round.items.forEach((q, i) => {
    const t = (byTopic[q.topic] ||= [0, 0])
    t[1]++
    if (answers[i] === q.answer) { correct++; t[0]++ } else wrong.push({ q: q.q, picked: answers[i] === undefined ? null : q.options[answers[i]], answer: q.options[q.answer], why: q.why, topic: q.topic })
  })
  return finish(round, { type: 'mcq', label: round.label, score: round.items.length ? Math.round((correct / round.items.length) * 100) : 0, correct, total: round.items.length, byTopic, wrong }, meta, Object.keys(answers).length)
}

export function scoreCoding(round, results, meta) {
  const items = round.items.map((id, i) => ({ id, title: PROBLEM_BY_ID[id]?.title, diff: PROBLEM_BY_ID[id]?.diff, topic: PROBLEM_BY_ID[id]?.topic, status: results[i]?.status || 'none', minutes: results[i]?.minutes || 0 }))
  const pts = items.reduce((s, x) => s + (x.status === 'solved' ? 1 : x.status === 'partial' ? 0.5 : 0), 0)
  return finish(round, { type: 'coding', label: round.label, score: items.length ? Math.round((pts / items.length) * 100) : 0, solved: items.filter((x) => x.status === 'solved').length, total: items.length, items }, meta, items.filter((x) => x.status !== 'none').length)
}

/** Content coverage counts for 60%, self-rated clarity/structure for 40%. */
export function scoreQa(round, results, meta) {
  const byTopic = {}
  const items = round.items.map((id, i) => {
    const q = QA.find((x) => x.id === id)
    const covered = results[i]?.covered?.length || 0
    const rating = results[i]?.rating || 0
    const t = (byTopic[q.cat] ||= [0, 0])
    t[0] += covered; t[1] += q.points.length
    return { id, cat: q.cat, q: q.q, covered, total: q.points.length, rating, missed: q.points.filter((_, k) => !results[i]?.covered?.includes(k)) }
  })
  const per = items.map((x) => 0.6 * (x.covered / x.total) + 0.4 * (x.rating / 5))
  const score = per.length ? Math.round((per.reduce((a, b) => a + b, 0) / per.length) * 100) : 0
  return finish(round, { type: 'qa', label: round.label, score, items, byTopic }, meta, results.filter((r) => r && !r.skipped).length)
}

/* ---------- summary & advice ---------- */
const ADVICE = {
  oop: ['Revisit OOP: write one small example for each pillar and explain it aloud.', 'practice'],
  dbms: ['Strengthen DBMS and SQL: work through the SQL lessons in Learn.', 'learn'],
  sql: ['Practise SQL daily: the SQL side track on the DSA page and the SQL lessons.', 'learn'],
  os: ['Review OS basics (processes, threads, deadlock, memory) and explain each aloud.', 'practice'],
  cn: ['Review networking: be able to narrate “what happens when I open a URL”.', 'practice'],
  python: ['Brush up Python internals: mutability, generators, decorators, the GIL.', 'practice'],
  api: ['Revisit REST and HTTP status codes in the FastAPI track.', 'learn'],
  dsa: ['Review complexity analysis and core data structures.', 'dsa'],
  ai: ['Strengthen AI engineering: the LLM & RAG track, especially evaluation.', 'learn'],
  design: ['Practise system design: the System Design track and the URL shortener project.', 'learn'],
  project: ['Rehearse your project story: problem, design, trade-offs, result, improvements.', 'build'],
  hr: ['Rehearse behavioural answers with STAR in the Speak block.', 'practice'],
  quant: ['Aptitude (quantitative) needs work: Practice → Aptitude.', 'practice'],
  logical: ['Logical reasoning needs work: Practice → Aptitude.', 'practice'],
  verbal: ['Verbal needs work: Practice → Aptitude.', 'practice'],
  coding: ['Coding under time pressure is the gap: do the DSA sheet daily and revise flagged problems.', 'dsa'],
}
export const topicLabel = (k) => CS_TOPICS[k] || APT_TOPICS[k] || QA_CATS[k] || k

export function summarise(rounds) {
  const overall = rounds.length ? Math.round(rounds.reduce((s, r) => s + r.score, 0) / rounds.length) : 0
  const topics = {}
  rounds.forEach((r) => {
    if (r.type === 'mcq') Object.entries(r.byTopic).forEach(([t, [c, n]]) => { const a = (topics[t] ||= [0, 0]); a[0] += c; a[1] += n })
    if (r.type === 'qa') Object.entries(r.byTopic).forEach(([t, [c, n]]) => { const a = (topics[t] ||= [0, 0]); a[0] += c; a[1] += n })
  })
  const weak = Object.entries(topics).filter(([, [c, n]]) => n >= 2 && c / n < 0.6).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).slice(0, 3).map(([t]) => t)
  const coding = rounds.filter((r) => r.type === 'coding')
  if (coding.length && coding.every((r) => r.score < 60)) weak.push('coding')
  const advice = weak.map((t) => ({ topic: t, text: ADVICE[t]?.[0] || `Review ${topicLabel(t)}.`, to: ADVICE[t]?.[1] || 'practice' }))
  const best = [...rounds].sort((a, b) => b.score - a.score)[0]
  const worst = [...rounds].sort((a, b) => a.score - b.score)[0]
  const verdict = overall >= 75 ? 'Strong performance. Keep the pressure realistic and repeat a harder set.'
    : overall >= 55 ? 'Solid base with clear gaps. Fix the weak areas below, then retake a similar set in a week.'
      : 'Early days for this format — that is exactly what a mock is for. Work the areas below, then try again.'
  return { overall, topics, weak, advice, verdict, best: best?.label, worst: worst?.label }
}

/* ---------- full-length scorecard helpers ---------- */
export function bandFor(overall, clearedAll) {
  if (overall >= 75 && clearedAll) return { label: 'Interview-ready for this style', tone: 'good' }
  if (overall >= 60) return { label: 'Close — a few gaps to fix', tone: 'ok' }
  if (overall >= 45) return { label: 'Building — keep practising', tone: 'warn' }
  return { label: 'Early stage — this is what mocks are for', tone: 'low' }
}

export const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${String(sec % 60).padStart(2, '0')}s`
}

/** One honest sentence about how the time was used in a round. */
export function timeNote(r) {
  if (r.timeUsed == null || !r.allowed) return ''
  const ratio = r.timeUsed / r.allowed
  const spare = Math.max(0, Math.round((r.allowed - r.timeUsed) / 60))
  const unanswered = (r.type === 'mcq' ? r.total : r.type === 'coding' ? r.total : r.items?.length || 0) - r.attempted
  if (ratio >= 0.97 && unanswered > 0) return `Time ran out with ${unanswered} unattempted — practise pacing: skip a hard one and return.`
  if (ratio >= 0.97) return 'Used the full time.'
  if (ratio < 0.5 && r.score < r.cut) return 'Finished very early but below the pass mark — slow down and re-check answers.'
  return `Finished with about ${spare} min to spare.`
}

export function compareWithPrevious(mocks, setId, mode, overall, rounds) {
  const prev = [...mocks].reverse().find((m) => m.setId === setId && (m.mode || 'practice') === mode)
  if (!prev) return null
  const roundDeltas = rounds.map((r) => { const p = prev.rounds.find((x) => x.label === r.label); return p ? r.score - p.score : null })
  return { prev, delta: overall - prev.overall, roundDeltas }
}

export function scorecardText({ name, mode, date, overall, band, rounds, totalUsed, totalAllowed, focusLost, weak }) {
  const lines = [
    `ezze mock scorecard — ${name} (${mode === 'full' ? 'full-length exam' : 'practice'})`,
    `Date: ${date} · Overall: ${overall}% · ${band.label}`,
    ...rounds.map((r) => `• ${r.label}: ${r.score}% (pass mark ${r.cut}% — ${r.passed ? 'cleared' : 'below'})`),
    totalUsed != null ? `Time: ${fmtDuration(totalUsed)} of ${fmtDuration(totalAllowed)}` : '',
    mode === 'full' ? `Left the tab: ${focusLost} time${focusLost === 1 ? '' : 's'}` : '',
    weak.length ? `Work on: ${weak.join(', ')}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}
