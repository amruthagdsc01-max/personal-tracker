import { useState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { FlowerBranch, ShadowBranch, WaxSeal, TapeStrip } from '../components/Floral.jsx'

export default function AuthScreen() {
  const { login, register, closeAuth } = useStore()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ email: '', password: '', name: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try { await (mode === 'login' ? login(f) : register(f)) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <ShadowBranch className="sb sb1" />
      <FlowerBranch className="auth-flowers" />
      <div className="auth-wrap">
        <div className="auth-art"><TapeStrip /><div className="auth-photo"><b>ezze</b><span>Learn daily.<br />Build proof.<br />Get hired.</span></div></div>
        <form className="auth-card" onSubmit={submit}>
          <small className="eyebrow-s">{mode === 'login' ? 'WELCOME BACK' : 'TAKES 10 SECONDS'}</small>
          <h1>{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
          <p className="muted">Optional. Log in to keep your progress safe and use it on any device. The app works fine without it.</p>
          {mode === 'register' && <label>Name (optional)<input autoComplete="name" value={f.name} onChange={set('name')} placeholder="Amrutha" /></label>}
          <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></label>
          <label>Password<input type="password" required minLength={mode === 'register' ? 6 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} placeholder={mode === 'register' ? 'At least 6 characters' : ''} /></label>
          {err && <p className="form-error" role="alert">{err}</p>}
          <button className="btn primary" disabled={busy}>{mode === 'login' ? <><LogIn size={18} /> Log in</> : <><UserPlus size={18} /> Create account</>}</button>
          <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}</button>
          <hr />
          <button type="button" className="btn ghost" onClick={closeAuth}>Not now — use the app without logging in</button>
        </form>
      </div>
      <WaxSeal className="auth-seal" size={110} />
    </div>
  )
}
