import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { PROBLEMS, STAGES, BY_ID } from '../../data/sd/index.js'
import { stageProgress } from '../../domain/sd/engine.js'
import { Rich } from '../../components/sd/parts.jsx'
import { Assessment, MockRun } from './Mock.jsx'
import { sdGo } from './useSd.js'

function Solve({ problem, S }) {
  const saved = S.sd.probs[problem.id] || { steps: {} }
  const [i, setI] = useState(() => Math.min(Object.keys(saved.steps).length, problem.steps.length))
  const [guess, setGuess] = useState('')
  const [shownIdeal, setShownIdeal] = useState(false)
  const [mode, setMode] = useState('guided')
  const st = problem.steps[i]
  const picked = saved.steps[i]
  const stepsDone = Object.keys(saved.steps).length
  const goodCount = problem.steps.filter((s, k) => saved.steps[k] !== undefined && s.opts[saved.steps[k]]?.good).length
  const next = () => { setGuess(''); setShownIdeal(false); setI(i + 1) }

  return (
    <div className="solve">
      <p className="kicker">{problem.level} · stage 6</p>
      <h2>{problem.title}</h2>
      <p className="lede">{problem.prompt}</p>
      <div className="tabs2" role="tablist"><button role="tab" aria-selected={mode === 'guided'} className={mode === 'guided' ? 'on' : ''} onClick={() => setMode('guided')}>Guided, step by step</button><button role="tab" aria-selected={mode === 'solo'} className={mode === 'solo' ? 'on' : ''} onClick={() => setMode('solo')} disabled={stepsDone < problem.steps.length && !saved.done}>On your own (mock){stepsDone < problem.steps.length && !saved.done ? ' · after guided' : ''}</button></div>
      {mode === 'solo' ? <MockRun problem={problem} S={S} /> : i >= problem.steps.length ? (
        <div className="result ok" role="status">
          <h3>Guided run finished</h3>
          <p>You chose the strongest option on {goodCount} of {problem.steps.length} decisions. Now do it without scaffolding: open the "On your own" tab and write the whole design against the eight interview dimensions.</p>
          <div className="row"><button className="btn primary sm" onClick={() => { S.problemDone(problem.id, goodCount); setMode('solo') }}>Continue to the solo attempt</button><button className="btn ghost sm" onClick={() => { setI(0); setShownIdeal(false) }}>Review the steps</button></div>
        </div>
      ) : (
        <div className="step">
          <p className="kicker">Decision {i + 1} of {problem.steps.length} · {st.title}</p>
          <p className="mcq-q"><Rich text={st.q} /></p>
          {picked === undefined && <><label className="sr" htmlFor="guess">Your own answer first</label><textarea id="guess" rows={2} value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="First, in a sentence: what would you do? (optional, but the options make more sense after you commit to a guess.)" /></>}
          <ul className="plain">{st.opts.map((o, k) => (
            <li key={k}><button className={`sd-opt ${picked === k ? (o.good ? 'ok' : 'no') : picked !== undefined && o.good ? 'ok soft' : ''}`} disabled={picked !== undefined} onClick={() => S.problemStep(problem.id, i, k)}><span className="k">{String.fromCharCode(65 + k)}</span><span>{o.t}</span></button>{picked !== undefined && (picked === k || o.good) && <p className={`fb ${o.good ? 'ok' : 'no'}`}><Rich text={o.fb} /></p>}</li>))}</ul>
          {picked !== undefined && (<>
            {!shownIdeal ? <button className="btn ghost sm" onClick={() => setShownIdeal(true)}>What would a strong answer include?</button> : <div className="reveal"><p className="kicker">A strong answer</p><p><Rich text={st.ideal} /></p></div>}
            <div className="row"><button className="btn primary sm" onClick={next}>{i + 1 < problem.steps.length ? 'Next decision' : 'Finish guided run'}</button></div></>)}
        </div>
      )}
    </div>
  )
}

export default function Practice({ S, id }) {
  const stages = stageProgress(S.sd, S.date)
  const [open, setOpen] = useState(null)
  const problem = PROBLEMS.find((p) => p.id === id)
  if (id === 'assess') return <div className="practice"><button className="link back" onClick={() => sdGo('practice')}>← Practice</button>{STAGES.slice(0, 6).map((s) => <details key={s.id} className="acc" open={open === s.id} onToggle={(e) => setOpen(e.currentTarget.open ? s.id : (open === s.id ? null : open))}><summary>Stage {s.id}: {s.name}<small>{stages[s.id - 1].assessed ? `assessed ${stages[s.id - 1].assessed.pct}%` : s.test}</small></summary>{open === s.id && <Assessment stage={s.id} S={S} />}</details>)}</div>
  if (problem) return <div className="practice"><button className="link back" onClick={() => sdGo('practice')}>← All problems</button><Solve key={problem.id} problem={problem} S={S} /></div>
  return (
    <div className="practice">
      <header className="p-head"><p className="kicker">Practice</p><h1>Solve it before you see it.</h1><p className="lede">Each problem asks you to decide first, then shows the consequences and a stronger approach. Finish the guided run, then do it alone on the eight interview dimensions.</p></header>
      <section aria-labelledby="pr-h"><h2 id="pr-h">Design problems</h2>
        <ol className="lab-list">{PROBLEMS.map((p, i) => { const lockedBy = p.prereq.filter((x) => !S.sd.les[x] || !S.sd.les[x].quizzes.some((q) => q.score / q.total >= 0.6)); const d = S.sd.probs[p.id]; return (
          <li key={p.id}><button onClick={() => sdGo(`practice/${p.id}`)}><span className="n">{String(i + 1).padStart(2, '0')}</span><span><b>{p.title}</b><small>{p.level} · {lockedBy.length ? `recommended first: ${lockedBy.slice(0, 3).map((x) => BY[x] || x).join(', ')}` : 'prerequisites passed'}</small></span><em>{d?.done ? <><Check size={14} /> guided {d.score}/{p.steps.length}</> : lockedBy.length ? <><Lock size={13} /> {lockedBy.length} lessons open</> : Object.keys(d?.steps || {}).length ? 'in progress' : 'not started'}</em></button></li>) })}</ol>
        <p className="muted">More problems (Instagram, YouTube, ride booking, a distributed rate limiter, a news feed) are the natural next step once the four above feel easy. They are not in this version; the mock mode works with any of the four until you can design them cold.</p>
      </section>
      <section aria-labelledby="as-h"><h2 id="as-h">Stage assessments</h2><p className="muted">An unfamiliar problem at the end of each stage, scored on eight questions: did you understand it, find the requirements and bottlenecks, choose and justify components, see the trade-offs and failures, and improve it?</p><button className="btn primary" onClick={() => sdGo('practice/assess')}>Open assessments</button></section>
    </div>
  )
}
const BY = Object.fromEntries(Object.entries(BY_ID).map(([k, v]) => [k, v.title]))
