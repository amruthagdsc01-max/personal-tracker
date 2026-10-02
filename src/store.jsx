import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { emptyState } from './domain/model.js'
import { today, addDays } from './domain/dates.js'
import { makePlan } from './domain/engine.js'
import { api, ApiError, loadAuth, saveAuth } from './api.js'
import { downloadBackup } from './backup.js'

const GUEST_KEY = 'ezze/v1'
const Ctx = createContext(null)

const cacheKey = (auth) => (auth ? `ezze/u${auth.user.id}` : GUEST_KEY)
function loadLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return { ...emptyState(), ...JSON.parse(raw) }
  } catch { /* blocked or corrupt storage */ }
  return null
}

/** Daily housekeeping: start date, and a fixed plan for today (so it doesn't shift as you finish things). */
export function rollover(state, date) {
  const s = structuredClone(state)
  if (!s.profile.startDate) s.profile.startDate = date
  if (!s.plans[date]) s.plans[date] = makePlan(s, date)
  return s
}

export function StoreProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth)
  const [authOpen, setAuthOpen] = useState(false)
  const [state, setState] = useState(() => rollover(loadLocal(cacheKey(loadAuth())) || emptyState(), today()))
  const [ready, setReady] = useState(() => !loadAuth()) // accounts wait for the first server pull
  const [sync, setSync] = useState('idle') // idle | saving | saved | offline
  const [toast, setToast] = useState(null)
  const timer = useRef()
  const rev = useRef(0)
  const lastSaved = useRef(null)

  const notify = useCallback((msg) => { setToast(msg); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 2800) }, [])
  const update = useCallback((fn) => setState((prev) => { const next = structuredClone(prev); fn(next); return next }), [])

  const logout = useCallback((message) => {
    setAuth((a) => { if (a) { try { localStorage.removeItem(cacheKey(a)) } catch { /* ignore */ } } return null })
    saveAuth(null)
    // back to the progress kept on this device (if any)
    setState(rollover(loadLocal(GUEST_KEY) || emptyState(), today()))
    rev.current = 0
    lastSaved.current = null
    setReady(true)
    if (message) notify(message)
  }, [notify])

  // cache locally (per account) so the app opens instantly and survives short outages
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(cacheKey(auth), JSON.stringify(state)) } catch { /* ignore */ }
  }, [state, ready, auth])

  // pull from the server once per login
  useEffect(() => {
    if (!auth) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const r = await api('/state', { token: auth.token })
        if (cancelled) return
        if (r.data) {
          rev.current = r.rev
          lastSaved.current = JSON.stringify(r.data)
          setState(rollover({ ...emptyState(), ...r.data }, today()))
        } else {
          // first login on this account: keep whatever progress was already made as a guest
          const guestData = loadLocal(GUEST_KEY)
          if (guestData) setState(rollover(guestData, today()))
        }
        setSync('saved')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) logout('Session expired. Please log in again.')
        else setSync('offline')
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [auth, logout])

  // push changes to the server (debounced)
  useEffect(() => {
    if (!auth || !ready) return undefined
    const json = JSON.stringify(state)
    if (json === lastSaved.current) return undefined
    setSync('saving')
    const t = setTimeout(async () => {
      try {
        const r = await api('/state', { method: 'PUT', token: auth.token, body: { data: state, base_rev: rev.current || undefined } })
        rev.current = r.rev
        lastSaved.current = json
        setSync('saved')
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && e.detail?.data) {
          rev.current = e.detail.rev
          lastSaved.current = JSON.stringify(e.detail.data)
          setState(rollover({ ...emptyState(), ...e.detail.data }, today()))
          notify('Newer progress from another device was loaded.')
          setSync('saved')
        } else if (e instanceof ApiError && e.status === 401) logout('Session expired. Please log in again.')
        else setSync('offline')
      }
    }, 900)
    return () => clearTimeout(t)
  }, [state, auth, ready, logout, notify])

  // ask the browser not to evict our data when storage is tight (harmless if refused)
  useEffect(() => { try { navigator.storage?.persist?.() } catch { /* ignore */ } }, [])

  // retry after the connection returns; also create today's plan if the tab stayed open past midnight
  useEffect(() => {
    const check = () => setState((prev) => (prev.plans[today()] ? prev : rollover(prev, today())))
    const online = () => setState((p) => ({ ...p }))
    window.addEventListener('focus', check)
    window.addEventListener('online', online)
    document.addEventListener('visibilitychange', check)
    return () => { window.removeEventListener('focus', check); window.removeEventListener('online', online); document.removeEventListener('visibilitychange', check) }
  }, [])

  const authenticate = useCallback(async (mode, form) => {
    const r = await api(`/auth/${mode}`, { method: 'POST', body: form })
    saveAuth(r)
    setReady(false)
    setAuth(r)
    setAuthOpen(false)
  }, [])

  const api2 = useMemo(() => {
    const date = today()
    return {
      state, update, notify, toast, date, auth, ready, sync, authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      login: (form) => authenticate('login', form),
      register: (form) => authenticate('register', form),
      logout: () => logout('Logged out.'),
      deleteAccount: async () => { await api('/account', { method: 'DELETE', token: auth.token }); logout('Account deleted.') },
      backupNow: () => { downloadBackup(state, date); update((s) => { s.profile.lastBackup = date }); notify('Backup saved to your downloads.') },
      reset: () => { setState(rollover(emptyState(), today())); notify('Fresh start.') },
      replace: (data) => setState(rollover({ ...emptyState(), ...data }, today())),
      setMode: (d, mode) => update((s) => { if (mode === 'full') delete s.dayTypes[d]; else s.dayTypes[d] = mode }),
      solve: (id, { revisit = false } = {}) => update((s) => {
        const o = s.dsa[id] || {}
        s.dsa[id] = { ...o, solved: true, revisit, date: o.solved ? o.date : date, lastDone: date, skipUntil: undefined }
      }),
      reviewed: (id, again) => update((s) => { Object.assign(s.dsa[id], { revisit: !!again, date, reviewedOn: date, lastDone: date }) }),
      unsolve: (id) => update((s) => { delete s.dsa[id] }),
      skipProblem: (id) => update((s) => { s.dsa[id] = { ...(s.dsa[id] || {}), skipUntil: addDays(date, 2) } }),
      toggleRevisit: (id) => update((s) => { const o = s.dsa[id] || {}; s.dsa[id] = { ...o, revisit: !o.revisit } }),
      setNote: (id, note) => update((s) => { s.dsa[id] = { ...(s.dsa[id] || {}), note } }),
      finishLesson: (id) => update((s) => { if (s.lessons[id]) delete s.lessons[id]; else s.lessons[id] = date }),
      finishStep: (id) => update((s) => { if (s.steps[id]) delete s.steps[id]; else s.steps[id] = date }),
    }
  }, [state, update, notify, toast, auth, ready, sync, authOpen, authenticate, logout])

  return <Ctx.Provider value={api2}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
