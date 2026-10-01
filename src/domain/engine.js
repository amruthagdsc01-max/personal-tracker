import { addDays, daysBetween, parse } from './dates.js'
import { BLOCKS, DAY_MODES } from './model.js'
import { DSA_TOPICS, ALL_PROBLEMS, ALL_PROBLEMS_FULL, PROBLEM_BY_ID } from '../data/dsa.js'
import { TRACKS, ALL_LESSONS, LESSON_BY_ID, DEFAULT_TRACK_ORDER } from '../data/learn.js'
import { PROJECTS, PROJECT_BY_ID, ALL_STEPS } from '../data/build.js'
import { APTITUDE, SPEAK_PROMPTS, SPEAK_TECHNIQUES } from '../data/practice.js'
import { CAREER_WEEK, RESUME_CHECKLIST } from '../data/career.js'

let counter = 0
export const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const modeOf = (state, date) => state.dayTypes[date] || 'full'
export const visibleBlocks = (state, date) => BLOCKS.filter((b) => DAY_MODES[modeOf(state, date)].blocks.includes(b.id))
export const dayNumber = (state, date) => Math.max(1, daysBetween(state.profile.startDate || date, date) + 1)

/* ---------------- DSA ---------------- */

export const solvedCount = (state) => ALL_PROBLEMS.filter((p) => state.dsa[p.id]?.solved).length

export function nextUnsolved(state, date, exclude = []) {
  const ok = (p) => !state.dsa[p.id]?.solved && !exclude.includes(p.id)
  const fresh = ALL_PROBLEMS.find((p) => ok(p) && !(state.dsa[p.id]?.skipUntil > date))
  return fresh || ALL_PROBLEMS.find(ok) || null
}

export function currentTopic(state) {
  return DSA_TOPICS.find((t) => t.problems.some((p) => !state.dsa[p.id]?.solved)) || null
}

export function dsaStats(state) {
  const byTopic = DSA_TOPICS.map((t) => {
    const solved = t.problems.filter((p) => state.dsa[p.id]?.solved).length
    return { id: t.id, name: t.name, solved, total: t.problems.length, pct: Math.round((solved / t.problems.length) * 100) }
  })
  const diff = { E: [0, 0], M: [0, 0], H: [0, 0] }
  ALL_PROBLEMS.forEach((p) => { diff[p.diff][1]++; if (state.dsa[p.id]?.solved) diff[p.diff][0]++ })
  return { byTopic, diff, solved: solvedCount(state), total: ALL_PROBLEMS.length, revisit: ALL_PROBLEMS_FULL.filter((p) => state.dsa[p.id]?.revisit).length }
}

/* ---------------- plan ---------------- */

export function nextLesson(state) {
  const order = state.profile.focusTrack ? [state.profile.focusTrack, ...DEFAULT_TRACK_ORDER] : DEFAULT_TRACK_ORDER
  for (const tid of order) {
    const track = TRACKS.find((t) => t.id === tid)
    const l = track?.lessons.find((x) => !state.lessons[x.id])
    if (l) return ALL_LESSONS.find((x) => x.id === l.id)
  }
  return null
}

export function nextStep(state) {
  const order = [state.profile.activeProject, ...PROJECTS.map((p) => p.id)]
  for (const pid of order) {
    const p = PROJECT_BY_ID[pid]
    const s = p?.steps.find((x) => !state.steps[x.id])
    if (s) return ALL_STEPS.find((x) => x.id === s.id)
  }
  return null
}

function pickAptitude(state, n = 10) {
  const last = state.apt.last
  const wrong = APTITUDE.filter((q) => last[q.id] === false)
  const unseen = APTITUDE.filter((q) => last[q.id] === undefined)
  const rest = APTITUDE.filter((q) => last[q.id] === true)
  const pool = [...wrong, ...unseen, ...rest]
  // interleave topics so a session is not one-note
  const out = []
  const byTopic = {}
  pool.forEach((q) => (byTopic[q.topic] ||= []).push(q))
  const keys = Object.keys(byTopic)
  while (out.length < n && keys.some((k) => byTopic[k].length)) keys.forEach((k) => { if (out.length < n && byTopic[k].length) out.push(byTopic[k].shift()) })
  return out.map((q) => q.id)
}

