import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '../../store.jsx'
import { BY_ID } from '../../data/sd/index.js'
import { emptySd, sdOf, recordQuiz, recordReview, lessonRec, makeSdPlan, coverage, GOOD } from '../../domain/sd/engine.js'

/** Everything the System Design pages need: the persisted sd state plus actions that only record real evidence. */
export function useSd() {
  const { state, update, notify, date, auth } = useStore()
  const sd = useMemo(() => sdOf(state), [state.sd])

  const act = useCallback((fn) => update((s) => {
    s.sd = { ...emptySd(), ...(s.sd || {}) }
    fn(s.sd)
  }), [update])

  const stamp = (d) => { if (!d.days.includes(date)) d.days.push(date); if (!d.startDate) d.startDate = date }
  const mark = (d, block) => { const p = d.plan[date]; if (p) { p.done = p.done || {}; p.done[block] = true } }
  const ensure = (d, id) => { d.les[id] = d.les[id] ? d.les[id] : lessonRec(d, id); return d.les[id] }

  const actions = useMemo(() => ({
    onboard: (info) => act((d) => { d.onboarded = true; d.level = info.level; d.goal = info.goal; d.startDate = date }),
    ensurePlan: () => act((d) => { if (!d.plan[date]) d.plan[date] = { ...makeSdPlan(d, date), done: {} } }),
    passCheck: (id, level) => act((d) => {
      const r = ensure(d, id); r.checks = { ...r.checks, [level]: true }; stamp(d)
      const p = d.plan[date]
      if (p?.learn === id && r.checks[0] && r.checks[1]) mark(d, 'learn')
      if (p?.learn === id && level === 2 && !p.demo) mark(d, 'demo')
    }),
    submitQuiz: (id, picks) => {
      const l = BY_ID[id]
      const wrong = l.quiz.map((q, i) => (picks[i] === q.a ? null : i)).filter((x) => x !== null)
      const score = l.quiz.length - wrong.length
      act((d) => { d.les[id] = recordQuiz(d, id, score, l.quiz.length, wrong, date); stamp(d); if (d.plan[date]?.learn === id) mark(d, 'quiz') })
      return { score, total: l.quiz.length, wrong }
    },
    saveEvidence: (id, kind, checks, text) => act((d) => {
      const r = ensure(d, id); r[kind] = { date, cov: coverage(checks), text: (text || '').slice(0, 1500) }; stamp(d)
      if (kind === 'appl' && d.plan[date]?.learn === id) mark(d, 'quiz')
    }),
    saveNote: (id, text) => act((d) => { if (text.trim()) d.notes[id] = text; else delete d.notes[id]; if (text.trim().length >= 20) { stamp(d); if (d.plan[date]?.learn === id) mark(d, 'notes') } }),
    toggleBookmark: (id) => act((d) => { d.bm = d.bm.includes(id) ? d.bm.filter((x) => x !== id) : [...d.bm, id] }),
    finishReview: (id, correct, total) => act((d) => { d.les[id] = recordReview(d, id, correct, total, date); stamp(d); mark(d, 'revise') }),
    labUsed: (labId) => act((d) => { if (d.labs[labId] !== date) { d.labs[labId] = date; stamp(d) } if (d.plan[date]?.demo === labId) mark(d, 'demo') }),
    problemStep: (pid, i, choice) => act((d) => { d.probs[pid] = { ...(d.probs[pid] || { steps: {} }), steps: { ...(d.probs[pid]?.steps || {}), [i]: choice } } }),
    problemDone: (pid, score) => act((d) => { d.probs[pid] = { ...(d.probs[pid] || { steps: {} }), done: date, score }; stamp(d) }),
    saveMock: (entry) => act((d) => { d.mocks = [...d.mocks, { date, ...entry }].slice(-40); stamp(d) }),
    saveAssessment: (stage, entry) => act((d) => { d.asmt[stage] = { date, ...entry }; stamp(d) }),
    saveBank: (qid, cov, text) => act((d) => { d.iq[qid] = { date, cov, text: (text || '').slice(0, 1500) }; stamp(d) }),
    logMentor: (m) => act((d) => { d.mentor = [...d.mentor, m].slice(-60) }),
    reset: () => act((d) => { Object.assign(d, emptySd()) }),
  }), [act, date])

  return { sd, date, notify, token: auth?.token, ...actions, GOOD }
}

/** Hash-based sub-routing: #/design/<view>/<arg> */
export function useRoute() {
  const read = () => { const p = window.location.hash.replace(/^#\/?/, '').split('/'); return { view: p[1] || 'today', arg: p[2] ? decodeURIComponent(p[2]) : null, sub: p[3] || null } }
  const [r, setR] = useState(read)
  useEffect(() => { const h = () => setR(read()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h) }, [])
  return r
}
export function sdGo(path) {
  const apply = () => { window.location.hash = `/design/${path}`; window.scrollTo({ top: 0 }) }
  if (document.startViewTransition) document.startViewTransition(apply); else apply()
}
