import { useEffect, useState } from 'react'
import { ArrowRight, Check, Circle, RotateCcw } from 'lucide-react'
import { BY_ID, STAGES } from '../../data/sd/index.js'
import { BLOCKS, blocksFor, blockDone, dueReviews, mastery, readiness, reviewQuestions, stageProgress, streakInfo, weakTopics, weekInfo, nextLesson, lessonRec, levelsPassed } from '../../domain/sd/engine.js'
import { Mcq } from '../../components/sd/parts.jsx'
import { sdGo } from './useSd.js'

const EXPERIENCE = [
  { v: 'zero', label: 'Absolute beginner', note: 'Start from how the internet works. Recommended.' },
  { v: 'some', label: 'I know the web basics', note: 'You still pass each lesson\'s checks; the platform will not skip anything for you.' },
]
const GOALS = ['Software engineering interviews (SDE)', 'Understand real production systems', 'Both: interviews and engineering depth']

export function Onboarding({ S }) {
  const [level, setLevel] = useState('zero')
  const [goal, setGoal] = useState(GOALS[2])
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const go = () => { if (!ok) { setErr('Tick the box to confirm your daily hour. Small and daily beats long and rare.'); return } S.onboard({ level, goal }); S.notify('Your path is ready.') }
  return (
    <section className="onboard">
      <p className="kicker">System Design, from zero</p>
      <h1>Learn to think like the engineer who designs the system.</h1>
      <p className="lede">One hour a day. Every concept goes WHY, WHAT, HOW, WHEN, TRADE-OFF. You will be asked to think before answers appear, and nothing counts as learned until you have proven it with a quiz, an explanation or a scenario.</p>
      <div className="ob-grid">
        <fieldset><legend>Where are you starting?</legend>
          {EXPERIENCE.map((e) => (<label key={e.v} className={`choice ${level === e.v ? 'on' : ''}`}><input type="radio" name="lvl" checked={level === e.v} onChange={() => setLevel(e.v)} /><span><b>{e.label}</b><small>{e.note}</small></span></label>))}
        </fieldset>
        <fieldset><legend>What is it for?</legend>
          {GOALS.map((g) => (<label key={g} className={`choice ${goal === g ? 'on' : ''}`}><input type="radio" name="goal" checked={goal === g} onChange={() => setGoal(g)} /><span><b>{g}</b></span></label>))}
        </fieldset>
      </div>
      <div className="hour"><b>Your hour</b>{BLOCKS.map((b) => <span key={b.id}>{b.minutes} min · {b.label}</span>)}</div>
      <label className="sd-check-line"><input type="checkbox" checked={ok} onChange={(e) => { setOk(e.target.checked); setErr('') }} /> I will give this one hour on the days I can. Missing a day is fine; I will just resume.</label>
      {err && <p className="fb no" role="alert">{err}</p>}
      <button className="btn primary" onClick={go}>Begin lesson 1 <ArrowRight size={16} /></button>
    </section>
  )
}

function Revise({ S, id }) {
  const qs = reviewQuestions(S.sd, id, 3)
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [first, setFirst] = useState(true)
  const [answeredRight, setAnsweredRight] = useState(false)
  const [fin, setFin] = useState(false)
  const next = () => {
    if (i + 1 < qs.length) { setI(i + 1); setFirst(true); setAnsweredRight(false) } else { setFin(true); S.finishReview(id, right, qs.length); S.notify('Review saved. The next one is scheduled.') }
  }
  if (fin) return <p className="muted">Done: {right}/{qs.length} on the first try. It will be asked again after a {right / qs.length >= 0.7 ? 'longer' : 'shorter'} gap.</p>
  return (
    <div className="revise">
      <p className="muted">Question {i + 1} of {qs.length} from <b>{BY_ID[id].title}</b>. Your first attempt counts.</p>
      <Mcq key={`${id}-${i}`} item={qs[i]} onAnswer={(ok) => { if (first) { setFirst(false); if (ok) setRight((r) => r + 1) } if (ok) setAnsweredRight(true) }} />
      <button className="btn ghost sm" onClick={next} disabled={!answeredRight}>{i + 1 < qs.length ? 'Next question' : 'Finish review'}</button>
    </div>
  )
}