export function makePlan(state, date) {
  const dsa = []
  const due = ALL_PROBLEMS_FULL.find((p) => state.dsa[p.id]?.revisit && state.dsa[p.id]?.solved && daysBetween(state.dsa[p.id].date, date) >= 3 && state.dsa[p.id].reviewedOn !== date)
  if (due) dsa.push(due.id)
  while (dsa.length < 2) {
    const p = nextUnsolved(state, date, dsa)
    if (!p) break
    dsa.push(p.id)
  }
  const dayNo = dayNumber(state, date)
  return {
    dsa,
    learn: nextLesson(state)?.id || null,
    step: nextStep(state)?.id || null,
    apt: pickAptitude(state),
    speak: state.speak.length % SPEAK_PROMPTS.length,
    technique: dayNo % SPEAK_TECHNIQUES.length,
    career: CAREER_WEEK[parse(date).getDay()].key,
  }
}

export const planFor = (state, date) => state.plans[date] || makePlan(state, date)

export function blockDone(state, date, id) {
  const plan = planFor(state, date)
  switch (id) {
    case 'dsa': return plan.dsa.length > 0 && plan.dsa.every((pid) => state.dsa[pid]?.lastDone === date)
    case 'learn': return !plan.learn || state.lessons[plan.learn] === date
    case 'build': return !plan.step || state.steps[plan.step] === date
    case 'apt': return state.apt.log.some((l) => l.date === date)
    case 'speak': return state.speak.some((s) => s.date === date)
    case 'career': return !!state.careerDone[date]
    default: return false
  }
}

/** Minutes of real activity on a date, derived from events (so extra work counts too). */
export function activityMinutes(state, date) {
  let m = 0
  m += Object.values(state.dsa).filter((d) => d.lastDone === date).length * 45
  m += Object.values(state.lessons).filter((d) => d === date).length * 45
  m += Object.values(state.steps).filter((d) => d === date).length * 75
  m += state.apt.log.filter((l) => l.date === date).length * 30
  m += state.speak.filter((s) => s.date === date).length * 20
  m += state.careerDone[date] ? 40 : 0
  return m
}

export function minutesByBlock(state) {
  const acc = { DSA: 0, Build: 0, Learn: 0, Aptitude: 0, Speak: 0, Career: 0 }
  acc.DSA = Object.values(state.dsa).filter((d) => d.lastDone).length * 45
  acc.Learn = Object.keys(state.lessons).length * 45
  acc.Build = Object.keys(state.steps).length * 75
  acc.Aptitude = state.apt.log.length * 30
  acc.Speak = state.speak.length * 20
  acc.Career = Object.keys(state.careerDone).length * 40
  return Object.entries(acc).map(([label, minutes]) => ({ label, minutes })).filter((x) => x.minutes > 0)
}

export const isRestDay = (state, date) => modeOf(state, date) === 'rest'

export function streakInfo(state, date) {
  const active = (d) => activityMinutes(state, d) >= 45 || isRestDay(state, d)
  let streak = 0
  let d = active(date) ? date : addDays(date, -1)
  while (active(d) && streak < 400) { streak++; d = addDays(d, -1) }
  let on = 0, rest = 0
  for (let i = 0; i < 14; i++) { const x = addDays(date, -i); if (activityMinutes(state, x) >= 45) on++; else if (isRestDay(state, x)) { on++; rest++ } }
  return { streak, consistency: Math.round((on / 14) * 100), rest }
}

