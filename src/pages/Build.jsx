import { useState } from 'react'
import { Check, Rocket } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHead, Card, Ring } from '../components/ui.jsx'
import Carousel from '../components/Carousel.jsx'
import { StepCard } from '../components/cards.jsx'
import { projectProgress, nextStep } from '../domain/engine.js'

export default function Build() {
  const { state, update, notify } = useStore()
  const projects = projectProgress(state)
  const active = state.profile.activeProject
  const [sel, setSel] = useState(active)
  const [openS, setOpenS] = useState(null)
  const p = projects.find((x) => x.id === sel)
  const next = nextStep(state)

  return (
    <>
      <PageHead script="Proof beats certificates" title="Build" sub="Four projects companies recognise. Each step has a clear ‘done when’, so you always know whether it is finished. Commit to Git after every step." />
      <Carousel peek>
        {projects.map((x) => (
          <Card key={x.id} className={`track ${x.id === sel ? 'sel' : ''}`} onClick={() => { setSel(x.id); setOpenS(null) }} role="button" tabIndex={0}>
            <div className="row-between"><h3>{x.name}</h3><Ring pct={x.pct} size={58} stroke={7}><b className="sm">{x.pct}%</b></Ring></div>
            <div className="stack">{x.stack.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            <small>{x.done}/{x.total} steps{active === x.id ? ' · current project' : ''}</small>
          </Card>
        ))}
      </Carousel>

      <div className="row-between sec">
        <h2>{p.name}</h2>
        <button className={`btn ${active === p.id ? 'primary' : 'ghost'}`} onClick={() => { update((s) => { s.profile.activeProject = p.id }); notify(`${p.name} is now your daily build`) }}><Rocket size={17} /> {active === p.id ? 'Current project' : 'Work on this now'}</button>
      </div>
      <p className="why"><b>Why companies care:</b> {p.why}</p>
      <div className="lessons">
        {p.steps.map((s, i) => {
          const done = !!state.steps[s.id]
          const isNext = next?.id === s.id
          return (
            <Card key={s.id} tilt={false} className={`lesson-row ${done ? 'done' : ''} ${isNext ? 'next' : ''}`}>
              <button className="lesson-head" onClick={() => setOpenS(openS === s.id ? null : s.id)}>
                <span className={`check ${done ? 'on' : ''}`}>{done && <Check size={16} strokeWidth={3} />}</span>
                <span><b>{i + 1}. {s.title}</b>{isNext && <em> · up next</em>}<small>~75 min</small></span>
              </button>
              {openS === s.id && <StepCard step={s} />}
            </Card>
          )
        })}
      </div>
    </>
  )
}
