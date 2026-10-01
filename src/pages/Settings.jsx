import { useState } from 'react'
import { useStore } from '../store.jsx'
import { PageHead, Card } from '../components/ui.jsx'

export default function Settings() {
  const { state, update, reset, replace, notify, auth, logout, deleteAccount, sync, openAuth } = useStore()
  const [busy, setBusy] = useState(false)
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: 'ezze-backup.json' }).click()
    URL.revokeObjectURL(url)
  }
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
        <h2>Account</h2>
        {auth ? (
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
          <button className="btn ghost" onClick={exportJson}>Export backup</button>
          <label className="btn ghost file">Import backup<input type="file" accept="application/json" onChange={importJson} hidden /></label>
          <span style={{ flex: 1 }} />
          <button className="btn ghost danger" onClick={() => window.confirm('Erase all progress and start over?') && reset()}>Reset progress</button>
        </div>
      </Card>
    </>
  )
}
