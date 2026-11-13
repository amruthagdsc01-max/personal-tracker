import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ExternalLink, Lock, MessageCircle, Lightbulb, Eye } from 'lucide-react'
import { BY_ID, LESSONS, LEVEL_NAMES, TIERS, STAGES, allPrereqs } from '../../data/sd/index.js'
import { lessonRec, levelOpen, missingPrereqs, mastery, quizPassed, lastQuiz } from '../../domain/sd/engine.js'
import { Rich, Flow, Mcq, Evaluator } from '../../components/sd/parts.jsx'
import { LAB_FOR } from '../../domain/sd/engine.js'
import { sdGo } from './useSd.js'

const LEVEL_HINT = ['Plain language and analogies', 'How it works inside', 'Real engineering scenario', 'Failure modes and trade-offs']

function Hook({ lesson }) {
  const [text, setText] = useState('')
  const [n, setN] = useState(0)
  const [shown, setShown] = useState(false)
  const h = lesson.hook
  return (
    <section className="sd-hook" aria-labelledby="hook-h">
      <p className="kicker" id="hook-h">Think first</p>
      <p className="lede"><Rich text={h.story} /></p>
      <p className="ask"><Rich text={h.ask} /></p>
      {!shown ? (
        <>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Jot down what you think. A wrong guess is useful; it makes the explanation stick." aria-label="Your thinking" />
          <div className="row">
            <button className="btn ghost sm" disabled={n >= h.hints.length} onClick={() => setN((x) => x + 1)}><Lightbulb size={15} /> {n ? 'Another hint' : 'Hint'}</button>
            <button className="btn primary sm" onClick={() => setShown(true)} disabled={text.trim().length < 12 && n < 1}><Eye size={15} /> {text.trim().length >= 12 ? 'Show what happens' : 'Hint first, or write a guess'}</button>
            {text.trim().length < 12 && n >= 1 && <button className="link" onClick={() => setShown(true)}>I just want the answer</button>}
          </div>
          {n > 0 && <ol className="hints">{h.hints.slice(0, n).map((x, i) => <li key={i}>{x}</li>)}</ol>}
        </>
      ) : (<div className="reveal"><p className="kicker">What actually happens</p><p><Rich text={h.reveal} /></p></div>)}
    </section>
  )
}

function Level({ lesson, i, r, onPass, open }) {
  const v = lesson.levels[i]
  const [passed, setPassed] = useState(!!r.checks[i])
  useEffect(() => { setPassed(!!r.checks[i]) }, [r.checks[i]])
  if (!open) return null
  return (
    <div className="sd-level">
      {v.body.map((p, k) => <p key={k}><Rich text={p} /></p>)}
      {v.code && <pre className="code" tabIndex={0} aria-label={`${v.code.lang} example`}><code>{v.code.text}</code></pre>}
      {v.steps && <ol className="sd-steps">{v.steps.map((s, k) => <li key={k}><Rich text={s} /></li>)}</ol>}
      {v.body2 && v.body2.map((p, k) => <p key={`b${k}`}><Rich text={p} /></p>)}
      <div className="checkpoint">
        <p className="kicker">Checkpoint {passed && '· passed'}</p>
        <Mcq item={v.check} onAnswer={(ok) => { if (ok && !passed) { setPassed(true); onPass(i) } }} label={`Level ${i + 1} checkpoint`} />
      </div>
    </div>
  )
}