export default function Today({ S }) {
  const { sd, date } = S
  const [open, setOpen] = useState(null)
  useEffect(() => { S.ensurePlan() }, [date])
  const plan = sd.plan[date]
  const si = streakInfo(sd, date)
  const wk = weekInfo(sd, date)
  const rd = readiness(sd, date)
  const due = dueReviews(sd, date)
  const weak = weakTopics(sd, date)
  const stages = stageProgress(sd, date)
  const learn = plan?.learn ? BY_ID[plan.learn] : null
  const cont = nextLesson(sd)
  const r = learn ? lessonRec(sd, learn.id) : null
  const away = si.gap !== null && si.gap > 1
  const todays = blocksFor(plan)
  const doneCount = todays.filter((b) => blockDone(sd, date, b.id)).length

  const act = {
    revise: () => setOpen(open === 'revise' ? null : 'revise'),
    learn: () => learn && sdGo(`lesson/${learn.id}`),
    demo: () => (plan.demo ? sdGo(`lab/${plan.demo}`) : learn && sdGo(`lesson/${learn.id}`)),
    quiz: () => learn && sdGo(`lesson/${learn.id}`),
    notes: () => learn && sdGo(`lesson/${learn.id}`),
  }
  const detail = {
    revise: plan?.revise ? `Revisit "${BY_ID[plan.revise].title}" (${due.length} due)` : 'Nothing is due yet, so there is nothing to revise today.',
    learn: learn ? `${learn.title}${r && levelsPassed(r) ? ` · levels ${levelsPassed(r)}/4 passed` : ''}` : 'Curriculum complete. Do design problems instead.',
    demo: plan?.demo ? 'Run the lab and change the settings until the behaviour makes sense' : 'Work through the Apply-level scenario for today\'s lesson',
    quiz: 'Take the lesson quiz or the challenge',
    notes: 'Write 3 lines in your own words (20+ characters)',
  }

  return (
    <div className="sd-today">
      <header className="t-head">
        <div>
          <p className="kicker">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{away ? 'Welcome back. Nothing was lost.' : si.total === 0 ? 'Your first hour starts here.' : 'Today\'s hour.'}</h1>
          <p className="lede">{away ? `It has been ${si.gap} days. Your progress and reviews are safe; reviews simply wait for you. Start with the block below and the plan adjusts itself.` : learn ? `Today: ${learn.title} — ${doneCount} of ${todays.length} blocks done.` : 'You have worked through every lesson. Keep practising with problems and mock interviews.'}</p>
        </div>
        <dl className="vitals">
          <div><dt>Streak</dt><dd>{si.streak}<small> {si.streak === 1 ? 'day' : 'days'}</small></dd></div>
          <div><dt>Days studied</dt><dd>{si.total}</dd></div>
          <div><dt>This week</dt><dd>{wk.count}<small>/{wk.goal}</small></dd></div>
          <div><dt>Interview ready</dt><dd>{rd.pct}<small>%</small></dd></div>
        </dl>
      </header>

      <section aria-labelledby="hour-h">
        <h2 id="hour-h" className="sr">The hour</h2>
        <ol className="sd-blocks">
          {BLOCKS.map((b, i) => { const d = blockDone(sd, date, b.id); const na = b.id === 'revise' && !plan?.revise; return (
            <li key={b.id} className={`${d ? 'done' : ''} ${na ? 'na' : ''}`}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <div className="b-main"><b>{b.label}</b><small>{b.minutes} min · {detail[b.id]}</small>
                {b.id === 'revise' && open === 'revise' && plan?.revise && <div className="b-open"><Revise key={plan.revise} S={S} id={plan.revise} /></div>}
              </div>
              <span className="st" aria-label={na ? 'Nothing due' : d ? 'Done' : 'Not done'}>{na ? <small>skip</small> : d ? <Check size={18} /> : <Circle size={18} />}</span>
              {!(b.id === 'revise' && !plan?.revise) && <button className="btn ghost sm" onClick={act[b.id]} disabled={!plan || (!learn && b.id !== 'revise')}>{d ? 'Open again' : b.id === 'revise' ? (open === 'revise' ? 'Hide' : 'Start') : 'Go'}</button>}
            </li>) })}
        </ol>
        <p className="muted foot">A block turns green only when you actually answered, passed or wrote something. Opening a page does not count.</p>
      </section>

      <div className="t-cols">
        <section aria-labelledby="due-h">
          <h2 id="due-h">Reviews due</h2>
          {due.length === 0 ? <p className="muted">Nothing due. Reviews appear 1, 3, 7, 14, 30 days after you pass a quiz, and sooner if you miss one.</p> : <ul className="rows">{due.slice(0, 6).map((x) => <li key={x.id}><button className="link" onClick={() => sdGo(`lesson/${x.id}`)}>{BY_ID[x.id].title}</button><small>due {x.due}</small></li>)}</ul>}
        </section>
        <section aria-labelledby="weak-h">
          <h2 id="weak-h">Needs attention</h2>
          {weak.length === 0 ? <p className="muted">No weak topics yet. When a quiz goes badly, it shows up here with the prerequisite most likely to be the real gap.</p> : <ul className="rows">{weak.slice(0, 5).map((w) => <li key={w.id}><button className="link" onClick={() => sdGo(`lesson/${w.id}`)}>{BY_ID[w.id].title}</button><small>{w.weakPre.length ? `first revise: ${w.weakPre.map((p) => BY_ID[p].title).join(', ')}` : `${w.lapses} lapses`}</small></li>)}</ul>}
        </section>
      </div>

      <section aria-labelledby="path-h">
        <h2 id="path-h">The journey</h2>
        <ol className="journey">
          {stages.map((s) => (
            <li key={s.id}>
              <span className="n">{s.id}</span>
              <div><b>{s.name}</b><small>{s.blurb}</small></div>
              <span className="meter" role="img" aria-label={`${s.understood} of ${s.total} passed`}><i style={{ width: `${s.total ? (s.understood / s.total) * 100 : 0}%` }} /></span>
              <small className="ct">{s.understood}/{s.total}</small>
            </li>
          ))}
        </ol>
        <div className="row"><button className="btn primary" onClick={() => cont && sdGo(`lesson/${cont.id}`)} disabled={!cont}><RotateCcw size={15} /> {cont ? `Resume: ${cont.title}` : 'All lessons passed'}</button><button className="btn ghost" onClick={() => sdGo('path')}>See the full map</button></div>
      </section>
    </div>
  )
}