export function heatmap(state, date, weeks = 12) {
  const end = date
  const start = addDays(end, -(weeks * 7 - 1))
  return Array.from({ length: weeks * 7 }, (_, i) => { const d = addDays(start, i); return { date: d, minutes: activityMinutes(state, d), rest: isRestDay(state, d) } })
}

/* ---------------- other progress ---------------- */

export function trackProgress(state) {
  return TRACKS.map((t) => { const done = t.lessons.filter((l) => state.lessons[l.id]).length; return { ...t, done, total: t.lessons.length, pct: Math.round((done / t.lessons.length) * 100) } })
}
export function projectProgress(state) {
  return PROJECTS.map((p) => { const done = p.steps.filter((s) => state.steps[s.id]).length; return { ...p, done, total: p.steps.length, pct: Math.round((done / p.steps.length) * 100) } })
}
export function aptStats(state) {
  const acc = {}
  state.apt.log.forEach((l) => Object.entries(l.byTopic || {}).forEach(([t, [c, n]]) => { const a = (acc[t] ||= [0, 0]); a[0] += c; a[1] += n }))
  return acc
}
export function recentApt(state, k = 5) {
  const rec = state.apt.log.slice(-k)
  const c = rec.reduce((s, l) => s + l.correct, 0), n = rec.reduce((s, l) => s + l.total, 0)
  return n >= 20 ? Math.round((c / n) * 100) : null // too little data to judge
}

/* ---------------- applications ---------------- */

const APPLIED = ['applied', 'assessment', 'interview', 'final', 'offer']
export const hasReached = (a, st) => (a.log || []).some((l) => l.status === st) || a.status === st
export const appliedCount = (state) => state.applications.filter((a) => APPLIED.includes(a.status) || hasReached(a, 'applied')).length
export const appliedThisWeek = (state, date) => state.applications.filter((a) => a.applied && daysBetween(a.applied, date) >= 0 && daysBetween(a.applied, date) < 7).length
export const appBuckets = (state, date) => {
  const open = state.applications.filter((a) => !['rejected', 'offer'].includes(a.status))
  return {
    newToday: state.applications.filter((a) => a.discovered === date),
    thisWeek: state.applications.filter((a) => a.posted && daysBetween(a.posted, date) >= 0 && daysBetween(a.posted, date) <= 7),
    deadlineSoon: open.filter((a) => a.deadline && !APPLIED.includes(a.status) && daysBetween(date, a.deadline) >= 0 && daysBetween(date, a.deadline) <= 3),
    followUp: open.filter((a) => a.followUp && a.followUp <= date),
  }
}
export function funnel(state) {
  const order = ['applied', 'assessment', 'interview', 'final', 'offer']
  const reached = (st) => state.applications.filter((a) => order.slice(order.indexOf(st)).some((x) => hasReached(a, x))).length
  return Object.fromEntries(order.map((s) => [s, reached(s)]))
}
export function bottleneck(state) {
  const f = funnel(state)
  if (f.applied < 10) return { found: false, message: `Not enough data yet — ${10 - f.applied} more applications before the funnel says anything reliable.`, f }
  if (f.assessment + f.interview < f.applied * 0.1) return { found: true, area: 'Resume targeting / role fit', message: 'Possible bottleneck: many applications, very few responses.', f }
  if (f.assessment >= 3 && f.interview / f.assessment < 0.4) return { found: true, area: 'Assessment preparation', message: 'Possible bottleneck: assessments are not converting to interviews.', f }
  if (f.interview >= 3 && f.final / f.interview < 0.4) return { found: true, area: 'Interview performance', message: 'Possible bottleneck: interviews are not reaching final rounds.', f }
  return { found: false, message: 'No clear bottleneck in the data so far.', f }
}


/* ---------------- mock interview history ---------------- */