export default function Lesson({ id, S }) {
  const lesson = BY_ID[id]
  const { sd, date } = S
  const [lvl, setLvl] = useState(0)
  const [override, setOverride] = useState(false)
  const [picks, setPicks] = useState({})
  const [result, setResult] = useState(null)
  const [note, setNote] = useState(sd.notes[id] || '')
  const [reveal, setReveal] = useState({})
  useEffect(() => { setLvl(0); setOverride(false); setPicks({}); setResult(null); setNote(S.sd.notes[id] || ''); setReveal({}) }, [id])
  if (!lesson) return <p className="empty">That lesson does not exist. <button className="link" onClick={() => sdGo('path')}>Back to the path</button></p>
  const r = lessonRec(sd, id)
  const idx = LESSONS.findIndex((l) => l.id === id)
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1]
  const missing = missingPrereqs(sd, id)
  const gated = missing.length > 0 && !override
  const m = mastery(sd, id, date)
  const bm = sd.bm.includes(id)
  const allLevels = [0, 1, 2, 3].every((i) => r.checks[i])
  const lab = LAB_FOR[id]
  const q = lastQuiz(r)
  const stage = STAGES.find((s) => s.id === lesson.stage)

  const submit = () => { setResult(S.submitQuiz(id, picks)) }

  return (
    <article className="sd-lesson">
      <nav className="crumbs" aria-label="Breadcrumb"><button className="link" onClick={() => sdGo('path')}>Path</button><span>/</span><span>Stage {stage.id} · {stage.name}</span></nav>
      <header className="l-head">
        <p className="kicker">{TIERS[lesson.tier].label} · {lesson.minutes} min · {m.label}</p>
        <h1>{lesson.title}</h1>
        <div className="row">
          <button className={`btn ghost sm ${bm ? 'on' : ''}`} onClick={() => S.toggleBookmark(id)} aria-pressed={bm}>{bm ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {bm ? 'Bookmarked' : 'Bookmark'}</button>
          <button className="btn ghost sm" onClick={() => sdGo(`mentor/${id}`)}><MessageCircle size={15} /> Ask the mentor</button>
          {lab && <button className="btn ghost sm" onClick={() => sdGo(`lab/${lab}`)}>Open the lab</button>}
        </div>
      </header>

      {missing.length > 0 && (
        <aside className={`gate ${override ? 'soft' : ''}`} role="note">
          <Lock size={16} />
          <div>
            <b>{override ? 'You chose to read ahead.' : 'This builds on lessons you have not passed yet.'}</b>
            <p>It needs: {missing.map((p) => <button key={p} className="link" onClick={() => sdGo(`lesson/${p}`)}>{BY_ID[p].title}</button>).reduce((a, b) => [a, ', ', b])}. Checkpoints and quizzes still record honestly.</p>
            {!override && <button className="btn ghost sm" onClick={() => setOverride(true)}>Read it anyway</button>}
          </div>
        </aside>
      )}

      {!gated && (
        <>
          <Hook lesson={lesson} />
          <section aria-labelledby="levels-h">
            <p className="kicker" id="levels-h">Four levels. Each checkpoint unlocks the next.</p>
            <div className="lvl-tabs" role="tablist">
              {LEVEL_NAMES.map((n, i) => { const open = levelOpen(r, i); return (
                <button key={n} role="tab" aria-selected={lvl === i} className={`${sd-lvl === i ? 'on' : ''} ${r.checks[i] ? 'ok' : ''}`} disabled={!open} onClick={() => setLvl(i)} title={open ? LEVEL_HINT[i] : 'Pass the previous checkpoint to unlock'}>
                  <small>Level {i + 1}</small><b>{n}</b>{!open && <Lock size={12} />}
                </button>) })}
            </div>
            <p className="muted lvl-hint">{LEVEL_HINT[lvl]}. You can revisit earlier levels any time.</p>
            {[0, 1, 2, 3].map((i) => <Level key={i} lesson={lesson} i={i} r={r} open={lvl === i} onPass={(n) => { S.passCheck(id, n); if (n < 3) setTimeout(() => setLvl(n + 1), 600) }} />)}
          </section>

          {allLevels && (
            <>
              <section aria-labelledby="see-h"><p className="kicker" id="see-h">See it</p><Flow diagram={lesson.diagram} /></section>
              <section className="trade" aria-labelledby="tr-h">
                <p className="kicker" id="tr-h">When, when not, and what it costs</p>
                <dl>
                  <div><dt>Use it when</dt>{lesson.sections.when.map((t, i) => <dd key={i}><Rich text={t} /></dd>)}</div>
                  <div><dt>Avoid it when</dt>{lesson.sections.whenNot.map((t, i) => <dd key={i}><Rich text={t} /></dd>)}</div>
                  <div><dt>Trade-off</dt>{lesson.sections.tradeoffs.map((t, i) => <dd key={i}><Rich text={t} /></dd>)}</div>
                  <div><dt>In production</dt>{lesson.sections.real.map((t, i) => <dd key={i}><Rich text={t} /></dd>)}</div>
                </dl>
                <p className="connects"><b>How it connects.</b> <Rich text={lesson.connects} /></p>
                {lesson.related.length > 0 && <p className="muted">Related: {lesson.related.map((x) => <button key={x} className="link" onClick={() => sdGo(`lesson/${x}`)}>{BY_ID[x].title}</button>).reduce((a, b) => [a, ' · ', b])}</p>}
              </section>

              <section aria-labelledby="exp-h">
                <p className="kicker" id="exp-h">Explain it back</p>
                <Evaluator prompt={`In your own words, explain the idea behind "${lesson.title}": why it exists, how it works and its main trade-off. Do not copy the lesson.`} points={lesson.interview.points} model={lesson.interview.model} initial={r.expl} saveLabel="Save as my explanation" onSave={(c, t) => S.saveEvidence(id, 'expl', c, t)} />
                {r.expl && <p className="muted">Explained {r.expl.date}: {Math.round(r.expl.cov * 100)}% of key points.</p>}
              </section>

              <section aria-labelledby="q-h">
                <p className="kicker" id="q-h">Quiz: 3 concept + 2 scenario questions</p>
                {lesson.quiz.map((item, i) => (
                  <div key={i} className="quiz-item">
                    <span className="sd-tag">{item.kind === 'scenario' ? 'Scenario' : 'Concept'} {i + 1}</span>
                    <fieldset disabled={!!result}>
                      <legend><Rich text={item.q} /></legend>
                      <ul className="plain">{item.o.map((t, k) => (<li key={k}><label className={`radio ${result ? (k === item.a ? 'ok' : picks[i] === k ? 'no' : '') : ''}`}><input type="radio" name={`q${i}`} checked={picks[i] === k} onChange={() => setPicks((p) => ({ ...p, [i]: k }))} /><span>{t}</span></label></li>))}</ul>
                    </fieldset>
                    {result && <p className={`fb ${picks[i] === item.a ? 'ok' : 'no'}`}><Rich text={item.why} /></p>}
                  </div>
                ))}
                {!result ? <button className="btn primary" onClick={submit} disabled={Object.keys(picks).length < lesson.quiz.length}>Submit quiz ({Object.keys(picks).length}/{lesson.quiz.length} answered)</button> : (
                  <div className={`result ${result.score / result.total >= 0.6 ? 'ok' : 'no'}`} role="status">
                    <b>{result.score}/{result.total}</b> {result.score / result.total >= 0.7 ? 'Solid. A review is scheduled so this sticks.' : result.score / result.total >= 0.6 ? 'Passed, but shaky. It will come back soon.' : 'Not passed yet. That is useful information, not failure. Re-read the levels you struggled with, then try again tomorrow.'}
                    <div className="row"><button className="btn ghost sm" onClick={() => { setPicks({}); setResult(null) }}>Retake</button>{result.score / result.total < 0.6 && allPrereqs(id).length > 0 && <span className="muted">If this keeps happening, revise: {allPrereqs(id).slice(0, 3).map((p) => <button key={p} className="link" onClick={() => sdGo(`lesson/${p}`)}>{BY_ID[p].title}</button>).reduce((a, b) => [a, ', ', b])}</span>}</div>
                  </div>
                )}
                {!result && q && <p className="muted">Last attempt {q.date}: {q.score}/{q.total}.</p>}
              </section>

              <section aria-labelledby="ch-h">
                <p className="kicker" id="ch-h">Challenge</p>
                <Evaluator prompt={lesson.challenge.q} hints={lesson.challenge.hints} points={lesson.challenge.points} model={lesson.challenge.model} initial={r.appl} saveLabel="Save as applied evidence" onSave={(c, t) => S.saveEvidence(id, 'appl', c, t)} />
                {r.appl && <p className="muted">Applied {r.appl.date}: {Math.round(r.appl.cov * 100)}%.</p>}
              </section>

              <section className="summary" aria-labelledby="sm-h">
                <p className="kicker" id="sm-h">Summary</p>
                <div className="cols">
                  <div><h3>Key takeaways</h3><ul>{lesson.summary.key.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul></div>
                  <div><h3>Common mistakes</h3><ul>{lesson.summary.mistakes.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul></div>
                  <div><h3>Interview note</h3><p><Rich text={lesson.interview.q} /></p><button className="link" onClick={() => sdGo(`interview/${'iq-' + id}`)}>Practise this question →</button></div>
                </div>
                <p className="remember">Remember: <Rich text={lesson.summary.remember} /></p>
              </section>
            </>
          )}

          <section aria-labelledby="nt-h">
            <p className="kicker" id="nt-h">My notes</p>
            <label className="sr" htmlFor="note">Notes for this lesson</label>
            <textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => S.saveNote(id, note)} placeholder="Write the 3 lines you would tell a friend. (Saved when you click away.)" />
            <div className="row"><button className="btn ghost sm" onClick={() => { S.saveNote(id, note); S.notify('Note saved') }}>Save note</button></div>
          </section>

          <section aria-labelledby="rf-h">
            <p className="kicker" id="rf-h">Go deeper (curated)</p>
            <ul className="refs">{lesson.refs.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} <ExternalLink size={13} /></a><span>{x.why}</span></li>)}</ul>
          </section>
        </>
      )}

      <nav className="pager" aria-label="Lesson navigation">
        {prev ? <button className="btn ghost" onClick={() => sdGo(`lesson/${prev.id}`)}><ChevronLeft size={16} /> {prev.title}</button> : <span />}
        {next ? <button className={`btn ${quizPassed(r) ? 'primary' : 'ghost'}`} onClick={() => sdGo(`lesson/${next.id}`)}>{next.title} <ChevronRight size={16} /></button> : <button className="btn primary" onClick={() => sdGo('practice')}>On to design problems <ChevronRight size={16} /></button>}
      </nav>
    </article>
  )
}
