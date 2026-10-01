import { useState } from 'react'
import { Check, Target } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHead, Card, Ring } from '../components/ui.jsx'
import Carousel from '../components/Carousel.jsx'
import { LessonCard } from '../components/cards.jsx'
import { trackProgress, nextLesson } from '../domain/engine.js'

export default function Learn() {
  const { state, update, notify } = useStore()
  const tracks = trackProgress(state)
  const [sel, setSel] = useState(nextLesson(state)?.trackId || tracks[0].id)
  const [openL, setOpenL] = useState(null)
  const track = tracks.find((t) => t.id === sel)
  const focus = state.profile.focusTrack
  const next = nextLesson(state)

  return (
    <>
      <PageHead script="Useful tools only" title="Learn" sub="Each lesson is 45 minutes and ends in something you do. Learn the minimum, then use it in your build block the same day." />
      <Carousel peek>
        {tracks.map((t) => (
          <Card key={t.id} className={`track ${t.id === sel ? 'sel' : ''}`} onClick={() => { setSel(t.id); setOpenL(null) }} role="button" tabIndex={0}>
            <div className="row-between"><h3>{t.name}</h3><Ring pct={t.pct} size={58} stroke={7}><b className="sm">{t.pct}%</b></Ring></div>
            <p className="muted">{t.why}</p>
            <small>{t.done}/{t.total} lessons{focus === t.id ? ' · focus' : ''}</small>
          </Card>
        ))}
      </Carousel>

      <div className="row-between sec">
        <h2>{track.name}</h2>
        <button className={`btn ${focus === track.id ? 'primary' : 'ghost'}`} onClick={() => { update((s) => { s.profile.focusTrack = focus === track.id ? null : track.id }); notify(focus === track.id ? 'Focus cleared' : `Daily lessons now start with ${track.name}`) }}><Target size={17} /> {focus === track.id ? 'Daily focus' : 'Make this my daily focus'}</button>
      </div>
      <p className="muted">{track.why}</p>
      <div className="lessons">
        {track.lessons.map((l, i) => {
          const done = !!state.lessons[l.id]
          const isNext = next?.id === l.id
          return (
            <Card key={l.id} tilt={false} className={`lesson-row ${done ? 'done' : ''} ${isNext ? 'next' : ''}`}>
              <button className="lesson-head" onClick={() => setOpenL(openL === l.id ? null : l.id)}>
                <span className={`check ${done ? 'on' : ''}`}>{done && <Check size={16} strokeWidth={3} />}</span>
                <span><b>{i + 1}. {l.title}</b>{isNext && <em> · up next</em>}<small>{l.minutes} min</small></span>
              </button>
              {openL === l.id && <LessonCard lesson={l} />}
            </Card>
          )
        })}
      </div>
    </>
  )
}
