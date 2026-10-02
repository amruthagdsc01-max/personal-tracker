import { useState } from 'react'
import { useStore } from '../store.jsx'
import { PageHead, Card } from '../components/ui.jsx'
import { STATIC } from '../api.js'
import { backupStatus } from '../domain/backup.js'
import { fmt } from '../domain/dates.js'

export default function Settings() {
  const { state, update, reset, replace, notify, auth, logout, deleteAccount, sync, openAuth, backupNow, date } = useStore()
  const bs = backupStatus(state, date)
  const [busy, setBusy] = useState(false)
  const importJson = (e) => {
    const file = e.target.files[0]
    if (!file) return
    file.text().then((t) => { replace(JSON.parse(t)); notify('Backup restored.') }).catch(() => notify('That file could not be read.'))
  }
  const del = async () => {
    if (!window.confirm('Permanently delete your account and all saved progress? This cannot be undone.')) return
    setBusy(true)
    try { await deleteAccount() } catch (e) { notify(e.message); setBusy(false) }
  }

  return (
    <>
      <PageHead script="Make it yours" title="Settings" />
      <Card tilt={false} className="settings">
        <h2>{STATIC ? 'Where your progress lives' : 'Account'}</h2>
        {STATIC ? (
          <>
            <p>Your progress is saved <b>in this browser on this device</b>. It is private to you, works offline, and the site never sleeps. It does not sync to other devices, and clearing this browser’s site data would erase it — so back it up.</p>
            <p className={bs.due ? 'backup-warn' : 'muted'}>{bs.last ? `Last backup: ${fmt(bs.last, { day: 'numeric', month: 'long' })} (${bs.daysSince} day${bs.daysSince === 1 ? '' : 's'} ago).` : 'You have not made a backup yet.'}</p>
            <div className="form-actions"><button className="btn primary" onClick={backupNow}>Back up now</button><label className="btn ghost file">Restore from backup<input type="file" accept="application/json" onChange={importJson} hidden /></label></div>
            <p className="muted fine">Tip: save the backup file somewhere safe, like cloud storage or your email. To use ezze on a second device, restore the file there. Safari on iPhone can clear website data after about 7 days of not visiting, so back up more often if you use it.</p>
          </>
        ) : auth ? (
          <>
            <p>Logged in as <b>{auth.user.email}</b>. Progress is saved to the server ({sync === 'saved' ? 'up to date' : sync === 'saving' ? 'saving…' : 'offline — will retry'}).</p>
            <div className="form-actions"><button className="btn ghost" onClick={logout}>Log out</button><span style={{ flex: 1 }} /><button className="btn ghost danger" disabled={busy} onClick={del}>Delete account</button></div>
          </>
        ) : (
          <p>You are not logged in, so progress is stored on this device only. <button className="link" onClick={openAuth}>Log in or create an account</button> (optional) to keep it safe and use it on any device.</p>
        )}
      </Card>

      <Card tilt={false} className="settings" style={{ marginTop: 20 }}>
        <h2>Profile</h2>
        <label>Your name<input value={state.profile.name} onChange={(e) => update((s) => { s.profile.name = e.target.value })} /></label>
        <label>Start date (Day 1)<input type="date" value={state.profile.startDate || ''} onChange={(e) => update((s) => { s.profile.startDate = e.target.value })} /></label>
        <div className="form-actions">
          <button className="btn ghost" onClick={backupNow}>Export backup</button>
          <label className="btn ghost file">Import backup<input type="file" accept="application/json" onChange={importJson} hidden /></label>
          <span style={{ flex: 1 }} />
          <button className="btn ghost danger" onClick={() => window.confirm('Erase all progress and start over?') && reset()}>Reset progress</button>
        </div>
      </Card>
    </>
  )
}
