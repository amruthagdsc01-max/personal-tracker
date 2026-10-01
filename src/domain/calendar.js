import { addDays, parse, toISO } from './dates.js'
import { activityMinutes, modeOf } from './engine.js'
import { PROBLEM_BY_ID } from '../data/dsa.js'

/** 6 weeks × 7 days of ISO dates covering the month, weeks starting on Monday. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // Monday = 0
  const start = addDays(toISO(first), -offset)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export const monthLabel = (year, month) => new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

/** Everything the app knows about one date, gathered from the user's own records. */
export function dayInfo(state, date) {
  const dsa = Object.entries(state.dsa).filter(([, d]) => d.lastDone === date).map(([id]) => PROBLEM_BY_ID[id]?.title).filter(Boolean)
  const open = (a) => !['rejected', 'offer'].includes(a.status)
  return {
    date,
    minutes: activityMinutes(state, date),
    mode: modeOf(state, date),
    solved: dsa,
    lessons: Object.values(state.lessons).filter((d) => d === date).length,
    steps: Object.values(state.steps).filter((d) => d === date).length,
    aptitude: state.apt.log.filter((l) => l.date === date).length,
    speak: state.speak.filter((s) => s.date === date).length,
    posts: state.posts.filter((p) => p.date === date).length,
    mocks: (state.mocks || []).filter((m) => m.date === date),
    interviews: (state.companies || []).filter((c) => c.interviewDate === date),
    deadlines: state.applications.filter((a) => open(a) && a.deadline === date),
    followUps: state.applications.filter((a) => open(a) && a.followUp === date),
    events: (state.events || []).filter((e) => e.date === date),
  }
}

/** Compact markers for the month grid. */
export function markers(info) {
  return {
    study: info.minutes,
    rest: info.mode === 'rest',
    light: info.mode === 'light',
    interview: info.interviews.length > 0,
    due: info.deadlines.length + info.followUps.length > 0,
    event: info.events.length > 0,
    mock: info.mocks.length > 0,
  }
}

export const hasAnything = (info) => info.minutes > 0 || info.mocks.length || info.interviews.length || info.deadlines.length || info.followUps.length || info.events.length || info.mode !== 'full'
export { parse }
