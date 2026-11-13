import { useMemo, useState } from 'react'
import { Search, Lock } from 'lucide-react'
import { LESSONS, BY_ID, STAGES, TIERS, allPrereqs, dependents } from '../../data/sd/index.js'
import { mapLayout, mastery, searchLessons, prereqsMet, quizPassed, lessonRec } from '../../domain/sd/engine.js'
import { sdGo } from './useSd.js'

const MCOLOR = ['var(--sd-line)', 'var(--sd-amber)', 'var(--sd-rose)', 'var(--sd-moss)', 'var(--sd-moss)', 'var(--sd-ink)']

function DepMap({ S, focus, setFocus }) {
  const { pos, edges, width, height } = useMemo(mapLayout, [])
  const chain = useMemo(() => (focus ? new Set([focus, ...allPrereqs(focus), ...allDeps(focus)]) : null), [focus])
  const W = width + 40, H = height + 56
  return (
    <div className="map-wrap">
      <svg viewBox={`-10 -34 ${W} ${H}`} className="depmap" role="group" aria-label="Concept dependency map. Select a concept to highlight what it needs and what it unlocks.">
        {STAGES.slice(0, 5).map((s) => <text key={s.id} x={(s.id - 1) * 260} y={-14} className="col-h">{s.id}. {s.name.toUpperCase()}</text>)}
        {edges.map(([a, b]) => { const A = pos[a], B = pos[b], on = chain && chain.has(a) && chain.has(b); const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2, mx = (x1 + x2) / 2
          return <path key={`${a}-${b}`} d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} className={`edge ${on ? 'on' : chain ? 'dim' : ''}`} fill="none" /> })}
        {LESSONS.map((l) => { const p = pos[l.id], m = mastery(S.sd, l.id, S.date), dim = chain && !chain.has(l.id)
          return (
            <g key={l.id} className={`node ${dim ? 'dim' : ''} ${focus === l.id ? 'sel' : ''}`} transform={`translate(${p.x} ${p.y})`} tabIndex={0} role="button" aria-label={`${l.title}, ${m.label}`}
              onClick={() => setFocus(focus === l.id ? null : l.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(focus === l.id ? null : l.id) } }}>
              <rect width={p.w} height={p.h} rx="2" />
              <rect width="5" height={p.h} fill={MCOLOR[m.id]} className="sd-bar" />
              <foreignObject x="12" y="6" width={p.w - 18} height={p.h - 10}><div className="nd"><b>{l.title}</b><small>{m.label}</small></div></foreignObject>
            </g>)
        })}
      </svg>
    </div>
  )
}
const allDeps = (id, seen = new Set()) => { for (const d of dependents(id)) if (!seen.has(d)) { seen.add(d); allDeps(d, seen) } return [...seen] }

export default function Path({ S }) {
  const { sd, date } = S
  const [q, setQ] = useState('')
  const [stage, setStage] = useState(0)
  const [tier, setTier] = useState('')
  const [focus, setFocus] = useState(null)
  const results = q.trim() ? searchLessons(q, { stage, tier }) : null
  const list = LESSONS.filter((l) => (!stage || l.stage === stage) && (!tier || l.tier === tier))
  const fl = focus ? BY_ID[focus] : null

  return (
    <div className="path">
      <header className="p-head">
        <p className="kicker">The path</p>
        <h1>Every concept, and what it depends on.</h1>
        <p className="lede">Each lesson needs the ones to its left. Select a concept to light up exactly what it requires and what it unlocks. Bar colour shows your real mastery.</p>
      </header>

      <DepMap S={S} focus={focus} setFocus={setFocus} />
      {fl && (
        <div className="map-focus" role="status">
          <b>{fl.title}</b>
          <span>Needs: {fl.prereq.length ? fl.prereq.map((p) => BY_ID[p].title).join(', ') : 'nothing, a starting point'}</span>
          <span>Unlocks: {dependents(fl.id).length ? dependents(fl.id).map((p) => BY_ID[p].title).join(', ') : 'interview practice'}</span>
          <button className="btn primary sm" onClick={() => sdGo(`lesson/${fl.id}`)}>Open lesson</button>
        </div>
      )}
      <ul className="sd-legend" aria-label="Mastery colours">{['Not started', 'Learning', 'Needs revision', 'Can explain', 'Can apply', 'Interview ready'].map((n, i) => <li key={n}><i style={{ background: MCOLOR[i] }} />{n}</li>)}</ul>

      <section className="finder" aria-labelledby="find-h">
        <h2 id="find-h">Find and filter</h2>
        <div className="sd-filters">
          <label className="sd-search"><Search size={16} /><span className="sr">Search lessons</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all lessons: cache stampede, CAP, idempotency…" /></label>
          <label><span className="sr">Stage</span><select value={stage} onChange={(e) => setStage(+e.target.value)}><option value={0}>All stages</option>{STAGES.slice(0, 5).map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}</select></label>
          <label><span className="sr">Priority</span><select value={tier} onChange={(e) => setTier(e.target.value)}><option value="">All priorities</option>{Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        </div>
        {results ? (
          results.length === 0 ? <p className="empty">No lessons match "{q}". Try a broader word such as "cache", "queue" or "consistency".</p> : (
            <ol className="rows hits">{results.map(({ lesson: l, snippet }) => <li key={l.id}><div><button className="link" onClick={() => sdGo(`lesson/${l.id}`)}>{l.title}</button><small>Stage {l.stage} · {TIERS[l.tier].label}</small><p>{snippet}</p></div></li>)}</ol>
          )
        ) : (
          STAGES.slice(0, 5).filter((s) => !stage || s.id === stage).map((s) => {
            const items = list.filter((l) => l.stage === s.id)
            if (!items.length) return null
            return (
              <div key={s.id} className="stage-block">
                <h3><span className="n">{s.id}</span> {s.name} <small>{s.blurb}</small></h3>
                <ol className="sd-lessons">
                  {items.map((l) => { const m = mastery(sd, l.id, date), ok = prereqsMet(sd, l.id); return (
                    <li key={l.id}>
                      <button onClick={() => sdGo(`lesson/${l.id}`)}>
                        <span className="t"><b>{l.title}</b><small>{TIERS[l.tier].label} · {l.minutes} min</small></span>
                        <span className={`m m${m.id}`}>{!ok && m.id === 0 ? <><Lock size={12} /> needs earlier lessons</> : m.label}{quizPassed(lessonRec(sd, l.id)) ? ' ✓' : ''}</span>
                      </button>
                    </li>) })}
                </ol>
              </div>)
          })
        )}
      </section>
    </div>
  )
}
