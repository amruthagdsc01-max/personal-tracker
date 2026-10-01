import { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHead, Card, Chip } from '../components/ui.jsx'
import Applications from './Applications.jsx'
import CompanyPrep from './CompanyPrep.jsx'
import { RESUME_CHECKLIST, NETWORK_TEMPLATES, POST_IDEAS } from '../data/career.js'
import { LESSON_BY_ID } from '../data/learn.js'
import { ALL_STEPS } from '../data/build.js'
import { PROBLEM_BY_ID } from '../data/dsa.js'
import { dayNumber } from '../domain/engine.js'
import { fmt } from '../domain/dates.js'

export default function Career({ go }) {
  const [tab, setTab] = useState(() => { try { const t = sessionStorage.getItem('ezze/careerTab'); sessionStorage.removeItem('ezze/careerTab'); return t || 'apply' } catch { return 'apply' } })
  const tabs = [['apply', 'Applications'], ['prep', 'Company prep'], ['resume', 'Resume'], ['linkedin', 'LinkedIn'], ['network', 'Networking']]
  return (
    <>
      <PageHead script="Be findable" title="Career" sub="Resume, applications, LinkedIn and networking — the four things that turn skills into interviews." />
      <div className="filters">{tabs.map(([k, l]) => <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Chip>)}</div>
      {tab === 'apply' && <Applications />}
      {tab === 'prep' && <CompanyPrep go={go} />}
      {tab === 'resume' && <Resume />}
      {tab === 'linkedin' && <LinkedIn />}
      {tab === 'network' && <Network />}
    </>
  )
}

function Resume() {
  const { state, update } = useStore()
  const n = RESUME_CHECKLIST.filter((_, i) => state.resume[i]).length
  return (
    <Card tilt={false}>
      <h2>Resume checklist · {n}/{RESUME_CHECKLIST.length}</h2>
      <ul className="checklist big">
        {RESUME_CHECKLIST.map((t, i) => (
          <li key={t}><button className={`check ${state.resume[i] ? 'on' : ''}`} onClick={() => update((s) => { s.resume[i] = !s.resume[i] })} aria-label={t}>{state.resume[i] && <Check size={14} strokeWidth={3} />}</button><span>{t}</span></li>
        ))}
      </ul>
      <p className="why"><b>Project bullet formula:</b> Action verb + what you built + technology + measurable result. Example: “Built a URL shortener with FastAPI and PostgreSQL handling 500 req/s in load tests; cut redirect latency 40% with caching.” (Only write numbers you really measured.)</p>
    </Card>
  )
}

function LinkedIn() {
  const { state, update, date, notify } = useStore()
  const recent = useMemo(() => {
    const items = []
    Object.entries(state.lessons).forEach(([id, d]) => LESSON_BY_ID[id] && items.push({ d, kind: 'learned', text: LESSON_BY_ID[id].title, tag: LESSON_BY_ID[id].tag }))
    Object.entries(state.steps).forEach(([id, d]) => { const s = ALL_STEPS.find((x) => x.id === id); s && items.push({ d, kind: 'built', text: `${s.title} (${s.project})`, tag: 'buildinpublic' }) })
    Object.entries(state.dsa).forEach(([id, v]) => v.solved && v.date && PROBLEM_BY_ID[id] && items.push({ d: v.date, kind: 'solved', text: PROBLEM_BY_ID[id].title, tag: 'dsa' }))
    return items.sort((a, b) => b.d.localeCompare(a.d)).slice(0, 8)
  }, [state])
  const [src, setSrc] = useState(null)
  const [f, setF] = useState({ what: '', clicked: '', hard: '', next: '', link: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pick = (it) => { setSrc(it); setF({ ...f, what: it.text }) }
  const verb = src?.kind === 'built' ? 'built' : src?.kind === 'solved' ? 'solved' : 'learned'
  const tags = ['#learninpublic', src?.tag && `#${src.tag}`, '#softwareengineering', '#student'].filter(Boolean).join(' ')
  const post = [
    `Day ${dayNumber(state, date)} of learning in public.`,
    '',
    `Today I ${verb}: ${f.what || '…'}`,
    f.clicked && `\nWhat clicked: ${f.clicked}`,
    f.hard && `\nWhat was hard: ${f.hard}`,
    f.next && `\nNext: ${f.next}`,
    f.link && `\n${f.link}`,
    '',
    tags,
  ].filter((x) => x !== false).join('\n').replace(/\n{3,}/g, '\n\n')

  return (
    <div className="two-col">
      <Card tilt={false}>
        <h2>Post generator</h2>
        <p className="muted">Pick something you actually did recently, add your own words, then copy. Real specifics beat polished generic posts.</p>
        <div className="chips-col">{recent.length ? recent.map((it, i) => <Chip key={i} active={src === it} onClick={() => pick(it)}>{it.kind}: {it.text.slice(0, 40)}</Chip>) : <p className="muted">Complete a lesson, build step or problem first — then it will appear here.</p>}</div>
        <div className="form-grid">
          <label className="wide">What I {verb}<input value={f.what} onChange={set('what')} /></label>
          <label className="wide">What clicked<textarea rows={2} value={f.clicked} onChange={set('clicked')} /></label>
          <label className="wide">What was hard<textarea rows={2} value={f.hard} onChange={set('hard')} /></label>
          <label>Next<input value={f.next} onChange={set('next')} /></label>
          <label>Link (repo / demo)<input value={f.link} onChange={set('link')} /></label>
        </div>
      </Card>
      <div>
        <Card tilt={false} className="post-preview">
          <h3>Preview</h3>
          <pre>{post}</pre>
          <div className="row-btns">
            <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(post).then(() => notify('Copied. Paste into LinkedIn.'))}><Copy size={16} /> Copy</button>
            <button className="btn primary" onClick={() => { update((s) => { s.posts.push({ date, text: post }) }); notify('Logged as posted.') }}>I posted it</button>
          </div>
        </Card>
        <h3 className="sec">Post ideas</h3>
        <ul className="tips">{POST_IDEAS.map((t) => <li key={t}>{t}</li>)}</ul>
        <h3 className="sec">Posted · {state.posts.length}</h3>
        {[...state.posts].reverse().slice(0, 5).map((p, i) => <p key={i} className="log-row"><b>{fmt(p.date)}</b> {p.text.split('\n')[2]?.slice(0, 70)}</p>)}
      </div>
    </div>
  )
}

function Network() {
  const { notify } = useStore()
  return (
    <div className="cards-3">
      {NETWORK_TEMPLATES.map((t) => (
        <Card key={t.name} tilt={false}>
          <h3>{t.name}</h3>
          <p className="muted">{t.text}</p>
          <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(t.text).then(() => notify('Template copied. Replace the {braces}.'))}><Copy size={15} /> Copy</button>
        </Card>
      ))}
    </div>
  )
}
