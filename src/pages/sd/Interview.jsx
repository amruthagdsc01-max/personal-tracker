import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { BY_ID, PROBLEMS, TRADEOFF_QS, CASES, STAGES, interviewBank } from '../../data/sd/index.js'
import { Evaluator } from '../../components/sd/parts.jsx'
import { MockRun } from './Mock.jsx'
import { sdGo } from './useSd.js'

const BANK = interviewBank(TRADEOFF_QS)
const TABS = [['bank', 'Question bank'], ['mock', 'Mock interview'], ['cases', 'Real-world cases']]

function Bank({ S, qid }) {
  const [level, setLevel] = useState('')
  const [stage, setStage] = useState(0)
  const [only, setOnly] = useState('all')
  const [open, setOpen] = useState(qid || null)
  const items = useMemo(() => BANK.filter((q) => (!level || q.level === level) && (!stage || (q.lessonId && BY_ID[q.lessonId].stage === stage)) && (only === 'all' || (only === 'todo' ? !S.sd.iq[q.id] && !(q.lessonId && S.sd.les[q.lessonId]?.intv && q.id === `iq-${q.lessonId}`) : !!S.sd.iq[q.id]))), [level, stage, only, S.sd.iq, S.sd.les])
  return (
    <>
      <div className="sd-filters"><label><span className="sr">Difficulty</span><select value={level} onChange={(e) => setLevel(e.target.value)}><option value="">All difficulties</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label><span className="sr">Stage</span><select value={stage} onChange={(e) => setStage(+e.target.value)}><option value={0}>All topics</option>{STAGES.slice(0, 5).map((s) => <option key={s.id} value={s.id}>Stage {s.id}: {s.name}</option>)}</select></label>
        <label><span className="sr">Status</span><select value={only} onChange={(e) => setOnly(e.target.value)}><option value="all">All</option><option value="todo">Not yet answered</option><option value="done">Answered</option></select></label></div>
      {items.length === 0 ? <p className="empty">No questions match these filters.</p> : (
        <ol className="qlist">{items.map((q) => { const rec = S.sd.iq[q.id]; const ev = q.lessonId && q.id === `iq-${q.lessonId}` ? S.sd.les[q.lessonId]?.intv : null; const done = rec || ev; return (
          <li key={q.id} id={q.id}>
            <button className="qhead" aria-expanded={open === q.id} onClick={() => setOpen(open === q.id ? null : q.id)}><span className={`sd-lvl ${q.level}`}>{q.level}</span><span>{q.q}</span>{done && <em>{Math.round(done.cov * 100)}%</em>}</button>
            {open === q.id && (<div className="qbody">
              {q.lessonId && <p className="muted">Topic: <button className="link" onClick={() => sdGo(`lesson/${q.lessonId}`)}>{BY_ID[q.lessonId].title}</button></p>}
              <Evaluator prompt="Answer as if speaking to an interviewer: structure it, give reasons and name trade-offs." points={q.points} model={q.model} initial={done} saveLabel="Save this answer"
                onSave={(c, t, cov) => { S.saveBank(q.id, cov, t); if (q.lessonId && q.id === `iq-${q.lessonId}`) S.saveEvidence(q.lessonId, 'intv', c, t) }} />
            </div>)}
          </li>) })}</ol>)}
    </>
  )
}

function Mock({ S }) {
  const [pid, setPid] = useState(null)
  const hist = S.sd.mocks.slice().reverse().slice(0, 8)
  const problem = PROBLEMS.find((p) => p.id === pid)
  if (problem) return <><button className="link back" onClick={() => setPid(null)}>← Choose another problem</button><h2>{problem.title}</h2><MockRun key={problem.id} problem={problem} S={S} /></>
  return (
    <>
      <p className="lede">A mock interview is unguided: you get a prompt and a clock, and write your whole design across the eight dimensions interviewers score. Then you check yourself against what a strong answer contains.</p>
      <ol className="lab-list">{PROBLEMS.map((p, i) => <li key={p.id}><button onClick={() => setPid(p.id)}><span className="n">{String(i + 1).padStart(2, '0')}</span><span><b>{p.title}</b><small>{p.level} · {p.prompt.slice(0, 90)}…</small></span><em>{S.sd.mocks.filter((m) => m.problemId === p.id).length} attempts</em></button></li>)}</ol>
      <h3>Past mocks</h3>
      {hist.length === 0 ? <p className="empty">No mock interviews yet. Your first score will appear here, and counts toward interview readiness.</p> : <ul className="rows">{hist.map((m, i) => <li key={i}><span>{PROBLEMS.find((p) => p.id === m.problemId)?.title}</span><small>{m.date} · {m.pct}% · {Math.round(m.seconds / 60)} min</small></li>)}</ul>}
    </>
  )
}

function Cases() {
  return (
    <>
      <p className="lede">Real systems are the best teachers once you know the vocabulary. Read the primary source, then answer the question before checking whether you agree with the engineers.</p>
      <ol className="cases">{CASES.map((c) => <li key={c.id}><p className="kicker">{c.company}</p><h3>{c.title}</h3><p>{c.takeaway}</p><p className="ask"><b>Think:</b> {c.ask}</p><div className="row"><a href={c.link.url} target="_blank" rel="noopener noreferrer">{c.link.label} <ExternalLink size={13} /></a><button className="link" onClick={() => sdGo(`lesson/${c.topic in BY_ID ? c.topic : 'framework'}`)}>Related lesson</button></div></li>)}</ol>
    </>
  )
}

export default function Interview({ S, arg }) {
  const [tab, setTab] = useState(arg && arg.startsWith('iq-') ? 'bank' : 'bank')
  return (
    <div className="sd-interview">
      <header className="p-head"><p className="kicker">Interview mode</p><h1>Say it clearly, defend it calmly.</h1><p className="lede">Knowing it and explaining it under pressure are different skills. Practise the second one here.</p></header>
      <div className="tabs2" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'bank' && <Bank S={S} qid={arg && arg.startsWith('iq-') ? arg : null} />}
      {tab === 'mock' && <Mock S={S} />}
      {tab === 'cases' && <Cases />}
    </div>
  )
}
