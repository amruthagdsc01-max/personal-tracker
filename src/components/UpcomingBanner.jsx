import { CalendarClock, ArrowRight } from 'lucide-react'
import { useStore } from '../store.jsx'
import { companyProgress, daysToInterview } from '../domain/prep.js'

/** Shows the nearest interview within two weeks, so preparation is never a surprise. */
export default function UpcomingBanner({ go }) {
  const { state, date } = useStore()
  const soon = (state.companies || [])
    .map((c) => ({ c, d: daysToInterview(c, date) }))
    .filter((x) => x.d !== null && x.d >= 0 && x.d <= 14)
    .sort((a, b) => a.d - b.d)[0]
  if (!soon) return null
  const p = companyProgress(soon.c, state)
  return (
    <button className="upcoming" onClick={() => { try { sessionStorage.setItem('ezze/careerTab', 'prep') } catch { /* ignore */ } go('career') }}>
      <CalendarClock size={22} />
      <span><b>{soon.c.name} — {soon.d === 0 ? 'today' : soon.d === 1 ? 'tomorrow' : `in ${soon.d} days`}</b><small>{p.pct}% ready · {p.done} of {p.total} items{p.next ? ` · next: ${p.next.text}` : ''}</small></span>
      <ArrowRight size={18} />
    </button>
  )
}
