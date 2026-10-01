import { useEffect, useRef, useState } from 'react'
import { Timer, Code2, ListChecks, MessageSquare, ExternalLink, ArrowRight, Check, X, Copy, Printer, TrendingUp, TrendingDown, Minus, ShieldAlert } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store.jsx'
import { PageHead, Card, Chip, Bar } from '../components/ui.jsx'
import { MOCK_SETS } from '../data/mocks.js'
import { PROBLEM_BY_ID, problemUrl } from '../data/dsa.js'
import { QA_BY_ID, QA_CATS } from '../data/interviewQA.js'
import { buildMock, scoreMcq, scoreCoding, scoreQa, summarise, topicLabel, bandFor, timeNote, compareWithPrevious, scorecardText, fmtDuration } from '../domain/mock.js'
import { mockStats } from '../domain/engine.js'
import { fmt } from '../domain/dates.js'
import { DIFF } from '../components/blocks.jsx'

const ICON = { mcq: ListChecks, coding: Code2, qa: MessageSquare }
const TYPE_LABEL = { mcq: 'Timed quiz', coding: 'Coding', qa: 'Spoken Q&A' }
const BREAK_MIN = 3

export default function Mock({ go }) {
  const { state, date } = useStore()
  const [mode, setMode] = useState('full')
  const [session, setSession] = useState(null)
  const stats = mockStats(state, date)
  const weakAll = Object.entries(stats.topics).filter(([, [c, n]]) => n >= 3 && c / n < 0.6).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])
  const fullRuns = state.mocks.filter((m) => m.mode === 'full')

  if (session) return <Runner session={session} mode={mode} go={go} onExit={() => setSession(null)} />

  return (
    <>
      <PageHead script="Rehearse the real thing" title="Mock interviews" sub="Pick a style and sit it against the clock. Use Full-length exam for a realistic run with a final scorecard. These imitate common hiring patterns — real companies vary, so treat results as practice, not prediction." />

      <div className="mode-switch" role="group" aria-label="Mock mode">
        <button className={mode === 'full' ? 'on' : ''} onClick={() => setMode('full')}><b>Full-length exam</b><small>All rounds back to back, one clock, short breaks, strict rules, final scorecard</small></button>
        <button className={mode === 'practice' ? 'on' : ''} onClick={() => setMode('practice')}><b>Practice</b><small>Same rounds, relaxed: quit anytime, simple report</small></button>
      </div>

      <div className="mock-sets">
        {MOCK_SETS.map((set) => {
          const mins = set.rounds.reduce((s, r) => s + r.minutes, 0)
          const breaks = mode === 'full' ? (set.rounds.length - 1) * BREAK_MIN : 0
          const exam = mode === 'full' && set.rounds.length > 1
          return (
            <Card key={set.id} className="mock-set">
              <small className="eyebrow-s">{set.tag}</small>
              <h3>{set.name}</h3>
              <p className="muted">{set.blurb}</p>
              <ol className="round-list">{set.rounds.map((r, i) => { const I = ICON[r.type]; return <li key={i}><I size={15} /> {r.label}<small>{r.minutes} min</small></li> })}</ol>
              <button className="btn primary" onClick={() => setSession(buildMock(set, state))}>{exam ? 'Start exam' : 'Start'} · ~{mins + breaks} min <ArrowRight size={17} /></button>
            </Card>
          )
        })}
      </div>

      {fullRuns.length >= 2 && (
        <>
          <h2 className="sec">Your full-length trend</h2>
          <Card tilt={false}><TrendChart points={fullRuns.map((m) => ({ label: fmt(m.date), score: m.overall }))} /></Card>
        </>
      )}

      <h2 className="sec">Your mock history</h2>
      {stats.count === 0 && <p className="muted">No mocks yet. A 15-minute CS blitz is a gentle first one.</p>}
      {[...state.mocks].reverse().slice(0, 8).map((m, i) => (
        <Card key={i} tilt={false} className="mock-row">
          <div><b>{m.name}</b> {m.mode === 'full' && <span className="chip solid">Full-length</span>}<small>{fmt(m.date)} · {m.rounds.map((r) => `${r.label} ${r.score}%`).join(' · ')}</small></div>
          <div className="mock-score"><Bar pct={m.overall} tone={m.overall >= 70 ? '' : 'accent'} /><b>{m.overall}%</b></div>
        </Card>
      ))}
      {weakAll.length > 0 && (
        <Card tilt={false} className="weak-card">
          <h3>Weakest areas across all your mocks</h3>
          <div className="chips-col">{weakAll.slice(0, 5).map(([t, [c, n]]) => <Chip key={t}>{topicLabel(t)} · {Math.round((c / n) * 100)}%</Chip>)}</div>
        </Card>
      )}
    </>
  )
}

