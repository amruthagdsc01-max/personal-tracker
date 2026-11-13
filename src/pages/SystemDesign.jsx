import { useEffect } from 'react'
import './sd/sd.css'
import { useSd, useRoute, sdGo } from './sd/useSd.js'
import Today, { Onboarding } from './sd/Today.jsx'
import Path from './sd/Path.jsx'
import Lesson from './sd/Lesson.jsx'
import Labs from './sd/Labs.jsx'
import Practice from './sd/Practice.jsx'
import Interview from './sd/Interview.jsx'
import Mentor from './sd/Mentor.jsx'
import Progress from './sd/Progress.jsx'

const TABS = [['today', 'Today'], ['path', 'Path'], ['lab', 'Labs'], ['practice', 'Practice'], ['interview', 'Interview'], ['mentor', 'Mentor'], ['progress', 'Progress']]
const tabOf = (view) => (view === 'lesson' ? 'path' : view)

export default function SystemDesign() {
  const S = useSd()
  const { view, arg } = useRoute()
  const tab = tabOf(view)
  useEffect(() => { document.title = `System Design · ezze` ; return () => { document.title = 'ezze — your daily mentor' } }, [])

  if (!S.sd.onboarded) return <div className="sd"><Onboarding S={S} /></div>
  return (
    <div className="sd">
      <nav className="sd-nav" aria-label="System Design sections">
        <span className="sd-brand">System Design</span>
        <ul>{TABS.map(([k, l]) => <li key={k}><button className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => sdGo(k)}>{l}</button></li>)}</ul>
      </nav>
      <div key={view + (arg || '')} className="sd-view">
        {view === 'today' && <Today S={S} />}
        {view === 'path' && <Path S={S} />}
        {view === 'lesson' && <Lesson id={arg} S={S} />}
        {view === 'lab' && <Labs S={S} id={arg} />}
        {view === 'practice' && <Practice S={S} id={arg} />}
        {view === 'interview' && <Interview S={S} arg={arg} />}
        {view === 'mentor' && <Mentor S={S} arg={arg} />}
        {view === 'progress' && <Progress S={S} />}
        {!TABS.some(([k]) => k === tab) && <p className="empty">Nothing here. <button className="link" onClick={() => sdGo('today')}>Go to Today</button></p>}
      </div>
    </div>
  )
}