export function mockStats(state, date) {
  const m = state.mocks || []
  const last = m[m.length - 1]
  const recent = m.slice(-3)
  const avg = recent.length ? Math.round(recent.reduce((s, x) => s + x.overall, 0) / recent.length) : null
  const topics = {}
  m.forEach((x) => Object.entries(x.topics || {}).forEach(([t, [c, n]]) => { const a = (topics[t] ||= [0, 0]); a[0] += c; a[1] += n }))
  const daysSince = last ? daysBetween(last.date, date) : null
  return { count: m.length, last, avg, topics, daysSince }
}

/* ---------------- mentor ---------------- */

export function mentor(state, date) {
  const dayNo = dayNumber(state, date)
  const name = state.profile.name
  const plan = planFor(state, date)
  const stats = dsaStats(state)
  const topic = currentTopic(state)
  const msgs = []
  const mode = modeOf(state, date)
  const { streak } = streakInfo(state, date)

  if (mode === 'rest') return { headline: 'Rest is part of the plan.', lines: ['Sleep, eat well, go for a walk. Tomorrow you continue exactly where you stopped — nothing is lost.'], focus: null }

  const expected = Math.max(0, (dayNo - 1) * 2)
  const behind = expected - stats.solved
  if (behind >= 8) msgs.push({ p: 3, t: `You are ${behind} problems behind a 2-a-day pace. Don’t binge to catch up — add one extra problem on weekends and keep today’s two honest.` })
  else if (behind <= -4) msgs.push({ p: 1, t: `You are ${-behind} problems ahead of pace. Use the slack to revisit flagged problems instead of rushing forward.` })

  const apt = recentApt(state)
  if (apt !== null && apt < 60) msgs.push({ p: 3, t: `Aptitude accuracy over your last sessions is ${apt}%. Slow down: read each question twice and review every explanation before moving on.` })
  const aptT = aptStats(state)
  const weak = Object.entries(aptT).filter(([, [c, n]]) => n >= 4).map(([t, [c, n]]) => ({ t, r: c / n })).sort((a, b) => a.r - b.r)[0]
  if (weak && weak.r < 0.6) msgs.push({ p: 2, t: `Your weakest aptitude area is “${weak.t}” (${Math.round(weak.r * 100)}%). Spend 10 extra minutes on it this week.` })

  const lastPost = state.posts.length ? state.posts[state.posts.length - 1].date : null
  const sinceLastPost = lastPost ? daysBetween(lastPost, date) : dayNo
  if (sinceLastPost >= 7 && dayNo >= 3) msgs.push({ p: 2, t: `You haven’t posted on LinkedIn in ${lastPost ? sinceLastPost + ' days' : 'a while'}. You are learning and building real things — write one short post about it.` })

  const wk = appliedThisWeek(state, date)
  if (dayNo >= 8 && wk < 3) msgs.push({ p: 2, t: `Only ${wk} application${wk === 1 ? '' : 's'} in the last 7 days. Aim for 8–12 a week: fresh postings, tailored resume, referral where you can.` })

  const revisitDue = ALL_PROBLEMS_FULL.filter((p) => state.dsa[p.id]?.revisit && state.dsa[p.id]?.solved && daysBetween(state.dsa[p.id].date, date) >= 3).length
  if (revisitDue) msgs.push({ p: 1, t: `${revisitDue} problem${revisitDue > 1 ? 's are' : ' is'} due for revision. Today’s plan includes one.` })

  const mk = mockStats(state, date)
  if (dayNo >= 21 && mk.count === 0) msgs.push({ p: 2, t: 'You have not tried a mock interview yet. Do a 15-minute CS blitz this week — it shows what to study next.' })
  else if (mk.count && mk.daysSince >= 14) msgs.push({ p: 1, t: `Your last mock was ${mk.daysSince} days ago. Another one this week will show whether you improved.` })
  else if (mk.last && mk.last.overall < 55) msgs.push({ p: 2, t: `Your last mock scored ${mk.last.overall}%. Work the weak areas from its report, then retake a similar set.` })

  if (streak >= 3) msgs.push({ p: 0, t: `${streak}-day streak. Consistency beats intensity.` })
  if (dayNo <= 2 && !msgs.length) msgs.push({ p: 1, t: 'Start small and keep the promise. The plan is the same every day: DSA, build, learn, practise, speak, career.' })

  const focusWhy = topic ? `DSA focus: ${topic.name}. ${topic.blurb}` : 'You have finished the whole DSA sheet. Revisit flagged problems and start timed mocks.'
  const nextStepObj = plan.step ? ALL_STEPS.find((s) => s.id === plan.step) : null
  const lesson = plan.learn ? LESSON_BY_ID[plan.learn] : null
  const joined = []
  if (lesson) joined.push(`Learn “${lesson.title}” today, then try using it in your build step.`)
  if (nextStepObj) joined.push(`Build target: ${nextStepObj.project} — ${nextStepObj.title}.`)

  const lines = msgs.sort((a, b) => b.p - a.p).slice(0, 3).map((m) => m.t)
  const h = dayNo === 1 ? `Welcome, ${name}. Day 1.` : `Day ${dayNo}, ${name}. Here is today’s plan.`
  return { headline: h, lines, focus: focusWhy, joined }
}

