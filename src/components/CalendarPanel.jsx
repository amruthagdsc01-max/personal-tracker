import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Trash2, Star, Flag, Plus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { DAY_MODES } from '../domain/model.js'
import { monthGrid, monthLabel, dayInfo, markers } from '../domain/calendar.js'
import { parse, fmt, weekday, toISO } from '../domain/dates.js'
import { uid } from '../domain/engine.js'

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const level = (m) => (m >= 240 ? 4 : m >= 150 ? 3 : m >= 75 ? 2 : m > 0 ? 1 : 0)

/** Small month calendar opened from the top bar. */
export default function CalendarPanel({ onClose, go }) {
  const { state, date: today, update, setMode } = useStore()
  const t = parse(today)
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() })
  const [sel, setSel] = useState(today)
  const [text, setText] = useState('')
  const cells = monthGrid(ym.y, ym.m)
  const info = dayInfo(state, sel)

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const shift = (n) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const jumpToday = () => { setYm({ y: t.getFullYear(), m: t.getMonth() }); setSel(today) }
  const addEvent = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    update((s) => { s.events = [...(s.events || []), { id: uid(), date: sel, text: text.trim() }] })
    setText('')
  }
  const open = (page) => { onClose(); go(page) }

  const nothing = !info.minutes && !info.mocks.length && !info.interviews.length && !info.deadlines.length && !info.followUps.length && !info.events.length

  return (
    <div className="modal-back cal-back" onMouseDown={onClose}>
      <div className="cal-panel" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Calendar">
        <div className="cal-head">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={20} /></button>
          <h2>{monthLabel(ym.y, ym.m)}</h2>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={20} /></button>
          <button className="btn ghost sm" onClick={jumpToday}>Today</button>
          <button className="icon-btn" onClick={onClose} aria-label="Close calendar"><X size={20} /></button>
        </div>

        <div className="cal-grid" role="grid">
          {WEEK.map((w) => <div key={w} className="cal-dow">{w}</div>)}
          {cells.map((d) => {
            const i = dayInfo(state, d)
            const mk = markers(i)
            const inMonth = parse(d).getMonth() === ym.m
            return (
              <button key={d} role="gridcell" aria-label={`${fmt(d, { day: 'numeric', month: 'long' })}`} className={`cal-day l${level(mk.study)} ${inMonth ? '' : 'out'} ${d === today ? 'today' : ''} ${d === sel ? 'sel' : ''} ${mk.rest ? 'rest' : ''}`} onClick={() => setSel(d)}>
                <span className="num">{parse(d).getDate()}</span>
                <span className="dots">
                  {mk.interview && <i className="d interview" title="Interview" />}
                  {mk.due && <i className="d due" title="Deadline or follow-up" />}
                  {mk.mock && <i className="d mock" title="Mock" />}
                  {mk.event && <i className="d event" title="Event" />}
                  {mk.light && <i className="d light" title="Light day" />}
                </span>
              </button>
            )
          })}
        </div>
        <div className="cal-legend"><span><i className="d interview" /> interview</span><span><i className="d due" /> deadline / follow-up</span><span><i className="d mock" /> mock</span><span><i className="d event" /> your event</span><span><i className="sw" /> study (darker = more)</span></div>

        <div className="cal-detail">
          <div className="row-between"><h3>{weekday(sel)}, {fmt(sel, { day: 'numeric', month: 'long' })}{sel === today ? ' · today' : ''}</h3></div>

          <div className="daytype" role="group" aria-label="Day type">
            {Object.entries(DAY_MODES).map(([k, v]) => <button key={k} className={`chip ${info.mode === k ? 'active' : ''}`} onClick={() => setMode(sel, k)}>{v.label}</button>)}
          </div>
          {sel < today && info.mode === 'rest' && <small className="muted">Planned rest days never break your streak.</small>}

          {info.interviews.map((c) => <p key={c.id} className="cal-line"><Star size={15} /> <b>Interview: {c.name}</b>{c.role ? ` — ${c.role}` : ''} <button className="link" onClick={() => { try { sessionStorage.setItem('ezze/careerTab', 'prep') } catch { /* ignore */ } open('career') }}>Open prep</button></p>)}
          {info.deadlines.map((a) => <p key={a.id} className="cal-line"><Flag size={15} /> Application deadline: <b>{a.company}</b> — {a.role}</p>)}
          {info.followUps.map((a) => <p key={a.id} className="cal-line"><Flag size={15} /> Follow up with <b>{a.company}</b></p>)}
          {info.mocks.map((m, i) => <p key={i} className="cal-line">Mock: <b>{m.name}</b> — {m.overall}%{m.mode === 'full' ? ' (full-length)' : ''}</p>)}

          {info.minutes > 0 && (
            <p className="cal-line study">
              <b>{(info.minutes / 60).toFixed(1)}h studied</b>
              {info.solved.length > 0 && <> · {info.solved.length} DSA problem{info.solved.length > 1 ? 's' : ''}</>}
              {info.lessons > 0 && <> · {info.lessons} lesson{info.lessons > 1 ? 's' : ''}</>}
              {info.steps > 0 && <> · {info.steps} build step{info.steps > 1 ? 's' : ''}</>}
              {info.aptitude > 0 && <> · aptitude</>}{info.speak > 0 && <> · speaking</>}{info.posts > 0 && <> · LinkedIn post</>}
            </p>
          )}
          {nothing && info.mode === 'full' && <p className="muted">{sel > today ? 'Nothing planned yet. Add an event below, or mark this a rest or light day.' : sel === today ? 'Nothing recorded yet today.' : 'Nothing recorded.'}</p>}

          {info.events.map((e) => (
            <p key={e.id} className="cal-line event"><span>{e.text}</span><button className="icon-btn" aria-label="Delete event" onClick={() => update((s) => { s.events = s.events.filter((x) => x.id !== e.id) })}><Trash2 size={15} /></button></p>
          ))}
          <form className="cal-add" onSubmit={addEvent}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an event or reminder for this day…" aria-label="New event" />
            <button className="btn ghost sm" aria-label="Add event"><Plus size={16} /></button>
          </form>
          {sel === today && <button className="btn primary sm" onClick={() => open('today')}>Open today’s plan</button>}
        </div>
      </div>
    </div>
  )
}

export { toISO }
