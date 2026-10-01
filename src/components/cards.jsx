import { ExternalLink, Check } from 'lucide-react'
import { useStore } from '../store.jsx'

export function LessonCard({ lesson }) {
  const { state, finishLesson } = useStore()
  const done = !!state.lessons[lesson.id]
  return (
    <div className="lesson">
      <h3>{lesson.title}</h3>
      <p><b>What:</b> {lesson.what}</p>
      <p className="do"><b>Do this:</b> {lesson.doThis}</p>
      <p><b>You’re done when:</b> {lesson.outcome}</p>
      {lesson.resources.length > 0 && <div className="res">{lesson.resources.map((r) => <a key={r.url} className="chip" href={r.url} target="_blank" rel="noreferrer">{r.label} <ExternalLink size={13} /></a>)}</div>}
      <button className={`btn ${done ? 'ghost' : 'primary'}`} onClick={() => finishLesson(lesson.id)}>{done ? 'Completed — undo' : <>Mark complete <Check size={17} /></>}</button>
    </div>
  )
}

export function StepCard({ step }) {
  const { state, finishStep } = useStore()
  const done = !!state.steps[step.id]
  return (
    <div className="lesson">
      <h3>{step.title}</h3>
      <p><b>Done when:</b> {step.doneWhen}</p>
      <p className="muted">Commit your work to Git before you mark this complete.</p>
      <button className={`btn ${done ? 'ghost' : 'primary'}`} onClick={() => finishStep(step.id)}>{done ? 'Completed — undo' : <>Mark step complete <Check size={17} /></>}</button>
    </div>
  )
}