function TrendChart({ points }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ left: 0, right: 12, top: 10 }}>
        <CartesianGrid vertical={false} stroke="#F6CFCA" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} width={34} tickLine={false} axisLine={false} />
        <ReferenceLine y={60} stroke="#C2475E" strokeDasharray="4 4" label={{ value: 'pass ~60', position: 'insideTopRight', fill: '#C2475E', fontSize: 11 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Line type="monotone" dataKey="score" stroke="#4A1A09" strokeWidth={3} dot={{ r: 5, fill: '#C2475E' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ---------------- countdown (deadline-based: accurate even in throttled tabs) ---------------- */
function useCountdown(minutes, onEnd) {
  const [left, setLeft] = useState(Math.round(minutes * 60))
  const end = useRef(onEnd)
  end.current = onEnd
  useEffect(() => {
    const deadline = Date.now() + minutes * 60000
    let fired = false
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setLeft(l)
      if (l === 0 && !fired) { fired = true; clearInterval(t); end.current?.() }
    }, 500)
    return () => clearInterval(t)
  }, [minutes])
  return left
}
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const Clock = ({ left, total }) => <span className={`clock ${left < total * 0.15 ? 'low' : ''}`}><Timer size={16} /> {mmss(left)}</span>

/* ---------------- runner ---------------- */
function Runner({ session, mode, onExit, go }) {
  const exam = mode === 'full'
  const rounds = session.rounds
  const [i, setI] = useState(-1)
  const [phase, setPhase] = useState('round')
  const [results, setResults] = useState([])
  const [, tick] = useState(0)
  const examStart = useRef(0)
  const roundStart = useRef(0)
  const focusLost = useRef(0)
  const finished = i >= rounds.length
  const running = i >= 0 && !finished
  const totalAllowed = rounds.reduce((s, r) => s + r.minutes * 60, 0)

  // overall wall clock (rounds + breaks) for the exam header
  useEffect(() => { if (!running) return undefined; const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t) }, [running])

  // exam integrity: count how often the tab was left, and warn before closing
  useEffect(() => {
    if (!exam || !running) return undefined
    const vis = () => { if (document.hidden) focusLost.current += 1 }
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('beforeunload', warn)
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('beforeunload', warn) }
  }, [exam, running])

  const begin = () => { examStart.current = Date.now(); roundStart.current = Date.now(); setI(0) }
  const quit = () => { if (window.confirm(exam ? 'Quit the exam? This attempt will not be saved.' : 'Quit this mock?')) onExit() }
  const nextRound = () => { roundStart.current = Date.now(); setPhase('round'); setI((n) => n + 1); window.scrollTo({ top: 0 }) }

  if (i === -1) {
    const mins = Math.round(totalAllowed / 60)
    return (
      <>
        <PageHead script={exam ? 'Full-length exam' : 'Practice run'} title={session.name} sub={exam ? `${rounds.length} rounds · ${mins} minutes of testing${rounds.length > 1 ? ` plus ${BREAK_MIN}-minute breaks` : ''}.` : 'Each round is timed. Answer honestly.'} />
        <Card tilt={false}>
          <ol className="round-list big">{rounds.map((r, k) => { const I = ICON[r.type]; return <li key={k}><I size={18} /> <b>{r.label}</b> <small>{TYPE_LABEL[r.type]} · {r.minutes} min</small></li> })}</ol>
          {exam && (
            <div className="rules"><h3>Exam rules</h3><ul>
              <li>One continuous clock. Each round auto-submits when its time ends.</li>
              <li>You cannot return to a finished round.</li>
              <li>No hints, notes or searching for answers. Coding problems: solve unaided.</li>
              <li>Leaving this tab is counted and shown on your scorecard.</li>
              <li>Find a quiet place and silence notifications first.</li>
            </ul></div>
          )}
          <div className="row-btns"><button className="btn primary" onClick={begin}>{exam ? 'Start the exam' : 'Begin round 1'}</button><button className="btn ghost" onClick={onExit}>Back</button></div>
        </Card>
      </>
    )
  }

  if (finished) {
    const wall = Math.round((Date.now() - examStart.current) / 1000)
    return <Summary session={session} results={results} mode={mode} focusLost={focusLost.current} wall={wall} onExit={onExit} go={go} />
  }

  const round = rounds[i]
  const meta = () => ({ timeUsed: Math.min(round.minutes * 60, Math.round((Date.now() - roundStart.current) / 1000)) })
  const done = (res) => {
    setResults((r) => [...r, res])
    if (i + 1 >= rounds.length) setI(i + 1)
    else if (exam) setPhase('break')
    else nextRound()
    window.scrollTo({ top: 0 })
  }
  const elapsed = Math.round((Date.now() - examStart.current) / 1000)

  return (
    <>
      <div className="mock-progress">
        <b>Round {i + 1} of {rounds.length}</b><span>{round.label}</span>
        {exam && <span className="exam-clock" title="Total time since you started, including breaks">Exam time {fmtDuration(elapsed)}</span>}
        <div className="mp-bar">{rounds.map((_, k) => <i key={k} className={k < i || (k === i && phase === 'break') ? 'done' : k === i ? 'now' : ''} />)}</div>
        <button className="link quit" onClick={quit}><X size={14} /> Quit</button>
      </div>
      {phase === 'break' ? <Break next={rounds[i + 1]} onGo={nextRound} /> : (
        <>
          {round.type === 'mcq' && <McqRound key={i} round={round} onDone={(a) => done(scoreMcq(round, a, meta()))} />}
          {round.type === 'coding' && <CodingRound key={i} round={round} onDone={(r) => done(scoreCoding(round, r, meta()))} />}
          {round.type === 'qa' && <QaRound key={i} round={round} onDone={(r) => done(scoreQa(round, r, meta()))} />}
        </>
      )}
    </>
  )
}

