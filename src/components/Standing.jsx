import { ArrowRight } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Card, Ring, Bar } from './ui.jsx'
import { standing } from '../domain/engine.js'

const LABEL = { ahead: 'Ahead', on: 'On track', slow: 'Slightly behind', behind: 'Behind', start: 'Just starting' }

/** Honest "where am I?" report, computed only from what has been logged. */
export default function Standing({ go, compact = false }) {
  const { state, date } = useStore()
  const s = standing(state, date)
  const go2 = (id) => go?.({ dsa: 'dsa', learn: 'learn', build: 'build', apt: 'practice', speak: 'practice', career: 'career' }[id])

  return (
    <Card tilt={false} className="standing">
      <div className="standing-top">
        <Ring pct={s.overall} size={compact ? 110 : 140}><b>{s.overall}%</b><small>of plan</small></Ring>
        <div className="standing-text">
          <small className="eyebrow-s">WHERE YOU STAND</small>
          <h2>{s.stage}</h2>
          <p>{s.summary}</p>
          <p className="muted">This measures how much of <i>this plan</i> you have covered. It is not a measure of your ability.</p>
        </div>
      </div>

      {s.since !== null && s.since >= 2 && <p className="why">You were last active {s.since} days ago. No catching up needed — resume here:</p>}
      {!compact && s.resume.length > 0 && (
        <div className="resume-list"><small className="eyebrow-s">CONTINUE FROM</small>{s.resume.map((r) => <p key={r}>{r}</p>)}</div>
      )}

      <div className="areas">
        {s.areas.map((a) => (
          <button key={a.id} className={`area ${a.status}`} onClick={() => go2(a.id)}>
            <div className="row-between"><b>{a.label}</b><span className={`pill ${a.status}`}>{LABEL[a.status]}</span></div>
            <strong>{a.headline}</strong>
            <Bar pct={a.pct} />
            {!compact && <><small>{a.detail}</small><small className="muted">{a.pace}</small></>}
            {!compact && <span className="link">Open <ArrowRight size={14} /></span>}
          </button>
        ))}
      </div>
    </Card>
  )
}
