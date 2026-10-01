import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Check, RotateCcw, Play, Pause, Bookmark, SkipForward, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PROBLEM_BY_ID, problemUrl } from '../data/dsa.js'
import { APT_BY_ID, APT_TOPICS, SPEAK_PROMPTS, SPEAK_TECHNIQUES } from '../data/practice.js'
import { daysBetween } from '../domain/dates.js'

export const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' }

export function FocusTimer({ minutes }) {
  const [left, setLeft] = useState(minutes * 60)
  const [run, setRun] = useState(false)
  const { notify } = useStore()
  useEffect(() => {
    if (!run) return
    const t = setInterval(() => setLeft((l) => { if (l <= 1) { setRun(false); notify('Time is up — wrap up and mark it done.'); return 0 } return l - 1 }), 1000)
    return () => clearInterval(t)
  }, [run, notify])
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  return (
    <div className="timer">
      <b>{mm}:{ss}</b>
      <button className="icon-btn" onClick={() => setRun(!run)} aria-label={run ? 'Pause' : 'Start'}>{run ? <Pause size={18} /> : <Play size={18} />}</button>
      <button className="icon-btn" onClick={() => { setRun(false); setLeft(minutes * 60) }} aria-label="Reset"><RotateCcw size={16} /></button>
    </div>
  )
}

/** One DSA problem row used on both the Today plan and the DSA sheet. */
export function ProblemRow({ id, compact = false, date }) {
  const { state, solve, unsolve, skipProblem, toggleRevisit, reviewed, setNote } = useStore()
  const p = PROBLEM_BY_ID[id]
  const d = state.dsa[id] || {}
  const due = d.solved && d.revisit && date && daysBetween(d.date, date) >= 3
  const [note, setLocalNote] = useState(d.note || '')
  const [open, setOpen] = useState(false)
  return (
    <div className={`problem ${d.solved ? 'solved' : ''}`}>
      <button className={`check ${d.solved ? 'on' : ''}`} onClick={() => (d.solved ? unsolve(id) : solve(id))} aria-label={d.solved ? 'Mark unsolved' : 'Mark solved'}>{d.solved && <Check size={16} strokeWidth={3} />}</button>
      <div className="problem-main">
        <a href={problemUrl(id)} target="_blank" rel="noreferrer">{p.title} <ExternalLink size={14} /></a>
        <span className={`diff ${p.diff}`}>{DIFF[p.diff]}</span>
        {due && <span className="chip solid">Revision due</span>}
        {!compact && d.note && !open && <small className="muted">{d.note}</small>}
      </div>
      <div className="problem-actions">
        {due ? (
          <>
            <button className="btn ghost sm" onClick={() => reviewed(id, false)}>Reviewed</button>
            <button className="btn ghost sm" onClick={() => reviewed(id, true)}>Again later</button>
          </>
        ) : (
          <>
            {!d.solved && compact && <button className="icon-btn" title="Solved, but I needed help — revise later" onClick={() => solve(id, { revisit: true })}><Bookmark size={18} /></button>}
            {d.solved && <button className={`icon-btn ${d.revisit ? 'on' : ''}`} title="Flag for revision" onClick={() => toggleRevisit(id)}><Bookmark size={18} fill={d.revisit ? 'currentColor' : 'none'} /></button>}
            {!d.solved && compact && <button className="icon-btn" title="Skip for now" onClick={() => skipProblem(id)}><SkipForward size={18} /></button>}
          </>
        )}
        {!compact && <button className="link" onClick={() => setOpen(!open)}>Note</button>}
      </div>
      {open && <textarea className="problem-note" rows={2} value={note} onChange={(e) => setLocalNote(e.target.value)} onBlur={() => setNote(id, note)} placeholder="Pattern, mistake, or the trick you learned…" />}
    </div>
  )
}