function Break({ next, onGo }) {
  const left = useCountdown(BREAK_MIN, onGo)
  return (
    <Card tilt={false} className="break-card">
      <small className="eyebrow-s">BREAK</small>
      <h2>Round complete. Breathe.</h2>
      <p className="muted">Stand up, drink some water. Next up: <b>{next.label}</b> ({next.minutes} min).</p>
      <div className="break-clock">{mmss(left)}</div>
      <button className="btn primary" onClick={onGo}>I’m ready — start next round</button>
    </Card>
  )
}

/* ---------------- MCQ ---------------- */
function McqRound({ round, onDone }) {
  const [q, setQ] = useState(0)
  const [ans, setAns] = useState({})
  const ansRef = useRef(ans)
  ansRef.current = ans
  const total = round.minutes * 60
  const left = useCountdown(round.minutes, () => onDone(ansRef.current))
  const item = round.items[q]
  const answered = Object.keys(ans).length
  const submit = () => { if (answered < round.items.length && !window.confirm(`${round.items.length - answered} unanswered. Submit anyway?`)) return; onDone(ans) }
  return (
    <Card tilt={false} className="mcq">
      <div className="row-between"><Chip>{topicLabel(item.topic)}</Chip><Clock left={left} total={total} /></div>
      <p className="muted">Question {q + 1} of {round.items.length}</p>
      <h3 className="q">{item.q}</h3>
      <div className="opts">{item.options.map((o, k) => <button key={k} className={`opt ${ans[q] === k ? 'picked' : ''}`} onClick={() => setAns({ ...ans, [q]: k })}><span>{String.fromCharCode(65 + k)}</span>{o}</button>)}</div>
      <div className="palette-grid">{round.items.map((_, k) => <button key={k} className={`${k === q ? 'cur' : ''} ${ans[k] !== undefined ? 'ans' : ''}`} onClick={() => setQ(k)} aria-label={`Question ${k + 1}`}>{k + 1}</button>)}</div>
      <div className="row-btns">
        <button className="btn ghost" disabled={q === 0} onClick={() => setQ(q - 1)}>Previous</button>
        {q < round.items.length - 1 ? <button className="btn ghost" onClick={() => setQ(q + 1)}>Next</button> : null}
        <span style={{ flex: 1 }} /><button className="btn primary" onClick={submit}>Submit round</button>
      </div>
    </Card>
  )
}

