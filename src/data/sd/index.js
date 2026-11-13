import { STAGE1 } from './stage1.js'
import { STAGE2 } from './stage2.js'
import { STAGE3 } from './stage3.js'
import { STAGE4 } from './stage4.js'
import { STAGE5 } from './stage5.js'

export { STAGES, TIERS, MASTERY } from './stages.js'

const h = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) } return x >>> 0 }
import { PROBLEMS as RAW_PROBLEMS } from './problems.js'
export { RUBRIC_DIMS, DIM_LESSONS } from './problems.js'
export const PROBLEMS = RAW_PROBLEMS.map((p) => ({ ...p, steps: p.steps.map((st) => ({ ...st, opts: [...st.opts].sort((a, b) => h(`${st.q}|${a.t}`) - h(`${st.q}|${b.t}`)) })) }))
export { ASSESSMENTS, ASSESS_CRITERIA } from './assessments.js'
export { TRADEOFF_QS, CASES, LIBRARY } from './extras.js'

// Authors tend to put the right answer in the same slot. Reorder every option list once, deterministically
// (seeded by the question text) so the position of the answer carries no information.
function mix(item) {
  const order = item.o.map((_, i) => i).sort((a, b) => h(`${item.q}|${a}`) - h(`${item.q}|${b}`))
  return { ...item, o: order.map((i) => item.o[i]), a: order.indexOf(item.a) }
}
const mixLesson = (l) => ({ ...l, levels: l.levels.map((v) => ({ ...v, check: mix(v.check) })), quiz: l.quiz.map(mix) })
export const LESSONS = [...STAGE1, ...STAGE2, ...STAGE3, ...STAGE4, ...STAGE5].map(mixLesson)
export const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]))
export const LEVEL_NAMES = ['Understand', 'Explore', 'Apply', 'Master']

/** All lessons that must be understood before `id` (transitive, nearest first). */
export function allPrereqs(id, seen = new Set()) {
  for (const p of BY_ID[id]?.prereq || []) {
    if (!seen.has(p)) { seen.add(p); allPrereqs(p, seen) }
  }
  return [...seen]
}
/** Lessons that depend directly on `id`. */
export const dependents = (id) => LESSONS.filter((l) => l.prereq.includes(id)).map((l) => l.id)

/** One flat list of every interview question: lesson questions + trade-off questions. */
export function interviewBank(extra) {
  const fromLessons = LESSONS.map((l) => ({ id: `iq-${l.id}`, level: l.tier === 'advanced' ? 'Advanced' : l.stage <= 2 ? 'Beginner' : 'Intermediate', topic: l.id, lessonId: l.id, q: l.interview.q, model: l.interview.model, points: l.interview.points }))
  return [...fromLessons, ...extra.map((q) => ({ ...q, lessonId: q.topic in BY_ID ? q.topic : null }))]
}
