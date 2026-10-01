import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHead, Card, Chip, Ring, Bar } from '../components/ui.jsx'
import { ProblemRow } from '../components/blocks.jsx'
import { DSA_TOPICS } from '../data/dsa.js'
import { dsaStats, currentTopic } from '../domain/engine.js'

export default function DSA() {
  const { state, date } = useStore()
  const stats = dsaStats(state)
  const cur = currentTopic(state)
  const [open, setOpen] = useState(cur?.id)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const show = (p) => {
    const d = state.dsa[p.id] || {}
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false
    if (filter === 'unsolved') return !d.solved
    if (filter === 'solved') return d.solved
    if (filter === 'revisit') return d.revisit
    if (['E', 'M', 'H'].includes(filter)) return p.diff === filter
    return true
  }

  return (
    <>
      <PageHead script="Pattern by pattern" title="DSA Sheet" sub="Ordered like a course: fundamentals first, then trees, graphs and DP. At two problems a day, the first eight modules (the fundamentals most interviews lean on) take about 2.5 months and the whole sheet about 5–6 months. Interviews do not need all of it: depth in the early modules matters more than finishing everything." />
      <div className="dsa-top">
        <Card tilt={false} className="dsa-ring"><Ring pct={Math.round((stats.solved / stats.total) * 100)} size={150}><b>{stats.solved}</b><small>of {stats.total}</small></Ring>
          <div className="diffs">{[['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']].map(([k, l]) => <div key={k}><span className={`diff ${k}`}>{l}</span><b>{stats.diff[k][0]}/{stats.diff[k][1]}</b></div>)}<div><span className="diff">Revision</span><b>{stats.revisit}</b></div></div>
        </Card>
        <Card tilt={false} className="dsa-now">
          <small className="eyebrow-s">CURRENT MODULE</small>
          <h2>{cur?.name || 'Sheet complete'}</h2>
          {cur && <><p className="muted">{cur.blurb}</p><p><b>Learn first:</b> {cur.learn.join(' · ')}</p></>}
        </Card>
      </div>

      <div className="filters">
        <div className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems" aria-label="Search problems" /></div>
        {[['all', 'All'], ['unsolved', 'Unsolved'], ['solved', 'Solved'], ['revisit', 'Revision'], ['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']].map(([k, l]) => <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
      </div>

      <div className="topics">
        {DSA_TOPICS.map((t, i) => {
          const s = stats.byTopic[i]
          const list = t.problems.filter(show)
          if (!list.length && (q || filter !== 'all')) return null
          const isOpen = open === t.id || !!q
          return (
            <Card key={t.id} tilt={false} className={`topic ${isOpen ? 'open' : ''}`}>
              <button className="topic-head" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                <span className="topic-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="topic-name"><b>{t.name}</b><small>{s.solved}/{s.total} solved{t.side ? ' · side track (not in the daily plan)' : ''}</small></span>
                <span className="topic-bar"><Bar pct={s.pct} /></span>
                <ChevronDown size={20} className="chev" />
              </button>
              {isOpen && <div className="topic-body">{list.map((p) => <ProblemRow key={p.id} id={p.id} date={date} />)}</div>}
            </Card>
          )
        })}
      </div>
    </>
  )
}