/* ---------------- coding ---------------- */
function CodingRound({ round, onDone }) {
  const [res, setRes] = useState({})
  const ref = useRef(res)
  ref.current = res
  const left = useCountdown(round.minutes, () => onDone(ref.current))
  const set = (i, patch) => setRes({ ...res, [i]: { ...res[i], ...patch } })
  return (
    <Card tilt={false}>
      <div className="row-between"><h2>{round.label}</h2><Clock left={left} total={round.minutes * 60} /></div>
      <p className="muted">Solve on LeetCode (or your editor) <b>without hints</b>. Talk through your approach as if an interviewer were listening. When you finish or time is up, report honestly how far you got.</p>
      {round.items.map((id, i) => {
        const p = PROBLEM_BY_ID[id]
        return (
          <div key={id} className="coding-item">
            <div className="coding-head"><a href={problemUrl(id)} target="_blank" rel="noreferrer">{i + 1}. {p.title} <ExternalLink size={14} /></a><span className={`diff ${p.diff}`}>{DIFF[p.diff]}</span><small className="muted">{p.topic}</small></div>
            <div className="status-row" role="group" aria-label={`Status for ${p.title}`}>
              {[['none', 'Not attempted'], ['partial', 'Partly solved'], ['solved', 'Solved']].map(([k, l]) => <Chip key={k} active={(res[i]?.status || 'none') === k} onClick={() => set(i, { status: k })}>{l}</Chip>)}
              <label className="mins">Minutes taken<input type="number" min="0" value={res[i]?.minutes ?? ''} onChange={(e) => set(i, { minutes: +e.target.value })} /></label>
            </div>
          </div>
        )
      })}
      {!round.items.length && <p>No problems available for this round.</p>}
      <div className="row-btns"><span style={{ flex: 1 }} /><button className="btn primary" onClick={() => onDone(res)}>Finish round</button></div>
    </Card>
  )
}

/* ---------------- spoken Q&A ---------------- */
function QaRound({ round, onDone }) {
  const [q, setQ] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [covered, setCovered] = useState([])
  const [rating, setRating] = useState(3)
  const [res, setRes] = useState([])
  const [secs, setSecs] = useState(0)
  const resRef = useRef(res)
  resRef.current = res
  const left = useCountdown(round.minutes, () => onDone(resRef.current))
  useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t) }, [q])
  const item = QA_BY_ID[round.items[q]]

  const next = (skip) => {
    const r = [...res, skip ? { covered: [], rating: 0, skipped: true } : { covered, rating }]
    setRes(r)
    if (q + 1 >= round.items.length) return onDone(r)
    setQ(q + 1); setReveal(false); setCovered([]); setRating(3); setSecs(0)
    return undefined
  }
  if (!item) return <Card tilt={false}><p>No questions available.</p><button className="btn primary" onClick={() => onDone([])}>Continue</button></Card>
  return (
    <Card tilt={false} className="qa">
      <div className="row-between"><Chip>{QA_CATS[item.cat]}</Chip><span className="stopwatch">answering for {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span><Clock left={left} total={round.minutes * 60} /></div>
      <p className="muted">Question {q + 1} of {round.items.length}</p>
      <h3 className="q">{item.q}</h3>
      {!reveal ? (
        <>
          <p className="muted">Answer <b>out loud</b> for 1–2 minutes, as you would in a real interview. Then reveal the key points and tick the ones you actually said.</p>
          <div className="row-btns"><button className="btn primary" onClick={() => setReveal(true)}>I’ve answered — show key points</button><button className="btn ghost" onClick={() => next(true)}>Skip</button></div>
        </>
      ) : (
        <>
          <p><b>Tick what you covered:</b></p>
          <ul className="points">{item.points.map((p, k) => (
            <li key={k}><button className={`check ${covered.includes(k) ? 'on' : ''}`} onClick={() => setCovered(covered.includes(k) ? covered.filter((x) => x !== k) : [...covered, k])} aria-label={p}>{covered.includes(k) && <Check size={14} strokeWidth={3} />}</button><span>{p}</span></li>
          ))}</ul>
          <label className="rate">How clear and well-structured was your answer?
            <div>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={`chip ${rating === n ? 'active' : ''}`} onClick={() => setRating(n)}>{n}</button>)}</div>
          </label>
          <div className="row-btns"><button className="btn primary" onClick={() => next(false)}>{q + 1 >= round.items.length ? 'Finish round' : 'Next question'}</button></div>
        </>
      )}
    </Card>
  )
}

