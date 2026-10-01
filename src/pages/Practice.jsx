import { useState } from 'react'
import { useStore } from '../store.jsx'
import { PageHead, Card, Chip, Bar } from '../components/ui.jsx'
import { Quiz, SpeakLog } from '../components/blocks.jsx'
import { APTITUDE, APT_TOPICS, SPEAK_PROMPTS, SPEAK_TECHNIQUES } from '../data/practice.js'
import { aptStats, planFor } from '../domain/engine.js'
import { fmt } from '../domain/dates.js'

export default function Practice() {
  const { state, date } = useStore()
  const [tab, setTab] = useState('apt')
  const [quiz, setQuiz] = useState(null)
  const stats = aptStats(state)
  const plan = planFor(state, date)

  const custom = (topic) => {
    const last = state.apt.last
    const pool = APTITUDE.filter((q) => !topic || q.topic === topic).sort((a, b) => (last[a.id] === false ? -1 : 0) - (last[b.id] === false ? -1 : 0) || (last[a.id] === undefined ? -1 : 0) - (last[b.id] === undefined ? -1 : 0))
    setQuiz(pool.slice(0, 10).map((q) => q.id))
  }

  return (
    <>
      <PageHead script="Sharpen the soft edges" title="Practice" sub="Aptitude screens and communication decide many offers. Ten minutes of focused work a day compounds." />
      <div className="filters"><Chip active={tab === 'apt'} onClick={() => setTab('apt')}>Aptitude</Chip><Chip active={tab === 'speak'} onClick={() => setTab('speak')}>Communication</Chip></div>

      {tab === 'apt' && (
        quiz ? <Card tilt={false}><Quiz qids={quiz} onClose={() => setQuiz(null)} /></Card> : (
          <>
            <div className="cards-3">
              {Object.entries(APT_TOPICS).map(([k, label]) => {
                const [c, n] = stats[k] || [0, 0]
                return (
                  <Card key={k} tilt={false}>
                    <h3>{label}</h3>
                    <p className="muted">{n ? `${Math.round((c / n) * 100)}% accuracy over ${n} answers` : 'Not attempted yet'}</p>
                    <Bar pct={n ? (c / n) * 100 : 0} />
                    <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => custom(k)}>Practise {label.toLowerCase()}</button>
                  </Card>
                )
              })}
            </div>
            <div className="row-btns" style={{ marginTop: 20 }}>
              <button className="btn primary" onClick={() => setQuiz(plan.apt)}>Today’s mixed set</button>
              <button className="btn ghost" onClick={() => custom(null)}>Weakest-first set</button>
            </div>
            <p className="muted">Bank: {APTITUDE.length} questions with explanations. Missed questions come back first.</p>
            <h2 className="sec">Recent sessions</h2>
            {[...state.apt.log].reverse().slice(0, 8).map((l, i) => <p key={i} className="log-row"><b>{fmt(l.date)}</b> {l.correct}/{l.total} correct</p>)}
            {!state.apt.log.length && <p className="muted">No sessions yet.</p>}
          </>
        )
      )}

      {tab === 'speak' && (
        <>
          <Card tilt={false}><SpeakLog promptIndex={plan.speak} techniqueIndex={plan.technique} /></Card>
          <h2 className="sec">Seven techniques to rotate through</h2>
          <ul className="tips">{SPEAK_TECHNIQUES.map((t) => <li key={t}>{t}</li>)}</ul>
          <h2 className="sec">Your practice log</h2>
          {[...state.speak].reverse().slice(0, 10).map((s, i) => (
            <p key={i} className="log-row"><b>{fmt(s.date)}</b> rated {s.rating}/5 — “{SPEAK_PROMPTS[s.promptId % SPEAK_PROMPTS.length].slice(0, 60)}…”{s.note && <span className="muted"> · {s.note}</span>}</p>
          ))}
          {!state.speak.length && <p className="muted">Nothing logged yet. Your first recording will feel awkward — that is normal.</p>}
        </>
      )}
    </>
  )
}
