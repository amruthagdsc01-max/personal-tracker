import { useEffect, useState } from 'react'
import { Home as HomeIcon, CalendarCheck, Code2, BookOpen, Hammer, Dumbbell, Mic2, Briefcase, BarChart3, Settings as Cog, Search, Cloud, CloudOff, Loader2, LogIn, CalendarDays } from 'lucide-react'
import { useStore } from './store.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import { ShadowBranch, FlowerBranch } from './components/Floral.jsx'
import HomePage from './pages/Home.jsx'
import Today from './pages/Today.jsx'
import DSA from './pages/DSA.jsx'
import Learn from './pages/Learn.jsx'
import Build from './pages/Build.jsx'
import Practice from './pages/Practice.jsx'
import Mock from './pages/Mock.jsx'
import Career from './pages/Career.jsx'
import Progress from './pages/Progress.jsx'
import Settings from './pages/Settings.jsx'
import AuthScreen from './pages/AuthScreen.jsx'
import CalendarPanel from './components/CalendarPanel.jsx'

const PAGES = [
  { id: 'home', label: 'Home', icon: HomeIcon, C: HomePage },
  { id: 'today', label: 'Today', icon: CalendarCheck, C: Today },
  { id: 'dsa', label: 'DSA', icon: Code2, C: DSA },
  { id: 'learn', label: 'Learn', icon: BookOpen, C: Learn },
  { id: 'build', label: 'Build', icon: Hammer, C: Build },
  { id: 'practice', label: 'Practice', icon: Dumbbell, C: Practice },
  { id: 'mock', label: 'Mock', icon: Mic2, C: Mock },
  { id: 'career', label: 'Career', icon: Briefcase, C: Career },
  { id: 'progress', label: 'Progress', icon: BarChart3, C: Progress },
  { id: 'settings', label: 'Settings', icon: Cog, C: Settings },
]

const fromHash = () => {
  const h = window.location.hash.replace('#/', '')
  return PAGES.some((p) => p.id === h) ? h : 'home'
}

const SYNC = {
  saving: { icon: Loader2, text: 'Saving…', cls: 'spin' },
  saved: { icon: Cloud, text: 'Saved', cls: '' },
  offline: { icon: CloudOff, text: 'Offline — will retry', cls: 'warn' },
}

export default function App() {
  const { toast, authOpen, openAuth, ready, auth, sync } = useStore()
  const [page, setPage] = useState(fromHash)
  const [palette, setPalette] = useState(false)
  const [calOpen, setCalOpen] = useState(false)

  const go = (id) => {
    const apply = () => { window.location.hash = `/${id}`; setPage(id); window.scrollTo({ top: 0 }) }
    if (document.startViewTransition) document.startViewTransition(apply); else apply()
  }

  useEffect(() => {
    const onHash = () => setPage(fromHash())
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) }
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey) }
  }, [])

  if (authOpen) return <><AuthScreen />{toast && <div className="toast" role="status">{toast}</div>}</>
  if (!ready) return <div className="loading"><b>ezze</b><span>Loading your progress…</span></div>

  const Current = PAGES.find((p) => p.id === page).C
  const S = auth && SYNC[sync]

  return (
    <div className="shell">
      <ShadowBranch className="sb sb1" />
      <ShadowBranch className="sb sb2" />
      <FlowerBranch className="corner-flowers" flip />
      <nav className="nav" aria-label="Main">
        <button className="brand" onClick={() => go('home')}><b className="logo">ezze</b></button>
        <div className="nav-links">
          {PAGES.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'on' : ''} onClick={() => go(id)}><Icon size={18} /><span>{id === 'settings' ? '' : label}</span></button>
          ))}
        </div>
        <button className="cal-btn" onClick={() => setCalOpen(true)} aria-label="Open calendar" title="Calendar"><CalendarDays size={18} /></button>
        {S ? <span className={`sync ${S.cls}`} title={S.text}><S.icon size={15} /><span>{S.text}</span></span> : <button className="sync login-btn" onClick={openAuth} title="Optional: log in to keep your progress safe and use it on any device"><LogIn size={15} /><span>Log in</span></button>}
        <button className="kbd-btn" onClick={() => setPalette(true)} aria-label="Search"><Search size={16} /><span>Ctrl K</span></button>
      </nav>
      <main className="main" key={page}><Current go={go} /></main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} items={[...PAGES.map(({ id, label, icon: Icon }) => ({ label: `Go to ${label}`, icon: <Icon size={18} />, run: () => go(id) })), { label: 'Open calendar', icon: <CalendarDays size={18} />, run: () => setCalOpen(true) }]} />
      {calOpen && <CalendarPanel onClose={() => setCalOpen(false)} go={go} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
