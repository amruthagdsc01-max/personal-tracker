import { useState } from 'react'
import { Brain, Code2, Hammer, BookOpen, Calculator, Mic, Briefcase, ChevronDown, Check, Sparkles } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHead, Card, Chip, Bar } from '../components/ui.jsx'
import { FocusTimer, ProblemRow, Quiz, SpeakLog } from '../components/blocks.jsx'
import { LessonCard, StepCard } from '../components/cards.jsx'
import UpcomingBanner from '../components/UpcomingBanner.jsx'
import { BLOCKS, DAY_MODES } from '../domain/model.js'
import { blockDone, mentor, modeOf, planFor, streakInfo, visibleBlocks } from '../domain/engine.js'
import { LESSON_BY_ID } from '../data/learn.js'
import { ALL_STEPS } from '../data/build.js'
import { CAREER_WEEK } from '../data/career.js'
import { weekday, fmt, parse } from '../domain/dates.js'

const ICON = { dsa: Code2, build: Hammer, learn: BookOpen, apt: Calculator, speak: Mic, career: Briefcase }

export default function Today({ go }) {
  const { state, date, setMode, update, notify } = useStore()
  const mode = modeOf(state, date)
  const plan = planFor(state, date)
  const blocks = visibleBlocks(state, date)
  const done = blocks.filter((b) => blockDone(state, date, b.id))
  const minutes = blocks.reduce((s, b) => s + b.minutes, 0)
  const doneMin = done.reduce((s, b) => s + b.minutes, 0)
  const m = mentor(state, date)
  const { streak } = streakInfo(state, date)
  const [open, setOpen] = useState(blocks[0]?.id)
  const [quiz, setQuiz] = useState(false)
  const career = CAREER_WEEK[parse(date).getDay()]

  const body = (id) => {
    if (id === 'dsa') return (
      <>
        <p className="muted">Solve these two, in order. Try for 25 minutes before looking at hints. Bookmark = solved but needs revision.</p>
        {plan.dsa.map((pid) => <ProblemRow key={pid} id={pid} compact date={date} />)}
        {!plan.dsa.length && <p>You have finished the whole sheet. Revisit flagged problems on the DSA page.</p>}
      </>
    )
    if (id === 'build') {
      const step = ALL_STEPS.find((s) => s.id === plan.step)
      return step ? <><p className="chip">{step.project}</p><StepCard step={step} /></> : <p>All build steps finished — pick your next project on the Build page.</p>
    }
    if (id === 'learn') {
      const l = LESSON_BY_ID[plan.learn]
      return l ? <><p className="chip">{l.track}</p><LessonCard lesson={l} /></> : <p>All learning tracks complete. Add depth in your build block.</p>
    }
    if (id === 'apt') return quiz ? <Quiz qids={plan.apt} onClose={() => setQuiz(false)} /> : (
      <>
        <p className="muted">10 mixed questions. Missed ones return first next time. Aim for accuracy first, speed second.</p>
        <button className="btn primary" onClick={() => setQuiz(true)}>Start today’s set</button>
      </>
    )
    if (id === 'speak') return <SpeakLog promptIndex={plan.speak} techniqueIndex={plan.technique} />
    if (id === 'career') return (
      <>
        <h3>{career.title}</h3>
        <ol className="steps">{career.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="why"><b>Why:</b> {career.why}</p>
        <div className="row-btns">
          <button className="btn ghost" onClick={() => go('career')}>Open Career tools</button>
          <button className={`btn ${state.careerDone[date] ? 'ghost' : 'primary'}`} onClick={() => update((s) => { if (s.careerDone[date]) delete s.careerDone[date]; else s.careerDone[date] = true })}>{state.careerDone[date] ? 'Done — undo' : <>Mark done <Check size={17} /></>}</button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHead script={weekday(date)} title="Today’s plan" sub={fmt(date, { day: 'numeric', month: 'long', year: 'numeric' })}
        right={<div className="daytype">{Object.entries(DAY_MODES).map(([k, v]) => <Chip key={k} active={mode === k} onClick={() => setMode(date, k)}>{v.label}</Chip>)}</div>} />

      <UpcomingBanner go={go} />

      <Card tilt={false} className="mentor">
        <div className="mentor-top"><span className="avatar"><Brain size={22} /></span><div><small>YOUR MENTOR</small><h2>{m.headline}</h2></div></div>
        {m.lines.map((l) => <p key={l} className="mline">{l}</p>)}
        {m.focus && <p className="why"><Sparkles size={15} /> {m.focus}</p>}
        {m.joined?.map((l) => <p key={l} className="muted">{l}</p>)}
      </Card>

      {mode === 'rest' ? (
        <Card tilt={false} className="rest-card"><h2>Enjoy the rest.</h2><p>Rest days never break your streak. Resume tomorrow where you stopped.</p></Card>
      ) : (
        <>
          <div className="day-progress">
            <div><b>{done.length}/{blocks.length}</b> blocks · {(doneMin / 60).toFixed(1)}h of {(minutes / 60).toFixed(1)}h{streak > 0 && <> · {streak}-day streak</>}</div>
            <Bar pct={minutes ? (doneMin / minutes) * 100 : 0} />
          </div>
          <div className="blocks">
            {blocks.map((b) => {
              const Icon = ICON[b.id]
              const isDone = blockDone(state, date, b.id)
              const isOpen = open === b.id
              return (
                <Card key={b.id} tilt={false} className={`block ${isDone ? 'done' : ''} ${isOpen ? 'open' : ''}`}>
                  <button className="block-head" onClick={() => setOpen(isOpen ? null : b.id)} aria-expanded={isOpen}>
                    <span className="block-ico">{isDone ? <Check size={22} strokeWidth={3} /> : <Icon size={22} />}</span>
                    <span className="block-title"><b>{b.label}</b><small>{b.minutes} min · {b.sub}</small></span>
                    <ChevronDown size={20} className="chev" />
                  </button>
                  {isOpen && <div className="block-body"><FocusTimer minutes={b.minutes} />{body(b.id)}</div>}
                </Card>
              )
            })}
          </div>
        </>
      )}
      <Card tilt={false} className="review">
        <h3>End-of-day note</h3>
        <textarea rows={2} defaultValue={state.reviews[date]?.note || ''} onBlur={(e) => update((s) => { s.reviews[date] = { note: e.target.value } })} placeholder="What clicked today? What was hard? One line is enough." aria-label="Daily note" />
        <button className="btn ghost sm" onClick={() => go('career')}>Turn today into a LinkedIn post</button>
      </Card>
    </>
  )
}
