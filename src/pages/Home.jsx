import { ArrowRight, Code2, Hammer, BookOpen, Flame, CircleCheck, Globe, Heart } from 'lucide-react'
import { useStore } from '../store.jsx'
import Carousel from '../components/Carousel.jsx'
import { Blossom, FlowerBranch, WaxSeal, TapeStrip } from '../components/Floral.jsx'
import { Card, Ring } from '../components/ui.jsx'
import Standing from '../components/Standing.jsx'
import UpcomingBanner from '../components/UpcomingBanner.jsx'
import { FAQ } from '../data/career.js'
import { ALL_PROBLEMS } from '../data/dsa.js'
import { ALL_LESSONS } from '../data/learn.js'
import { PROJECTS } from '../data/build.js'
import { BLOCKS } from '../domain/model.js'
import { blockDone, dayNumber, dsaStats, mentor, nextLesson, nextStep, streakInfo, visibleBlocks, currentTopic } from '../domain/engine.js'
import { weekday } from '../domain/dates.js'

export default function Home({ go }) {
  const { state, date } = useStore()
  const stats = dsaStats(state)
  const blocks = visibleBlocks(state, date)
  const done = blocks.filter((b) => blockDone(state, date, b.id)).length
  const { streak, consistency } = streakInfo(state, date)
  const topic = currentTopic(state)
  const lesson = nextLesson(state)
  const step = nextStep(state)
  const m = mentor(state, date)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = state.profile.name || 'friend'

  const pillars = [
    { to: 'today', title: 'Today’s plan', lines: ['5 hours, 6 focused blocks,', 'planned for you every morning'] },
    { to: 'dsa', title: 'DSA sheet', lines: [`${ALL_PROBLEMS.length} problems, pattern by pattern,`, 'with revision built in'] },
    { to: 'build', title: 'Learn & build', lines: [`${ALL_LESSONS.length} lessons, ${PROJECTS.length} flagship projects,`, 'proof for every skill'] },
  ]

  return (
    <div className="home">
      <section className="hero2">
        <div className="pillars">
          {pillars.map((p) => (
            <button key={p.to} className="pillar" onClick={() => go(p.to)}>
              <CircleCheck size={30} className="pillar-ico" />
              <span><b>{p.title}</b>{p.lines.map((l) => <small key={l}>{l}</small>)}</span>
            </button>
          ))}
        </div>

        <div className="hero2-main">
          <div className="photo-wrap">
            <TapeStrip />
            <div className="photo-frame">
              <svg className="frame-blossoms" viewBox="0 0 200 200" aria-hidden="true"><Blossom x={150} y={50} r={34} rot={10} tone="blush" /><Blossom x={185} y={120} r={22} rot={-20} tone="peach" /><Blossom x={30} y={170} r={28} rot={25} tone="rose" /></svg>
              <Carousel autoplay={5200} arrows={false}>
                <div className="slide-card"><Flame size={28} /><small>Today</small><b className="big">{blocks.length ? `${done}/${blocks.length}` : 'Rest'}</b><p>{blocks.length ? 'blocks complete' : 'Rest is part of the plan.'}</p></div>
                <div className="slide-card"><Code2 size={28} /><small>DSA</small><b className="big">{stats.solved}<span> / {stats.total}</span></b><p>{topic ? `Now: ${topic.name}` : 'Sheet complete'}</p></div>
                <div className="slide-card"><Hammer size={28} /><small>Next build step</small><b className="big sm">{step?.title || 'All done'}</b><p>{step?.project}</p></div>
                <div className="slide-card"><BookOpen size={28} /><small>Next lesson</small><b className="big sm">{lesson?.title || 'All done'}</b><p>{lesson?.track}</p></div>
              </Carousel>
            </div>
          </div>

          <div className="hero2-copy">
            <p className="by">{greet}, {name} · {weekday(date)} · Day {dayNumber(state, date)}</p>
            <h1 className="hero2-title">ezze</h1>
            <p className="hero2-tag">Your daily mentor</p>
            <p className="hero-line">{m.lines[0] || m.focus}</p>
            <div className="hero-actions">
              <button className="btn primary" onClick={() => go('today')}>Start today’s plan <ArrowRight size={18} /></button>
              <button className="btn ghost" onClick={() => go('dsa')}>Open DSA sheet</button>
            </div>
          </div>
          <FlowerBranch className="hero-flowers" />
          <WaxSeal className="hero-seal" size={112} />
        </div>

        <div className="hero2-foot">
          <span><i className="foot-ico"><Globe size={18} /></i> Learn daily. Build proof. Get hired.</span>
          <span><Heart size={16} /> {streak > 0 ? `${streak}-day streak` : 'Day one is the hardest'}</span>
        </div>
      </section>

      <section className="strip">
        {BLOCKS.map((b) => (
          <Card key={b.id} className="strip-card" onClick={() => go('today')} role="button" tabIndex={0}>
            <small>{b.label}</small><b>{b.minutes} min</b><span>{b.sub}</span>
            <i className={blockDone(state, date, b.id) ? 'dot on' : 'dot'} />
          </Card>
        ))}
      </section>

      <UpcomingBanner go={go} />
      <Standing go={go} compact />

      <section className="two-col">
        <Card tilt={false}>
          <h2>Your five-hour day</h2>
          <p className="muted">Same shape every day, so you never waste energy deciding what to do. The content changes automatically as you progress.</p>
          <div className="timeline">{BLOCKS.map((b) => <span key={b.id} style={{ flex: b.minutes }} title={`${b.label} ${b.minutes}m`}>{b.label}</span>)}</div>
        </Card>
        <Card tilt={false}>
          <h2>Momentum</h2>
          <div className="ring-row"><Ring pct={Math.round((stats.solved / stats.total) * 100)} size={120}><b>{Math.round((stats.solved / stats.total) * 100)}%</b><small>DSA sheet</small></Ring>
            <ul className="mini-list"><li><span>Streak</span><b>{streak} days</b></li><li><span>Consistency</span><b>{consistency}%</b></li><li><span>Posts</span><b>{state.posts.length}</b></li></ul></div>
        </Card>
      </section>

      <section>
        <div className="sec-head"><span className="script">Ask your mentor</span><h2>Straight answers</h2></div>
        <Carousel peek>
          {FAQ.map((f) => <Card key={f.q} className="faq"><h3>{f.q}</h3><p className="muted">{f.a}</p></Card>)}
        </Carousel>
      </section>
    </div>
  )
}
