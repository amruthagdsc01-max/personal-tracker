import { useState } from 'react'
import { Plus, ArrowLeft, ExternalLink, Check, Trash2, Pencil, CalendarClock, ShieldCheck, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Card, Chip, Modal, Ring, Bar, Empty } from '../components/ui.jsx'
import { STYLES, buildChecklist, companyProgress, daysToInterview, extractRequirements, assess, newCompany, searchLinks } from '../domain/prep.js'
import { fmt } from '../domain/dates.js'

const STATUS = { covered: ['Covered', 'on'], partial: ['Partly covered', 'slow'], gap: ['Gap', 'behind'], outside: ['Outside your plan', 'start'] }
const countdown = (d) => (d === null ? null : d < 0 ? 'interview passed' : d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`)

export default function CompanyPrep({ go }) {
  const { state, update, date } = useStore()
  const [sel, setSel] = useState(null)
  const [form, setForm] = useState(null)
  const list = [...(state.companies || [])].sort((a, b) => (a.interviewDate || '9999').localeCompare(b.interviewDate || '9999'))
  const company = list.find((c) => c.id === sel)

  const save = (c) => {
    update((s) => {
      s.companies = s.companies || []
      const i = s.companies.findIndex((x) => x.id === c.id)
      if (i >= 0) s.companies[i] = c; else s.companies.push(c)
    })
    setForm(null)
    setSel(c.id)
  }

  if (company) return <Detail company={company} go={go} onBack={() => setSel(null)} onEdit={() => setForm(company)} form={form} setForm={setForm} save={save} />

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ maxWidth: 620 }}>Add a company you are preparing for. You get a checklist for its interview style that ticks itself from your real progress, and — if you paste the job posting — a check of what it asks for against what you can prove.</p>
        <button className="btn primary" onClick={() => setForm(newCompany(date))}><Plus size={18} /> Add company</button>
      </div>
      {!list.length && <Empty title="No companies yet">Add the company and role you are aiming for. Nothing is pre-filled: facts about the company come from the posting and the official page that you add.</Empty>}
      <div className="company-grid">
        {list.map((c) => {
          const p = companyProgress(c, state)
          const d = daysToInterview(c, date)
          return (
            <Card key={c.id} className="company-card" onClick={() => setSel(c.id)} role="button" tabIndex={0}>
              <div className="row-between"><div><h3>{c.name}</h3><small className="muted">{c.role || 'Role not set'}</small></div><Ring pct={p.pct} size={64} stroke={7}><b className="sm">{p.pct}%</b></Ring></div>
              <div className="stack"><Chip>{STYLES[c.style]?.label}</Chip>{d !== null && <Chip tone={d >= 0 && d <= 7 ? 'solid' : ''}><CalendarClock size={13} /> {countdown(d)}</Chip>}</div>
              <small className="muted">{p.done} of {p.total} done{p.next ? ` · next: ${p.next.text.slice(0, 54)}${p.next.text.length > 54 ? '…' : ''}` : ''}</small>
            </Card>
          )
        })}
      </div>
      {form && <CompanyForm initial={form} apps={state.applications} onClose={() => setForm(null)} onSave={save} />}
    </>
  )
}

function Detail({ company, go, onBack, onEdit, form, setForm, save }) {
  const { state, update, date, notify } = useStore()
  const sections = buildChecklist(company, state)
  const p = companyProgress(company, state)
  const d = daysToInterview(company, date)
  const reqs = extractRequirements(company.jd).map((k) => ({ k, a: assess(state, k) }))
  const covered = reqs.filter((r) => r.a.status === 'covered').length
  const [note, setNote] = useState({ text: '', source: '' })

  const patch = (fn) => update((s) => { fn(s.companies.find((c) => c.id === company.id)) })
  const toggle = (id) => patch((c) => { c.checks = c.checks || {}; c.checks[id] = !c.checks[id] })
  const addNote = (e) => {
    e.preventDefault()
    if (!note.text.trim()) return
    patch((c) => { c.notes = [...(c.notes || []), { text: note.text.trim(), source: note.source.trim(), date }] })
    setNote({ text: '', source: '' })
  }
  const remove = () => {
    if (!window.confirm(`Delete the ${company.name} preparation?`)) return
    update((s) => { s.companies = s.companies.filter((c) => c.id !== company.id) })
    onBack()
  }

  return (
    <>
      <button className="link" onClick={onBack}><ArrowLeft size={16} /> All companies</button>
      <Card tilt={false} className="company-head">
        <Ring pct={p.pct} size={110}><b>{p.pct}%</b><small>ready</small></Ring>
        <div className="company-meta">
          <small className="eyebrow-s">{STYLES[company.style]?.label.toUpperCase()}</small>
          <h2>{company.name}{company.role ? ` — ${company.role}` : ''}</h2>
          <p className="muted">{p.done} of {p.total} checklist items done{d !== null ? ` · interview ${countdown(d)} (${fmt(company.interviewDate)})` : ''}</p>
          <div className="row-btns">
            {company.url && <a className="btn ghost sm" href={company.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Job posting</a>}
            {company.officialUrl && <a className="btn ghost sm" href={company.officialUrl} target="_blank" rel="noreferrer"><ShieldCheck size={14} /> Official hiring page</a>}
            <button className="btn ghost sm" onClick={onEdit}><Pencil size={14} /> Edit</button>
            <button className="btn ghost sm danger" onClick={remove}><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </Card>

      <h2 className="sec">What the posting asks for</h2>
      {!reqs.length ? (
        <Card tilt={false}><p className="muted">{company.jd?.trim() ? 'No known technologies were spotted in the text you pasted.' : 'Paste the full job posting (Edit) and I will check each technology it mentions against your real progress.'}</p></Card>
      ) : (
        <Card tilt={false}>
          <p><b>{covered} of {reqs.length}</b> technologies mentioned are covered by what you have done so far.</p>
          <div className="req-list">
            {reqs.map(({ k, a }) => (
              <div key={k.label} className="req">
                <div className="req-main"><b>{k.label}</b><span className={`pill ${STATUS[a.status][1]}`}>{STATUS[a.status][0]}</span>{a.pct !== null && <Bar pct={a.pct} />}{a.note && <small className="muted">{a.note}</small>}</div>
                {k.to && a.status !== 'covered' && <button className="btn ghost sm" onClick={() => go(k.to)}>Open</button>}
              </div>
            ))}
          </div>
          <p className="muted fine">Matched by keyword from the text you pasted, so it can miss or over-match. Read the posting yourself too.</p>
        </Card>
      )}

      <h2 className="sec">Checklist</h2>
      <div className="check-sections">
        {sections.map((sec) => {
          const done = sec.items.filter((i) => i.done).length
          return (
            <Card key={sec.title} tilt={false} className="check-section">
              <div className="row-between"><h3>{sec.title}</h3><small className="muted">{done}/{sec.items.length}</small></div>
              <ul className="prep-list">
                {sec.items.map((it) => (
                  <li key={it.id} className={it.done ? 'done' : ''}>
                    <button className={`check ${it.done ? 'on' : ''}`} disabled={it.isAuto} onClick={() => toggle(it.id)} aria-label={it.text}>{it.done && <Check size={14} strokeWidth={3} />}</button>
                    <span>{it.text}{it.isAuto && <em className="auto-tag" title="Ticks itself from your progress">auto</em>}</span>
                    {it.to && !it.done && <button className="link" onClick={() => go(it.to)}>Open</button>}
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      <h2 className="sec">Your verified notes</h2>
      <Card tilt={false}>
        <p className="muted">Write down what you have confirmed yourself — the stages from the official page, what the recruiter said, the date and format. Add the source so you can trust it later.</p>
        {(company.notes || []).map((n, i) => (
          <div key={i} className="note"><div><p>{n.text}</p><small className="muted">{fmt(n.date)}{n.source && <> · source: {/^https?:/.test(n.source) ? <a href={n.source} target="_blank" rel="noreferrer">{n.source}</a> : n.source}</>}</small></div><button className="icon-btn" aria-label="Delete note" onClick={() => patch((c) => { c.notes.splice(i, 1) })}><X size={16} /></button></div>
        ))}
        <form className="note-form" onSubmit={addNote}>
          <textarea rows={2} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} placeholder="e.g. Round 1 is an online test with coding + aptitude; round 2 technical interview." />
          <input value={note.source} onChange={(e) => setNote({ ...note, source: e.target.value })} placeholder="Source (URL, or ‘recruiter email’)" />
          <button className="btn ghost sm">Add note</button>
        </form>
      </Card>

      <h2 className="sec">Look things up</h2>
      <Card tilt={false}>
        <p className="muted">These are search links, not facts about {company.name}. Candidate experiences are third-party, can be old, and vary a lot — treat them as hints and confirm with official sources.</p>
        <div className="row-btns">{searchLinks(company.name).map((l) => <a key={l.url} className="btn ghost sm" href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink size={13} /></a>)}</div>
      </Card>
      {form && <CompanyForm initial={form} apps={state.applications} onClose={() => setForm(null)} onSave={save} />}
    </>
  )
}

function CompanyForm({ initial, apps, onClose, onSave }) {
  const [f, setF] = useState(initial)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const link = (id) => {
    const a = apps.find((x) => x.id === id)
    if (!a) return setF({ ...f, applicationId: '' })
    return setF({ ...f, applicationId: id, name: f.name || a.company, role: f.role || a.role, url: f.url || a.url || '', jd: f.jd || a.requirements || '' })
  }
  return (
    <Modal title={initial.name ? 'Edit company' : 'Add company'} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) onSave({ ...f, name: f.name.trim() }) }}>
        {apps.length > 0 && <label className="wide">Fill from an application you already track<select value={f.applicationId} onChange={(e) => link(e.target.value)}><option value="">— none —</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.company} · {a.role}</option>)}</select></label>}
        <label>Company<input required value={f.name} onChange={set('name')} /></label>
        <label>Role<input value={f.role} onChange={set('role')} placeholder="Software Engineer Intern" /></label>
        <label className="wide">Interview style (picks your checklist)<select value={f.style} onChange={set('style')}>{Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.blurb}</option>)}</select></label>
        <label>Interview or deadline date<input type="date" value={f.interviewDate} onChange={set('interviewDate')} /></label>
        <label>Job posting URL<input value={f.url} onChange={set('url')} placeholder="https://…" /></label>
        <label className="wide">Official hiring-process page (optional)<input value={f.officialUrl} onChange={set('officialUrl')} placeholder="https://…careers…" /></label>
        <label className="wide">Job posting text (paste it all)<textarea rows={8} value={f.jd} onChange={set('jd')} placeholder="Paste the responsibilities and requirements here. I will spot the technologies and compare them with your progress." /></label>
        <div className="form-actions wide"><span style={{ flex: 1 }} /><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary">Save</button></div>
      </form>
    </Modal>
  )
}
