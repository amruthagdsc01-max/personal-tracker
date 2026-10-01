import { useState } from 'react'
import { DatabaseBackup, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import { backupStatus } from '../domain/backup.js'

/** Gentle nudge for data that lives only in this browser. Hidden when logged in to a server account. */
export default function BackupReminder() {
  const { state, date, auth, backupNow } = useStore()
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('ezze/backupHide') === date } catch { return false } })
  const s = backupStatus(state, date)
  if (auth || hidden || !s.due) return null
  const hide = () => { setHidden(true); try { sessionStorage.setItem('ezze/backupHide', date) } catch { /* ignore */ } }
  return (
    <div className="backup-reminder" role="status">
      <DatabaseBackup size={22} />
      <span><b>{s.last ? `Last backup was ${s.daysSince} days ago.` : 'You have not backed up yet.'}</b><small>Your progress is saved only in this browser. One click saves a copy you can restore anywhere.</small></span>
      <button className="btn primary sm" onClick={backupNow}>Back up now</button>
      <button className="icon-btn" onClick={hide} aria-label="Remind me tomorrow"><X size={18} /></button>
    </div>
  )
}
