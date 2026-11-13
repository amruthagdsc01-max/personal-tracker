import { useEffect, useRef, useState } from 'react'
import { Timer } from 'lucide-react'
import { RUBRIC_DIMS, DIM_LESSONS, BY_ID, ASSESS_CRITERIA, ASSESSMENTS } from '../../data/sd/index.js'
import { suggestChecks, coverage, overallPct, PASS } from '../../domain/sd/engine.js'
import { sdGo } from './useSd.js'

const PLACEHOLDER = {
  requirements: 'Functional and non-functional requirements, scope you exclude, assumptions, scale numbers.',
  architecture: 'APIs and the main components: how a request flows through them, and why you picked them.',
  scalability: 'Estimates and how it grows: replicas, sharding, stateless tiers.',
  database: 'Entities, keys, indexes, SQL vs NoSQL and why.',
  performance: 'Caching, CDN, async work, what keeps latency low.',
  reliability: 'What fails and what happens: redundancy, retries, idempotency, failover.',
  tradeoffs: 'What you chose, what you gave up, and what you would change if requirements changed.',
  communication: 'Write the 2-3 sentences you would SAY to open the design and to summarise it.',
}

/** A timed, unguided mock interview scored on the eight dimensions. The learner confirms every rubric point honestly. */
export function MockRun({ problem, S, onSaved }) {
  const [ans, setAns] = useState(() => Object.fromEntries(RUBRIC_DIMS.map((d) => [d.id, ''])))
  const [phase, setPhase] = useState('write')
  const [checks, setChecks] = useState({})
  const [sug, setSug] = useState({})
  const [sec, setSec] = useState(0)
  const [timerOn, setTimerOn] = useState(true)
  const [err, setErr] = useState('')
  const ref = useRef()
  useEffect(() => { if (phase !== 'write' || !timerOn) return undefined; ref.current = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(ref.current) }, [phase, timerOn])
  const total = RUBRIC_DIMS.reduce((a, d) => a + ans[d.id].trim().length, 0)
  const toCheck = () => {
    const filled = RUBRIC_DIMS.filter((d) => ans[d.id].trim().length >= 20).length
    if (filled < 4) { setErr('Write something for at least 4 of the 8 dimensions (20+ characters each) before scoring. Real interviews reward breadth with depth.'); return }
    setErr('')
    setSug(Object.fromEntries(RUBRIC_DIMS.map((d) => [d.id, suggestChecks(ans[d.id], problem.rubric[d.id])])))
    setChecks(Object.fromEntries(RUBRIC_DIMS.map((d) => [d.id, problem.rubric[d.id].map(() => false)])))
    setPhase('check')
  }
  const scores = Object.fromEntries(RUBRIC_DIMS.map((d) => [d.id, Math.round(coverage(checks[d.id] || []) * 100)]))
  const pct = overallPct(scores)
  const save = () => { S.saveMock({ problemId: problem.id, pct, scores, seconds: sec }); setPhase('done'); onSaved?.(pct); S.notify('Mock interview saved.') }
  const mm = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
  const weak = RUBRIC_DIMS.filter((d) => scores[d.id] < 60)

  return (
    <div className="sd-mock">
      <div className="mock-bar"><Timer size={15} /> <b aria-live="off">{mm}</b> <button className="link" onClick={() => setTimerOn(!timerOn)}>{timerOn ? 'pause' : 'resume'}</button><span className="muted"> · a real interview is ~35-45 minutes</span></div>
      <p className="lede">{problem.prompt}</p>
      {phase === 'write' && (
        <>
          {RUBRIC_DIMS.map((d, i) => (
            <div key={d.id} className="dim-field"><label htmlFor={`d-${d.id}`}><span className="n">{i + 1}</span>{d.label}</label>
              <textarea id={`d-${d.id}`} rows={3} value={ans[d.id]} placeholder={PLACEHOLDER[d.id]} onChange={(e) => { setAns({ ...ans, [d.id]: e.target.value }); setErr('') }} /></div>))}
          {err && <p className="fb no" role="alert">{err}</p>}
          <button className="btn primary" onClick={toCheck}>Score my design ({total} characters)</button>
        </>
      )}
      {phase === 'check' && (
        <>
          <p className="muted">For each dimension tick the points your design truly covered. We mark where a keyword appears in your text, but only you can judge whether you actually said it well. These points are what interviewers listen for.</p>
          {RUBRIC_DIMS.map((d) => (
            <fieldset key={d.id} className="dim-check"><legend>{d.label}<b className={scores[d.id] >= PASS * 100 ? 'ok' : 'no'}>{scores[d.id]}%</b></legend>
              {problem.rubric[d.id].map((p, i) => <label key={i}><input type="checkbox" checked={!!checks[d.id]?.[i]} onChange={(e) => setChecks({ ...checks, [d.id]: checks[d.id].map((v, j) => (j === i ? e.target.checked : v)) })} /><span>{p.t}{sug[d.id]?.[i] && <em className="seen"> · keyword seen</em>}</span></label>)}
            </fieldset>))}
          <p className="score" role="status">Overall: <b>{pct}%</b></p>
          <div className="row"><button className="btn ghost sm" onClick={() => setPhase('write')}>Back to my answers</button><button className="btn primary sm" onClick={save}>Save this attempt</button></div>
        </>
      )}
      {phase === 'done' && (
        <div className="feedback" role="status">
          <h3>Feedback: {pct}% in {mm}</h3>
          {weak.length === 0 ? <p>Every dimension was at least 60%. Next: try a problem you have not seen, with the timer on.</p> : (<><p>What you missed, and where to fix it:</p>
            <ul>{weak.map((d) => <li key={d.id}><b>{d.label} ({scores[d.id]}%).</b> Missed: {problem.rubric[d.id].filter((_, i) => !checks[d.id]?.[i]).map((p) => p.t.toLowerCase()).join('; ')}. Revisit {DIM_LESSONS[d.id].map((id) => <button key={id} className="link" onClick={() => sdGo(`lesson/${id}`)}>{BY_ID[id].title}</button>).reduce((a, b) => [a, ', ', b])}.</li>)}</ul></>)}
          <details><summary>Show my answers</summary>{RUBRIC_DIMS.map((d) => <p key={d.id}><b>{d.label}:</b> {ans[d.id] || '(empty)'}</p>)}</details>
        </div>
      )}
    </div>
  )
}

