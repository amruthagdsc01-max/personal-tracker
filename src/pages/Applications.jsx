import { useState } from 'react'
import { Plus, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Card, Modal, Empty } from '../components/ui.jsx'
import { STATUSES, STATUS_LABEL } from '../domain/model.js'
import { appBuckets, uid } from '../domain/engine.js'
import { fmt } from '../domain/dates.js'

const blank = (date) => ({ company: '', role: '', location: '', mode: 'On-site', url: '', posted: '', deadline: '', resume: 'v1', referral: '', contact: '', followUp: '', requirements: '', matched: '', missing: '', why: '', gap: '', notes: '', verified: false, discovered: date })

export default function Applications() {
  const { state, update, date, notify } = useStore()
  const [edit, setEdit] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [over, setOver] = useState(null)
  const b = appBuckets(state, date)

  const move = (id, status) => update((s) => {
    const a = s.applications.find((x) => x.id === id)
    if (!a || a.status === status) return
    a.status = status
    a.log = [...(a.log || []), { status, date }]
    if (status === 'applied') { a.applied = date; if (!a.followUp) { const d = new Date(); d.setDate(d.getDate() + 7); a.followUp = d.toISOString().slice(0, 10) } }
  })

  const save = (form) => {
    update((s) => {
      if (form.id) Object.assign(s.applications.find((a) => a.id === form.id), form)
      else s.applications.push({ ...form, id: uid(), status: 'discovered', log: [{ status: 'discovered', date }] })
    })
    setEdit(null)
    notify('Saved.')
  }

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}><p className="muted" style={{ maxWidth: 560 }}>Drag cards across the pipeline. Mark a role verified only after you have opened the posting yourself.</p><button className="btn primary" onClick={() => setEdit(blank(date))}><Plus size={18} /> Add role</button></div>

      <div className="buckets">
        {[['New today', b.newToday], ['Posted this week', b.thisWeek], ['Deadline soon', b.deadlineSoon], ['Follow-up due', b.followUp]].map(([l, arr]) => (
          <Card key={l} tilt={false} className="bucket"><b>{arr.length}</b><small>{l}</small></Card>
        ))}
      </div>

      {!state.applications.length && <Empty title="No roles tracked yet">Add real postings you have found. Nothing here is pre-filled or invented — every card is one you add and verify.</Empty>}

      <div className="kanban">
        {STATUSES.map((st) => {
          const cards = state.applications.filter((a) => a.status === st)
          return (
            <div key={st} className={`col ${over === st ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(st) }} onDragLeave={() => setOver(null)} onDrop={() => { if (dragId) move(dragId, st); setDragId(null); setOver(null) }}>
              <h3>{STATUS_LABEL[st]} <span>{cards.length}</span></h3>
              {cards.map((a) => (
                <div key={a.id} className="app-card" draggable onDragStart={() => setDragId(a.id)} onDragEnd={() => { setDragId(null); setOver(null) }} onClick={() => setEdit(a)}>
                  <b>{a.company || 'Untitled'}</b><span>{a.role}</span>
                  <small>{[a.location, a.mode].filter(Boolean).join(' · ')}</small>
                  {a.deadline && <small>Deadline {fmt(a.deadline)}</small>}
                  {a.verified && <em><ShieldCheck size={13} /> verified</em>}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {edit && <AppForm initial={edit} onClose={() => setEdit(null)} onSave={save} onDelete={() => { update((s) => { s.applications = s.applications.filter((a) => a.id !== edit.id) }); setEdit(null) }} />}
    </>
  )
}

function AppForm({ initial, onClose, onSave, onDelete }) {
  const [f, setF] = useState(initial)
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const T = (k, label, type = 'text') => <label>{label}<input type={type} value={f[k] || ''} onChange={set(k)} /></label>
  const A = (k, label) => <label className="wide">{label}<textarea rows={2} value={f[k] || ''} onChange={set(k)} /></label>
  return (
    <Modal title={f.id ? 'Edit role' : 'Add role'} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); onSave(f) }}>
        {T('company', 'Company')}{T('role', 'Role')}{T('location', 'Location')}
        <label>Work mode<select value={f.mode} onChange={set('mode')}><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
        <label className="wide">Job URL<input value={f.url || ''} onChange={set('url')} placeholder="https://…" /></label>
        {T('posted', 'Date posted', 'date')}{T('deadline', 'Deadline', 'date')}{T('followUp', 'Follow-up on', 'date')}{T('resume', 'Resume version')}
        {T('referral', 'Referral')}{T('contact', 'Contact')}
        {A('requirements', 'Requirements (paste from the posting)')}
        {T('matched', 'Skills matched (comma separated)')}{T('missing', 'Skills missing')}
        {A('why', 'Why this role fits me')}{A('gap', 'What I am missing')}{A('notes', 'Notes')}
        <label className="check-line wide"><input type="checkbox" checked={!!f.verified} onChange={set('verified')} /> I opened the posting and it is real and currently open</label>
        <div className="form-actions wide">
          {f.id && <button type="button" className="btn ghost danger" onClick={onDelete}><Trash2 size={16} /> Delete</button>}
          {f.url && <a className="btn ghost" href={f.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open</a>}
          <span style={{ flex: 1 }} /><button className="btn primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}
