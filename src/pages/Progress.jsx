import { Bar as RBar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store.jsx'
import { PageHead, Card, Bar, Empty } from '../components/ui.jsx'
import { mockStats, aptStats, bottleneck, dsaStats, heatmap, minutesByBlock, projectProgress, streakInfo, trackProgress, weeklyReview, funnel, appliedCount } from '../domain/engine.js'
import { APT_TOPICS } from '../data/practice.js'
import { fmt } from '../domain/dates.js'
import Standing from '../components/Standing.jsx'
import { topicLabel } from '../domain/mock.js'

const COLORS = ['#4A1A09', '#C2475E', '#EBA9A5', '#7A3F2B', '#6F8F5F', '#C58B3C']

export default function Progress({ go }) {
  const { state, date } = useStore()
  const stats = dsaStats(state)
  const { streak, consistency } = streakInfo(state, date)
  const cells = heatmap(state, date)
  const blocks = minutesByBlock(state)
  const total = blocks.reduce((s, b) => s + b.minutes, 0)
  const week = weeklyReview(state, date)
  const apt = aptStats(state)
  const f = funnel(state)
  const bn = bottleneck(state)
  const mk = mockStats(state, date)
  const level = (m) => (m >= 240 ? 4 : m >= 150 ? 3 : m >= 75 ? 2 : m > 0 ? 1 : 0)

  return (
    <>
      <PageHead script="Evidence of growth" title="Progress" sub="Everything here is counted from what you actually completed." />
      <Standing go={go} />
      <div className="buckets">
        <Card tilt={false} className="bucket"><b>{streak}</b><small>Day streak</small></Card>
        <Card tilt={false} className="bucket"><b>{consistency}%</b><small>Consistency (14d)</small></Card>
        <Card tilt={false} className="bucket"><b>{stats.solved}</b><small>DSA solved</small></Card>
        <Card tilt={false} className="bucket"><b>{(total / 60).toFixed(0)}h</b><small>Total study time</small></Card>
        <Card tilt={false} className="bucket"><b>{appliedCount(state)}</b><small>Applications</small></Card>
        <Card tilt={false} className="bucket"><b>{state.posts.length}</b><small>LinkedIn posts</small></Card>
      </div>

      <Card tilt={false}>
        <h2>Last 12 weeks</h2>
        <div className="heat" role="img" aria-label="Activity heatmap">{cells.map((c) => <i key={c.date} className={`h${c.rest && !c.minutes ? 'r' : level(c.minutes)}`} title={`${fmt(c.date)} · ${c.minutes} min${c.rest ? ' · rest' : ''}`} />)}</div>
        <small className="muted">Darker = more study. Rest days (striped) never break your streak.</small>
      </Card>

      <div className="two-col" style={{ marginTop: 20 }}>
        <Card tilt={false}>
          <h2>DSA by module</h2>
          <div className="mod-list">{stats.byTopic.map((t) => <div key={t.id} className="mod"><span>{t.name}</span><Bar pct={t.pct} /><small>{t.solved}/{t.total}</small></div>)}</div>
        </Card>
        <Card tilt={false}>
          <h2>Where my time goes</h2>
          {total ? (
            <div className="pie-row">
              <ResponsiveContainer width={170} height={170}><PieChart><Pie data={blocks} dataKey="minutes" nameKey="label" innerRadius={48} outerRadius={80} paddingAngle={2}>{blocks.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => `${v} min`} /></PieChart></ResponsiveContainer>
              <ul className="legend">{blocks.map((b, i) => <li key={b.label}><i style={{ background: COLORS[i % COLORS.length] }} />{b.label}<b>{Math.round((b.minutes / total) * 100)}%</b></li>)}</ul>
            </div>
          ) : <Empty title="Nothing yet">Complete a block on Today and it shows up here.</Empty>}
        </Card>
      </div>

      <div className="two-col">
        <Card tilt={false}>
          <h2>Learning tracks</h2>
          <div className="mod-list">{trackProgress(state).map((t) => <div key={t.id} className="mod"><span>{t.name}</span><Bar pct={t.pct} /><small>{t.done}/{t.total}</small></div>)}</div>
          <h2 style={{ marginTop: 22 }}>Projects</h2>
          <div className="mod-list">{projectProgress(state).map((t) => <div key={t.id} className="mod"><span>{t.name}</span><Bar pct={t.pct} tone="accent" /><small>{t.done}/{t.total}</small></div>)}</div>
        </Card>
        <Card tilt={false}>
          <h2>Aptitude accuracy</h2>
          {Object.keys(apt).length ? <div className="mod-list">{Object.entries(APT_TOPICS).map(([k, l]) => { const [c, n] = apt[k] || [0, 0]; return <div key={k} className="mod"><span>{l}</span><Bar pct={n ? (c / n) * 100 : 0} tone="accent" /><small>{n ? Math.round((c / n) * 100) : 0}%</small></div> })}</div> : <p className="muted">No aptitude sessions yet.</p>}
          <h2 style={{ marginTop: 22 }}>Application funnel</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={Object.entries(f).map(([name, v]) => ({ name, v }))} layout="vertical"><CartesianGrid horizontal={false} stroke="#F6CFCA" /><XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#FFE0DC' }} /><RBar dataKey="v" fill="#C2475E" radius={[0, 8, 8, 0]} /></BarChart>
          </ResponsiveContainer>
          <p className="muted"><b>{bn.found ? `Possible bottleneck: ${bn.area}. ` : ''}</b>{bn.message}</p>
        </Card>
      </div>

      <Card tilt={false} className="weekly">
        <h2>Mock interviews</h2>
        {mk.count ? (
          <>
            <p className="muted">{mk.count} completed · average of the last three: {mk.avg}%</p>
            <div className="mod-list">{state.mocks.slice(-6).map((m, i) => <div key={i} className="mod"><span>{m.name}</span><Bar pct={m.overall} tone="accent" /><small>{m.overall}%</small></div>)}</div>
            {Object.entries(mk.topics).filter(([, [c, n]]) => n >= 3).length > 0 && <p className="muted" style={{ marginTop: 12 }}>Weakest topics: {Object.entries(mk.topics).filter(([, [c, n]]) => n >= 3).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).slice(0, 3).map(([t, [c, n]]) => `${topicLabel(t)} (${Math.round((c / n) * 100)}%)`).join(', ')}</p>}
          </>
        ) : <p className="muted">No mocks yet. Try a 15-minute CS blitz from the Mock page.</p>}
      </Card>

      <Card tilt={false} className="weekly">
        <h2>Weekly review (last 7 days)</h2>
        <p className="muted">{week.activeDays} active days · {week.hours}h studied</p>
        <div className="mod-list">{week.ratios.map((r) => <div key={r.n} className="mod"><span>{r.n}</span><Bar pct={Math.min(100, r.r * 100)} /><small>{r.v}/{r.t}</small></div>)}</div>
        <div className="review-grid">
          <div><small>BIGGEST WIN</small><p>{week.win}</p></div>
          <div><small>BIGGEST GAP</small><p>{week.gap}</p></div>
          <div><small>NEXT WEEK</small><p>{week.next}</p></div>
          <div><small>STOP DOING</small><p>{week.stop}</p></div>
        </div>
      </Card>
    </>
  )
}
