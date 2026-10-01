import { describe, expect, it } from 'vitest'
import { emptyState } from './model.js'
import { monthGrid, dayInfo, markers } from './calendar.js'

const fresh = () => { const s = emptyState(); s.profile.startDate = '2026-10-01'; return s }

describe('calendar', () => {
  it('builds a 6-week grid that starts on a Monday and contains the whole month', () => {
    const g = monthGrid(2026, 9) // October 2026 (1 Oct is a Thursday)
    expect(g).toHaveLength(42)
    expect(g[0]).toBe('2026-09-28')
    expect(new Date(g[0] + 'T00:00:00').getDay()).toBe(1)
    expect(g).toContain('2026-10-01'); expect(g).toContain('2026-10-31')
  })
  it('handles a month that starts on a Monday and on a Sunday', () => {
    expect(monthGrid(2026, 5)[0]).toBe('2026-06-01') // 1 Jun 2026 is a Monday
    expect(monthGrid(2026, 1)[0]).toBe('2026-01-26') // 1 Feb 2026 is a Sunday
  })
  it('gathers activity, interviews, deadlines, events and day mode for a date', () => {
    const s = fresh()
    s.dsa['two-sum'] = { solved: true, lastDone: '2026-10-05' }
    s.lessons.git1 = '2026-10-05'
    s.companies.push({ id: 'c', name: 'Acme', interviewDate: '2026-10-05' })
    s.applications.push({ id: 'a', company: 'Beta', role: 'SDE', status: 'ready', deadline: '2026-10-05' }, { id: 'b', company: 'Done', role: 'x', status: 'rejected', deadline: '2026-10-05' })
    s.events.push({ id: 'e', date: '2026-10-05', text: 'College exam' })
    s.dayTypes['2026-10-06'] = 'rest'
    const i = dayInfo(s, '2026-10-05')
    expect(i.minutes).toBe(90)
    expect(i.solved).toEqual(['Two Sum'])
    expect(i.interviews).toHaveLength(1)
    expect(i.deadlines.map((a) => a.company)).toEqual(['Beta']) // closed applications are ignored
    expect(i.events[0].text).toBe('College exam')
    const m = markers(i)
    expect(m.interview && m.due && m.event).toBe(true)
    expect(markers(dayInfo(s, '2026-10-06')).rest).toBe(true)
    expect(markers(dayInfo(s, '2026-10-07')).study).toBe(0)
  })
  it('older saved data without events still works', () => {
    const s = fresh(); delete s.events; delete s.companies; delete s.mocks
    expect(() => dayInfo(s, '2026-10-05')).not.toThrow()
  })
})
