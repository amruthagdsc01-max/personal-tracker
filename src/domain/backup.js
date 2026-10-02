import { daysBetween } from './dates.js'
import { dayNumber } from './engine.js'

/** Has the user done enough that losing their data would hurt? */
export function hasProgress(state) {
  const n = Object.keys(state.dsa).length + Object.keys(state.lessons).length + Object.keys(state.steps).length + state.apt.log.length + state.speak.length + (state.mocks || []).length + state.posts.length
  return n >= 5
}

/** Backups matter when data lives only in this browser. Remind after 14 days (or day 3 if never backed up). */
export function backupStatus(state, date) {
  const last = state.profile.lastBackup || null
  const daysSince = last ? daysBetween(last, date) : null
  const progress = hasProgress(state)
  const due = progress && (last ? daysSince >= 14 : dayNumber(state, date) >= 3)
  return { last, daysSince, due, progress }
}
