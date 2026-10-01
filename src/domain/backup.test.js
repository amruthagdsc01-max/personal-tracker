import { describe, expect, it } from 'vitest'
import { emptyState } from './model.js'
import { backupStatus, hasProgress } from './backup.js'

const fresh = () => { const s = emptyState(); s.profile.startDate = '2026-10-01'; return s }
const withProgress = (s) => { ['a', 'b', 'c', 'd', 'e'].forEach((k) => { s.dsa[k] = { solved: true } }); return s }

describe('backup reminders', () => {
  it('stay quiet when there is nothing worth losing', () => {
    expect(hasProgress(fresh())).toBe(false)
    expect(backupStatus(fresh(), '2026-12-01').due).toBe(false)
  })
  it('ask for a first backup from day 3 once progress exists', () => {
    const s = withProgress(fresh())
    expect(backupStatus(s, '2026-10-02').due).toBe(false)
    expect(backupStatus(s, '2026-10-03').due).toBe(true)
  })
  it('then ask again after 14 days', () => {
    const s = withProgress(fresh())
    s.profile.lastBackup = '2026-10-10'
    expect(backupStatus(s, '2026-10-23').due).toBe(false)
    const st = backupStatus(s, '2026-10-24')
    expect(st.due).toBe(true)
    expect(st.daysSince).toBe(14)
  })
})
