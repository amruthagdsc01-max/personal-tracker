import { useId, useState } from 'react'
import { Check, X, Lightbulb, Eye } from 'lucide-react'
import { suggestChecks, coverage, PASS } from '../../domain/sd/engine.js'

/** **bold** and `code` inside plain strings (content is our own data, never user HTML). */
export function Rich({ text, as: Tag = 'span' }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return <Tag>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p)}</Tag>
}

/** Architecture / sequence diagram drawn from the lesson's small data description. */
export function Flow({ diagram }) {
  const uid = useId().replace(/:/g, '')
  if (!diagram) return null
  if (diagram.seq) {
    const actors = [...new Set(diagram.seq.flatMap(([a, b]) => [a, b]))]
    const W = Math.max(520, actors.length * 190), X = (i) => 90 + i * ((W - 180) / Math.max(1, actors.length - 1)), H = 70 + diagram.seq.length * 46
    return (
      <figure className="sd-fig">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={diagram.caption}>
          <defs><marker id={`a${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker></defs>
          {actors.map((a, i) => (<g key={a}><rect x={X(i) - 70} y="8" width="140" height="30" rx="2" className="n" /><text x={X(i)} y="28" textAnchor="middle" className="t">{a}</text><line x1={X(i)} y1="38" x2={X(i)} y2={H - 6} className="life" /></g>))}
          {diagram.seq.map(([from, to, msg], i) => { const y = 66 + i * 46, x1 = X(actors.indexOf(from)), x2 = X(actors.indexOf(to)); return (<g key={i}><line x1={x1} y1={y} x2={x2} y2={y} className="e" markerEnd={`url(#a${uid})`} /><text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" className="m">{msg}</text></g>) })}
        </svg>
        <figcaption>{diagram.caption}</figcaption>
      </figure>
    )
  }
  const rows = diagram.rows, boxW = 190, gap = 26, rowH = 64
  const maxN = Math.max(...rows.map((r) => r.length)), W = Math.max(420, maxN * (boxW + gap) + gap), H = rows.length * rowH + (rows.length - 1) * 24 + 24
  const pos = rows.map((r, ri) => r.map((_, ci) => ({ x: (W - (r.length * (boxW + gap) - gap)) / 2 + ci * (boxW + gap), y: 12 + ri * (rowH + 24) })))
  return (
    <figure className="sd-fig">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={diagram.caption}>
        <defs><marker id={`a${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker></defs>
        {rows.slice(1).map((r, ri) => r.map((_, ci) => {
          const to = pos[ri + 1][ci], prev = pos[ri]
          const from = diagram.link === 'fan' && prev.length === 1 ? prev[0] : (prev[ci] || prev[prev.length - 1])
          const targets = diagram.link === 'fan' && prev.length > 1 ? prev : [from]
          return targets.map((f, k) => <line key={`${ri}-${ci}-${k}`} x1={f.x + boxW / 2} y1={f.y + rowH - 10} x2={to.x + boxW / 2} y2={to.y} className="e" markerEnd={`url(#a${uid})`} />)
        }))}
        {rows.map((r, ri) => r.map((label, ci) => (<g key={`${ri}-${ci}`}><rect x={pos[ri][ci].x} y={pos[ri][ci].y} width={boxW} height={rowH - 10} rx="2" className="n" /><text x={pos[ri][ci].x + boxW / 2} y={pos[ri][ci].y + (rowH - 10) / 2 + 5} textAnchor="middle" className="t">{label.length > 26 ? `${label.slice(0, 25)}…` : label}</text></g>)))}
      </svg>
      <figcaption>{diagram.caption}</figcaption>
    </figure>
  )
}

/** One multiple-choice question. `onAnswer(correct)` fires on every attempt; wrong answers explain and allow a retry. */
export function Mcq({ item, onAnswer, locked, label }) {
  const [pick, setPick] = useState(null)
  const done = pick !== null
  const right = pick === item.a
  const choose = (i) => { if (locked || right) return; setPick(i); onAnswer?.(i === item.a, i) }
  return (
    <div className="sd-mcq" role="group" aria-label={label || item.q}>
      <p className="mcq-q"><Rich text={item.q} /></p>
      <ul>
        {item.o.map((t, i) => (
          <li key={i}><button className={`sd-opt ${done && i === pick ? (right ? 'ok' : 'no') : ''}`} onClick={() => choose(i)} aria-pressed={pick === i} disabled={locked || right}><span className="k">{String.fromCharCode(65 + i)}</span><span>{t}</span>{done && i === pick && (right ? <Check size={16} /> : <X size={16} />)}</button></li>
        ))}
      </ul>
      {done && <p className={`fb ${right ? 'ok' : 'no'}`} role="status">{right ? 'Correct. ' : 'Not quite, have another look. '}<Rich text={right ? item.why : 'Think about what the question is really asking, then try another option.'} /></p>}
    </div>
  )
}

