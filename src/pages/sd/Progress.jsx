import { useState } from 'react'
import { Trash2, ExternalLink } from 'lucide-react'
import { BY_ID, LESSONS, MASTERY, STAGES, LIBRARY, TIERS } from '../../data/sd/index.js'
import { mastery, readiness, stageProgress, weakTopics, lessonRec, lastQuiz, streakInfo, weekInfo } from '../../domain/sd/engine.js'
import { sdGo } from './useSd.js'

export default function Progress({ S }) {
  const { sd, date } = S
  const rd = readiness(sd, date)
  const rows = LESSONS.map((l) => ({ l, m: mastery(sd, l.id, date), r: lessonRec(sd, l.id) }))
  const counts = MASTERY.map((m) => rows.filter((x) => x.m.id === m.id).length)
  const history = LESSONS.flatMap((l) => lessonRec(sd, l.id).quizzes.map((q) => ({ ...q, id: l.id }))).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12)
  const weak = weakTopics(sd, date)
  const stages = stageProgress(sd, date)
  const si = streakInfo(sd, date), wk = weekInfo(sd, date)
  const notes = Object.entries(sd.notes)
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="prog">
      <header className="p-head"><p className="kicker">Progress</p><h1>What you can actually do.</h1>
        <p className="lede">Mastery is earned with evidence: quizzes, your own explanations, applied scenarios and spaced reviews. Nothing here is estimated or padded.</p></header>

      <section className="mastery" aria-labelledby="ms-h">
        <h2 id="ms-h">Mastery tracker</h2>
        <ul className="mbar" aria-label="Lessons by mastery level">{MASTERY.map((m, i) => <li key={m.id} className={`m${m.id}`}><b>{counts[i]}</b><span>{m.label}</span></li>)}</ul>
        <table className="mtable">
          <caption className="sr">Mastery for each lesson</caption>
          <thead><tr><th>Concept</th><th>Mastery</th><th>Last quiz</th><th>Explained</th><th>Applied</th><th>Next review</th></tr></thead>
          <tbody>{rows.map(({ l, m, r }) => { const q = lastQuiz(r); return (
            <tr key={l.id}>
              <td><button className="link" onClick={() => sdGo(`lesson/${l.id}`)}>{l.title}</button><small>{TIERS[l.tier].label}</small></td>
              <td><span className={`sd-pill m${m.id}`}>{m.label}</span></td>
              <td>{q ? `${q.score}/${q.total}` : '–'}</td><td>{r.expl ? `${Math.round(r.expl.cov * 100)}%` : '–'}</td><td>{r.appl ? `${Math.round(r.appl.cov * 100)}%` : '–'}</td><td>{r.srs?.due || '–'}</td>
            </tr>) })}</tbody>
        </table>
      </section>

      <div className="t-cols">
        <section aria-labelledby="rd-h">
          <h2 id="rd-h">Interview readiness: {rd.pct}%</h2>
          <p className="muted">{rd.mocks ? `Lessons ${rd.lessons}% (weighted by priority), recent mock interviews ${rd.mock}%.` : `Based on lesson mastery (${rd.lessons}%), weighted: Must learn counts most. Mock interviews add evidence once you do them.`}</p>
          <ul className="rows">{stages.slice(0, 5).map((s) => <li key={s.id}><span>{s.id}. {s.name}</span><small>{s.understood}/{s.total} passed · {s.mastered} explained{s.assessed ? ` · assessed ${s.assessed.pct}%` : ''}</small></li>)}</ul>
        </section>
        <section aria-labelledby="rh-h">
          <h2 id="rh-h">Rhythm</h2>
          <ul className="rows"><li><span>Current streak</span><small>{si.streak} days (longest {si.longest})</small></li><li><span>Days studied</span><small>{si.total}</small></li><li><span>This week</span><small>{wk.count} of {wk.goal} days</small></li><li><span>Last study day</span><small>{si.last || 'not yet'}</small></li></ul>
          <p className="muted">Missed days never reset your mastery or reviews.</p>
        </section>
      </div>

      <section aria-labelledby="wk-h">
        <h2 id="wk-h">Weak topics</h2>
        {weak.length === 0 ? <p className="empty">No weak topics yet. After a low quiz score, the topic and its likely prerequisite gap show up here.</p> :
          <ul className="rows">{weak.map((w) => <li key={w.id}><button className="link" onClick={() => sdGo(`lesson/${w.id}`)}>{BY_ID[w.id].title}</button><small>{w.weakPre.length ? `revise first: ${w.weakPre.map((p) => BY_ID[p].title).join(', ')}` : `${w.lapses} lapses`}</small></li>)}</ul>}
      </section>

      <section aria-labelledby="qh-h">
        <h2 id="qh-h">Quiz history</h2>
        {history.length === 0 ? <p className="empty">No quizzes taken yet. Finish a lesson\'s four checkpoints, then take its quiz.</p> :
          <ul className="rows">{history.map((q, i) => <li key={i}><button className="link" onClick={() => sdGo(`lesson/${q.id}`)}>{BY_ID[q.id].title}</button><small>{q.date} · {q.score}/{q.total}</small></li>)}</ul>}
      </section>

      <div className="t-cols">
        <section aria-labelledby="bm-h">
          <h2 id="bm-h">Bookmarks</h2>
          {sd.bm.length === 0 ? <p className="empty">Nothing bookmarked. Use the bookmark button on any lesson.</p> : <ul className="rows">{sd.bm.map((id) => <li key={id}><button className="link" onClick={() => sdGo(`lesson/${id}`)}>{BY_ID[id].title}</button><button className="icon-btn" aria-label={`Remove bookmark ${BY_ID[id].title}`} onClick={() => S.toggleBookmark(id)}><Trash2 size={15} /></button></li>)}</ul>}
        </section>
        <section aria-labelledby="nt-h">
          <h2 id="nt-h">My notes</h2>
          {notes.length === 0 ? <p className="empty">No notes yet. Write 3 lines per lesson in your own words.</p> : <ul className="notes">{notes.map(([id, t]) => <li key={id}><button className="link" onClick={() => sdGo(`lesson/${id}`)}>{BY_ID[id]?.title || id}</button><p>{t}</p></li>)}</ul>}
        </section>
      </div>

      <section aria-labelledby="lib-h">
        <h2 id="lib-h">The reading list, and why each is here</h2>
        <p className="muted">Curated, not collected. Interviews reward understanding trade-offs, not memorising a tool list. Learning for interviews means a repeatable method and communication; understanding production means failure modes, operations and cost. This platform trains both: lessons build the reasoning, the interview tab trains the delivery.</p>
        <ul className="refs">{LIBRARY.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} <ExternalLink size={13} /></a><span><b>{TIERS[x.tier].label}.</b> {x.why}</span></li>)}</ul>
      </section>

      <section className="danger" aria-labelledby="rs-h">
        <h2 id="rs-h">Start over</h2>
        <p className="muted">Clears only your System Design progress, notes and bookmarks. Other sections are untouched. Use Settings → Back up now first if you might want it back.</p>
        {!confirm ? <button className="btn ghost sm" onClick={() => setConfirm(true)}>Reset System Design progress</button> : <div className="row"><b>Really delete it all?</b><button className="btn danger sm" onClick={() => { S.reset(); setConfirm(false); S.notify('System Design progress cleared.') }}>Yes, delete</button><button className="btn ghost sm" onClick={() => setConfirm(false)}>Cancel</button></div>}
      </section>
    </div>
  )
}