export function Quiz({ qids, onClose }) {
  const { update, date, notify } = useStore()
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [results, setResults] = useState([])
  const qs = qids.map((id) => APT_BY_ID[id]).filter(Boolean)
  const q = qs[i]
  const finished = i >= qs.length

  useEffect(() => {
    if (!finished || !qs.length) return
    const byTopic = {}
    results.forEach((r) => { const t = (byTopic[APT_BY_ID[r.id].topic] ||= [0, 0]); t[1]++; if (r.ok) t[0]++ })
    update((s) => {
      s.apt.log.push({ date, correct: results.filter((r) => r.ok).length, total: results.length, byTopic })
      results.forEach((r) => { s.apt.last[r.id] = r.ok })
    })
    notify('Session saved.')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  if (!qs.length) return <p className="muted">No questions available.</p>
  if (finished) {
    const c = results.filter((r) => r.ok).length
    return (
      <div className="quiz-result">
        <h3>{c} / {results.length} correct</h3>
        <p className="muted">{c / results.length >= 0.8 ? 'Strong session.' : c / results.length >= 0.5 ? 'Decent. Review the ones you missed — they come back next time.' : 'This is where the learning is. Missed questions will be repeated first.'}</p>
        <button className="btn primary" onClick={onClose}>Done</button>
      </div>
    )
  }
  const ans = picked !== null
  return (
    <div className="quiz">
      <div className="row-between"><small className="chip">{APT_TOPICS[q.topic]}</small><small>{i + 1} / {qs.length}</small></div>
      <h3 className="q">{q.q}</h3>
      <div className="opts">
        {q.options.map((o, k) => (
          <button key={k} disabled={ans} className={`opt ${ans && k === q.answer ? 'right' : ''} ${ans && k === picked && k !== q.answer ? 'wrong' : ''}`} onClick={() => setPicked(k)}>
            <span>{String.fromCharCode(65 + k)}</span>{o}
          </button>
        ))}
      </div>
      {ans && (
        <div className="explain">
          <b>{picked === q.answer ? 'Correct.' : 'Not quite.'}</b> {q.why}
          <div><button className="btn primary sm" onClick={() => { setResults([...results, { id: q.id, ok: picked === q.answer }]); setPicked(null); setI(i + 1) }}>{i + 1 === qs.length ? 'Finish' : 'Next'}</button></div>
        </div>
      )}
      <button className="link quiz-quit" onClick={onClose}><X size={14} /> Quit (unfinished sessions aren’t saved)</button>
    </div>
  )
}

export function SpeakLog({ promptIndex, techniqueIndex }) {
  const { update, date, notify } = useStore()
  const [rating, setRating] = useState(3)
  const [note, setNote] = useState('')
  const [secs, setSecs] = useState(0)
  const [rec, setRec] = useState(false)
  const t = useRef()
  useEffect(() => { if (rec) t.current = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t.current) }, [rec])
  return (
    <div className="speak">
      <p className="chip">Technique today</p>
      <p>{SPEAK_TECHNIQUES[techniqueIndex % SPEAK_TECHNIQUES.length]}</p>
      <h3 className="q">“{SPEAK_PROMPTS[promptIndex % SPEAK_PROMPTS.length]}”</h3>
      <p className="muted">Speak out loud for 2–3 minutes (record yourself on your phone if you can, and listen back once).</p>
      <div className="timer"><b>{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</b><button className="btn ghost sm" onClick={() => setRec(!rec)}>{rec ? 'Stop' : 'Start speaking'}</button></div>
      <label className="rate">Self-rating (clarity & structure)
        <div>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={`chip ${rating === n ? 'active' : ''}`} onClick={() => setRating(n)}>{n}</button>)}</div>
      </label>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="One thing to improve next time (e.g. fewer fillers, clearer ending)…" />
      <button className="btn primary" onClick={() => { update((s) => { s.speak.push({ date, promptId: promptIndex, rating, note, seconds: secs }) }); setSecs(0); setRec(false); setNote(''); notify('Logged. Keep going.') }}>Save practice</button>
    </div>
  )
}