/**
 * Write an answer, then check yourself against the key points. The keyword matcher only PRE-TICKS points;
 * you confirm each one, so the score reflects honest self-assessment, not a pretend AI grade.
 */
export function Evaluator({ prompt, points, model, onSave, saveLabel = 'Save my result', initial, hints, children, minChars = 40 }) {
  const [text, setText] = useState(initial?.text || '')
  const [stage, setStage] = useState(initial ? 'done' : 'write') // write -> check -> done
  const [checks, setChecks] = useState([])
  const [sug, setSug] = useState([])
  const [hintN, setHintN] = useState(0)
  const [err, setErr] = useState('')
  const start = () => {
    if (text.trim().length < minChars) { setErr(`Write at least ${minChars} characters first. Attempting the answer is what teaches you; the model answer comes after.`); return }
    setErr(''); setSug(suggestChecks(text, points)); setChecks(points.map(() => false)); setStage('check')
  }
  const cov = coverage(checks)
  const save = () => { onSave(checks, text, cov); setStage('done') }
  return (
    <div className="eval">
      {prompt && <p className="eval-q"><Rich text={prompt} /></p>}
      {children}
      {stage === 'write' && (
        <>
          <label className="sr" htmlFor={`ta-${prompt?.slice(0, 8)}`}>Your answer</label>
          <textarea id={`ta-${prompt?.slice(0, 8)}`} rows={6} value={text} onChange={(e) => { setText(e.target.value); setErr('') }} placeholder="Write your answer in your own words. Short sentences are fine." />
          {err && <p className="fb no" role="alert">{err}</p>}
          <div className="row">
            {hints?.length > 0 && <button className="btn ghost sm" onClick={() => setHintN((n) => Math.min(hints.length, n + 1))} disabled={hintN >= hints.length}><Lightbulb size={15} /> {hintN ? 'Next hint' : 'Give me a hint'}</button>}
            <button className="btn primary sm" onClick={start}><Eye size={15} /> Check my answer</button>
          </div>
          {hintN > 0 && <ol className="hints">{hints.slice(0, hintN).map((h, i) => <li key={i}>{h}</li>)}</ol>}
        </>
      )}
      {stage === 'check' && (
        <>
          <p className="muted">Tick each point your answer genuinely covered. We flag where a keyword appears in your text, but a keyword is not understanding, so you decide.</p>
          <ul className="sd-points">
            {points.map((p, i) => (<li key={i}><label><input type="checkbox" checked={!!checks[i]} onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))} /><span>{p.t}{sug[i] && <em className="seen"> · keyword seen in your text</em>}</span></label></li>))}
          </ul>
          <details className="model" open><summary>Model answer</summary><p><Rich text={model} /></p></details>
          <p className={`score ${cov >= PASS ? 'ok' : 'no'}`} role="status">{Math.round(cov * 100)}% of key points covered {cov >= PASS ? '(counts as evidence)' : '(below 60%: revisit and try again; that is how it sticks)'}</p>
          <div className="row"><button className="btn ghost sm" onClick={() => setStage('write')}>Edit my answer</button><button className="btn primary sm" onClick={save}>{saveLabel}</button></div>
        </>
      )}
      {stage === 'done' && (
        <div className="saved">
          <p className="muted">Saved{checks.length ? `: ${Math.round(cov * 100)}% of key points covered` : initial?.cov !== undefined ? `: ${Math.round(initial.cov * 100)}% covered last time` : ''}. {text && <em>Your answer: {text.slice(0, 140)}{text.length > 140 ? '…' : ''}</em>}</p>
          <button className="btn ghost sm" onClick={() => setStage('write')}>Answer again</button>
        </div>
      )}
    </div>
  )
}