/* ---------------- summary / final scorecard ---------------- */
function Summary({ session, results, mode, focusLost, wall, onExit, go }) {
  const { update, solve, date, state, notify } = useStore()
  const exam = mode === 'full'
  const sum = summarise(results)
  const clearedAll = results.every((r) => r.passed)
  const cleared = results.filter((r) => r.passed).length
  const band = bandFor(sum.overall, clearedAll)
  const totalUsed = results.reduce((s, r) => s + (r.timeUsed || 0), 0)
  const totalAllowed = results.reduce((s, r) => s + (r.allowed || 0), 0)
  const saved = useRef(false)
  const [marked, setMarked] = useState(false)
  // captured before this attempt is saved, so we compare with the PREVIOUS one
  const [cmp] = useState(() => compareWithPrevious(state.mocks, session.setId, mode, sum.overall, results))
  const [history] = useState(() => state.mocks.filter((m) => m.mode === 'full' && m.setId === session.setId).map((m) => ({ label: fmt(m.date), score: m.overall })))

  useEffect(() => {
    if (saved.current) return
    saved.current = true
    update((s) => {
      s.mocks = s.mocks || []
      s.mocks.push({
        date, setId: session.setId, name: session.name, mode, overall: sum.overall, timeUsed: totalUsed, focusLost,
        rounds: results.map((r) => ({ label: r.label, type: r.type, score: r.score, cut: r.cut, passed: r.passed, timeUsed: r.timeUsed, attempted: r.attempted })),
        topics: sum.topics, weak: sum.weak,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const solvedIds = results.filter((r) => r.type === 'coding').flatMap((r) => r.items.filter((x) => x.status === 'solved').map((x) => x.id)).filter((id) => !state.dsa[id]?.solved)
  const mcqWrong = results.filter((r) => r.type === 'mcq').flatMap((r) => r.wrong)
  const qaMissed = results.filter((r) => r.type === 'qa').flatMap((r) => r.items.filter((x) => x.missed.length))
  const text = scorecardText({ name: session.name, mode, date, overall: sum.overall, band, rounds: results, totalUsed: totalUsed || null, totalAllowed, focusLost, weak: sum.weak.map(topicLabel) })
  const trend = [...history, { label: 'This attempt', score: sum.overall }]

  return (
    <div className="scorecard">
      <PageHead script={exam ? 'Final scorecard' : 'Your report'} title={`${sum.overall}% overall`} sub={`${session.name} · ${sum.verdict}`} />

      {exam && (
        <Card tilt={false} className={`score-hero ${band.tone}`}>
          <div className="big-score"><b>{sum.overall}</b><span>%</span></div>
          <div className="score-meta">
            <h2>{band.label}</h2>
            <p className="muted">Cleared the pass mark in {cleared} of {results.length} rounds. Pass marks here are illustrative — real cut-offs differ by company.</p>
            <div className="stat-row">
              <span><small>TIME TESTED</small><b>{fmtDuration(totalUsed)} <i>of {fmtDuration(totalAllowed)}</i></b></span>
              <span><small>WALL CLOCK</small><b>{fmtDuration(wall)}</b></span>
              <span className={focusLost ? 'warn' : ''}><small>LEFT THE TAB</small><b>{focusLost ? <><ShieldAlert size={15} /> {focusLost}×</> : '0×'}</b></span>
              {cmp && <span><small>VS LAST ATTEMPT</small><b className={cmp.delta > 0 ? 'up' : cmp.delta < 0 ? 'down' : ''}>{cmp.delta > 0 ? <TrendingUp size={15} /> : cmp.delta < 0 ? <TrendingDown size={15} /> : <Minus size={15} />} {cmp.delta > 0 ? '+' : ''}{cmp.delta} pts</b></span>}
            </div>
          </div>
        </Card>
      )}

      <div className="cards-3">
        {results.map((r, i) => (
          <Card key={i} tilt={false} className={`round-card ${r.passed ? 'pass' : 'fail'}`}>
            <div className="row-between"><small className="eyebrow-s">{TYPE_LABEL[r.type].toUpperCase()}</small><span className={`pill ${r.passed ? 'on' : 'slow'}`}>{r.passed ? 'Cleared' : 'Below pass mark'}</span></div>
            <h3>{r.label}</h3>
            <div className="cut-bar"><Bar pct={r.score} tone={r.passed ? '' : 'accent'} /><i style={{ left: `${r.cut}%` }} title={`Pass mark ${r.cut}%`} /></div>
            <div className="row-between"><b className="r-score">{r.score}%</b><small className="muted">pass mark {r.cut}%{cmp && cmp.roundDeltas[i] != null ? ` · ${cmp.roundDeltas[i] > 0 ? '+' : ''}${cmp.roundDeltas[i]} vs last` : ''}</small></div>
            <p className="muted">{r.type === 'mcq' ? `${r.correct} of ${r.total} correct · ${r.attempted} attempted` : r.type === 'coding' ? `${r.solved} of ${r.total} solved · ${r.attempted} attempted` : `${r.attempted} of ${r.items.length} questions answered`}</p>
            {r.timeUsed != null && <p className="time-note"><Timer size={14} /> {fmtDuration(r.timeUsed)} of {fmtDuration(r.allowed)} — {timeNote(r)}</p>}
          </Card>
        ))}
      </div>

      {exam && trend.length >= 2 && (<><h2 className="sec">Your trend on this exam</h2><Card tilt={false}><TrendChart points={trend} /></Card></>)}

      {sum.advice.length > 0 ? (
        <Card tilt={false} className="weak-card">
          <h2>What to work on</h2>
          {sum.advice.map((a) => (
            <div key={a.topic} className="advice"><div><b>{topicLabel(a.topic)}</b><p className="muted">{a.text}</p></div><button className="btn ghost sm" onClick={() => { onExit(); go(a.to) }}>Open {a.to === 'dsa' ? 'DSA' : a.to === 'learn' ? 'Learn' : a.to === 'build' ? 'Build' : 'Practice'}</button></div>
          ))}
        </Card>
      ) : <Card tilt={false} className="weak-card"><h2>No clearly weak area</h2><p className="muted">Nothing fell below 60% with enough questions to be sure. Try a harder set next.</p></Card>}

      {solvedIds.length > 0 && (
        <Card tilt={false}>
          <p>You solved {solvedIds.length} problem{solvedIds.length > 1 ? 's' : ''} that {solvedIds.length > 1 ? 'are' : 'is'} not yet ticked on your DSA sheet.</p>
          <button className="btn ghost" disabled={marked} onClick={() => { solvedIds.forEach((id) => solve(id)); setMarked(true) }}>{marked ? 'Added to your sheet' : 'Tick them on my sheet'}</button>
        </Card>
      )}

      {mcqWrong.length > 0 && (
        <details className="review-box"><summary>Review {mcqWrong.length} missed quiz question{mcqWrong.length > 1 ? 's' : ''}</summary>
          {mcqWrong.map((w, i) => <div key={i} className="wrong-item"><b>{w.q}</b><p><X size={14} /> You: {w.picked ?? 'no answer'} · <Check size={14} /> Correct: {w.answer}</p><small className="muted">{w.why}</small></div>)}
        </details>
      )}
      {qaMissed.length > 0 && (
        <details className="review-box"><summary>Key points you missed in spoken answers</summary>
          {qaMissed.map((x) => <div key={x.id} className="wrong-item"><b>{x.q}</b><ul>{x.missed.map((m) => <li key={m}>{m}</li>)}</ul></div>)}
        </details>
      )}

      <div className="row-btns no-print" style={{ marginTop: 24 }}>
        <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(text).then(() => notify('Scorecard copied.'))}><Copy size={16} /> Copy scorecard</button>
        <button className="btn ghost" onClick={() => window.print()}><Printer size={16} /> Print / save as PDF</button>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={onExit}>Done — back to all sets</button>
      </div>
    </div>
  )
}