/** End-of-stage practical assessment. Same eight questions every stage; weak ones point back to lessons. */
export function Assessment({ stage, S }) {
  const a = ASSESSMENTS[stage]
  const prev = S.sd.asmt[stage]
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('write')
  const [checks, setChecks] = useState([])
  const [sug, setSug] = useState([])
  const [err, setErr] = useState('')
  const check = () => { if (text.trim().length < 150) { setErr('This is an unfamiliar problem: write a real design (at least 150 characters) before scoring. Cover requirements, bottlenecks, components, trade-offs and failures.'); return } setErr(''); setSug(suggestChecks(text, a.points.map((x) => x.p))); setChecks(a.points.map(() => false)); setPhase('check') }
  const pct = Math.round(coverage(checks) * 100)
  const weak = ASSESS_CRITERIA.filter((c, i) => !checks[i])
  const save = () => { S.saveAssessment(stage, { pct, weak: weak.map((w) => w.id), text: text.slice(0, 1500) }); setPhase('done'); S.notify('Assessment saved.') }
  return (
    <div className="assess">
      <p className="kicker">Stage {stage} practical assessment</p>
      <h3>{a.title}</h3>
      <p className="lede">{a.prompt}</p>
      {prev && phase === 'write' && <p className="muted">Last attempt {prev.date}: {prev.pct}%.</p>}
      {phase === 'write' && (<><textarea rows={9} value={text} onChange={(e) => { setText(e.target.value); setErr('') }} aria-label="Your design" placeholder="Think out loud like in an interview: what is the problem, what matters, where are the bottlenecks, what would you use and why, what could fail, how would you improve it?" />{err && <p className="fb no" role="alert">{err}</p>}<button className="btn primary" onClick={check}>Evaluate against the 8 questions</button></>)}
      {phase !== 'write' && (
        <>
          <ul className="sd-points">{ASSESS_CRITERIA.map((c, i) => <li key={c.id}><label><input type="checkbox" checked={!!checks[i]} disabled={phase === 'done'} onChange={(e) => setChecks(checks.map((v, j) => (j === i ? e.target.checked : v)))} /><span><b>{c.label}</b><small>{a.points[i].p.t}{sug[i] && <em className="seen"> · keyword seen</em>}</small></span></label></li>)}</ul>
          <p className={`score ${pct >= 60 ? 'ok' : 'no'}`} role="status">{pct}%: {pct >= 75 ? 'strong independent thinking.' : pct >= 50 ? 'a solid base with gaps below.' : 'plenty to build on; the gaps below show exactly where.'}</p>
          {weak.length > 0 && <div className="feedback"><p>Concepts to revisit:</p><ul>{weak.map((c) => <li key={c.id}>{c.label} → {a.revisit[c.id].map((id) => <button key={id} className="link" onClick={() => sdGo(`lesson/${id}`)}>{BY_ID[id].title}</button>).reduce((x, y) => [x, ', ', y])}</li>)}</ul></div>}
          {phase === 'check' ? <div className="row"><button className="btn ghost sm" onClick={() => setPhase('write')}>Edit my design</button><button className="btn primary sm" onClick={save}>Save assessment</button></div> : <button className="btn ghost sm" onClick={() => { setPhase('write'); setText('') }}>Try again</button>}
        </>
      )}
    </div>
  )
}