/* ---------------- weekly review ---------------- */

export function weeklyReview(state, date) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, -i))
  const inWeek = (d) => d && days.includes(d)
  const solved = Object.values(state.dsa).filter((d) => inWeek(d.lastDone)).length
  const lessons = Object.values(state.lessons).filter(inWeek).length
  const steps = Object.values(state.steps).filter(inWeek).length
  const apt = state.apt.log.filter((l) => inWeek(l.date))
  const speak = state.speak.filter((s) => inWeek(s.date)).length
  const posts = state.posts.filter((p) => inWeek(p.date)).length
  const applied = appliedThisWeek(state, date)
  const activeDays = days.filter((d) => activityMinutes(state, d) >= 45).length
  const hours = days.reduce((s, d) => s + activityMinutes(state, d), 0) / 60
  const areas = [
    ['DSA', solved, 14], ['Learning', lessons, 5], ['Building', steps, 4], ['Aptitude', apt.length, 5], ['Speaking', speak, 5], ['LinkedIn', posts, 1], ['Applications', applied, 8],
  ]
  const ratios = areas.map(([n, v, t]) => ({ n, v, t, r: v / t }))
  const best = [...ratios].sort((a, b) => b.r - a.r)[0]
  const gap = [...ratios].sort((a, b) => a.r - b.r)[0]
  return {
    activeDays, hours: Math.round(hours * 10) / 10, ratios,
    win: best.r > 0 ? `${best.n}: ${best.v} done (target ${best.t}).` : 'No activity logged this week yet.',
    gap: `${gap.n}: ${gap.v} of ${gap.t} target.`,
    next: gap.r < 0.5 ? `Give ${gap.n} a protected slot early next week.` : 'Keep the balance — raise the difficulty of DSA picks or ship a project step earlier.',
    stop: hours > 40 ? 'Working over 40h a week — protect sleep and plan a rest day.' : 'Skipping the review of mistakes. Re-read explanations before moving on.',
  }
}

/* ---------------- where you stand ---------------- */

const STATUS_ORDER = { behind: 0, slow: 1, start: 2, on: 3, ahead: 4 }
const paceStatus = (done, expected, tol) => {
  if (done === 0 && expected <= 2) return 'start'
  const diff = done - expected
  if (diff >= 2) return 'ahead'
  if (diff >= -tol) return 'on'
  if (diff >= -3 * tol) return 'slow'
  return 'behind'
}

export function standing(state, date) {
  const dayNo = dayNumber(state, date)
  const ds = dsaStats(state)
  const topic = currentTopic(state)
  const topicIdx = topic ? DSA_TOPICS.filter((t) => !t.side).findIndex((t) => t.id === topic.id) + 1 : null
  const coreTopics = DSA_TOPICS.filter((t) => !t.side).length
  const perDay = ds.solved / dayNo
  const finish = ds.solved >= 5 && perDay > 0 ? addDays(date, Math.ceil((ds.total - ds.solved) / perDay)) : null

  const lessonsDone = Object.keys(state.lessons).length
  const tp = trackProgress(state)
  const curTrack = tp.find((t) => t.done < t.total)
  const stepsDone = Object.keys(state.steps).length
  const pp = projectProgress(state)
  const curProj = pp.find((p) => p.id === state.profile.activeProject && p.done < p.total) || pp.find((p) => p.done < p.total)
  const answered = state.apt.log.reduce((s, l) => s + l.total, 0)
  const correct = state.apt.log.reduce((s, l) => s + l.correct, 0)
  const acc = answered >= 20 ? Math.round((correct / answered) * 100) : null
  const sp = state.speak
  const lastFive = sp.slice(-5), firstFive = sp.slice(0, 5)
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x.rating, 0) / a.length : 0)
  const resumeDone = RESUME_CHECKLIST.filter((_, i) => state.resume[i]).length
  const applied = appliedCount(state)
  const expectedDays = Math.max(0, dayNo - 1)

  const areas = [
    {
      id: 'dsa', label: 'DSA', pct: Math.round((ds.solved / ds.total) * 100), headline: `${ds.solved} of ${ds.total} problems`,
      status: paceStatus(ds.solved, expectedDays * 2, 4),
      detail: topic ? `Module ${topicIdx} of ${coreTopics}: ${topic.name} (${ds.byTopic.find((t) => t.id === topic.id).solved}/${ds.byTopic.find((t) => t.id === topic.id).total}).` : 'Whole sheet completed.',
      pace: `${perDay.toFixed(1)} problems/day vs a target of 2.${finish ? ` At this pace you finish around ${fmtDate(finish)}.` : ' Solve a few more and I will project a finish date.'}`,
    },
    {
      id: 'learn', label: 'Learn', pct: Math.round((lessonsDone / ALL_LESSONS.length) * 100), headline: `${lessonsDone} of ${ALL_LESSONS.length} lessons`,
      status: paceStatus(lessonsDone, expectedDays, 3),
      detail: curTrack ? `Current track: ${curTrack.name} (${curTrack.done}/${curTrack.total}).` : 'All tracks completed.',
      pace: `${(lessonsDone / dayNo).toFixed(1)} lessons/day vs a target of 1.`,
    },
    {
      id: 'build', label: 'Build', pct: Math.round((stepsDone / ALL_STEPS.length) * 100), headline: `${stepsDone} of ${ALL_STEPS.length} project steps`,
      status: paceStatus(stepsDone, expectedDays, 3),
      detail: curProj ? `Current project: ${curProj.name} (${curProj.done}/${curProj.total} steps).` : 'All projects completed.',
      pace: `${(stepsDone / dayNo).toFixed(1)} steps/day vs a target of 1.`,
    },
    {
      id: 'apt', label: 'Aptitude', pct: Math.round((Object.values(state.apt.last).filter(Boolean).length / APTITUDE.length) * 100), headline: `${state.apt.log.length} sessions`,
      status: state.apt.log.length === 0 ? (dayNo <= 1 ? 'start' : 'behind') : acc === null ? 'start' : acc >= 75 ? 'ahead' : acc >= 55 ? 'on' : 'slow',
      detail: `${Object.values(state.apt.last).filter(Boolean).length} of ${APTITUDE.length} questions answered correctly at least once.`,
      pace: acc === null ? 'Accuracy shows after 20 answered questions.' : `Accuracy ${acc}% (aim for 75%+).`,
    },
    {
      id: 'speak', label: 'Speak', pct: Math.min(100, Math.round((sp.length / 30) * 100)), headline: `${sp.length} practice sessions`,
      status: paceStatus(sp.length, expectedDays, 4),
      detail: sp.length >= 6 ? `Self-rating: ${avg(lastFive).toFixed(1)}/5 recently vs ${avg(firstFive).toFixed(1)}/5 at the start.` : 'Log 6 sessions to see your rating trend.',
      pace: 'Target: 1 recording a day.',
    },
    {
      id: 'career', label: 'Career', pct: Math.round(((resumeDone / RESUME_CHECKLIST.length) * 0.5 + Math.min(1, state.posts.length / 8) * 0.25 + Math.min(1, applied / 50) * 0.25) * 100),
      headline: `${applied} applied · ${state.posts.length} posts`,
      status: dayNo < 8 ? 'start' : applied >= Math.floor(dayNo / 2) ? 'on' : applied > 0 ? 'slow' : 'behind',
      detail: `Resume checklist ${resumeDone}/${RESUME_CHECKLIST.length}.`,
      pace: `Aim for about 8–12 applications a week and one LinkedIn post a week.`,
    },
  ]

  const mk = mockStats(state, date)
  areas.push({
    id: 'mock', label: 'Interviews', pct: mk.avg ?? 0, headline: mk.count ? `${mk.count} mock${mk.count > 1 ? 's' : ''} · avg ${mk.avg}%` : 'No mocks yet',
    status: mk.count === 0 ? (dayNo < 21 ? 'start' : 'slow') : mk.avg >= 70 ? 'ahead' : mk.avg >= 50 ? 'on' : 'slow',
    detail: mk.last ? `Last: ${mk.last.name} (${mk.last.overall}%).` : 'Mock interviews start to matter after the first few weeks.',
    pace: 'Aim for one mock every one to two weeks.',
  })

  const overall = Math.round(
    areas[0].pct * 0.35 + areas[1].pct * 0.2 + areas[2].pct * 0.25 + areas[3].pct * 0.1 + areas[4].pct * 0.05 + areas[5].pct * 0.05,
  )
  const stage = overall < 8 ? 'Getting started' : overall < 25 ? 'Building foundations' : overall < 50 ? 'Gaining momentum' : overall < 75 ? 'Nearly interview-ready' : 'Interview-ready'

  // when were you last active, and where to resume
  const everActive = Object.values(state.dsa).some((d) => d.lastDone) || Object.keys(state.lessons).length || Object.keys(state.steps).length || state.apt.log.length || state.speak.length || Object.keys(state.careerDone).length
  let since = 0
  while (since < 365 && activityMinutes(state, addDays(date, -since)) === 0) since++
  if (!everActive) since = null
  const nextProblem = nextUnsolved(state, date)
  const resume = [
    nextProblem && `DSA: ${nextProblem.title} (${nextProblem.topic})`,
    nextLesson(state) && `Learn: ${nextLesson(state).title}`,
    nextStep(state) && `Build: ${nextStep(state).title} — ${nextStep(state).project}`,
  ].filter(Boolean)

  const worst = [...areas].filter((a) => a.status !== 'start').sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])[0]
  const best = [...areas].filter((a) => a.status !== 'start').sort((a, b) => STATUS_ORDER[b.status] - STATUS_ORDER[a.status])[0]
  const summary = overall === 0 && dayNo <= 2
    ? 'You are at the very beginning. Nothing to judge yet — finish today’s plan and this report will start to mean something.'
    : `Day ${dayNo}. You have covered about ${overall}% of this plan (${stage.toLowerCase()}). ${best && best.status !== 'behind' ? `Strongest: ${best.label}. ` : ''}${worst && (worst.status === 'behind' || worst.status === 'slow') ? `Most behind: ${worst.label}.` : 'Nothing is badly behind.'}`

  return { dayNo, overall, stage, areas, since, resume, summary }
}

const fmtDate = (iso) => parse(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export { PROBLEM_BY_ID }
