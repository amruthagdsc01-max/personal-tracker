// Company-specific preparation.
// Nothing here claims what any named company does. Company-specific content comes from what the
// user pastes (job posting) or notes (rounds from the official page). The rest is a checklist for
// the interview STYLE the user picks, with items that tick themselves from real progress.
import { ALL_PROBLEMS } from '../data/dsa.js'
import { TRACKS } from '../data/learn.js'
import { addDays, daysBetween } from './dates.js'
import { mockStats, uid } from './engine.js'
import { MOCK_BY_ID } from '../data/mocks.js'

export const STYLES = {
  service: { label: 'Service-company drive', mock: 'service', blurb: 'Aptitude + CS basics + easy coding + technical/HR.' },
  product: { label: 'Product company', mock: 'product', blurb: 'Timed online assessment, then DSA and concepts interviews.' },
  bigtech: { label: 'Big-tech style loop', mock: 'bigtech', blurb: 'Multiple DSA rounds, design discussion, behavioural.' },
  ai: { label: 'AI / backend startup', mock: 'ai', blurb: 'Project deep-dive, LLM/RAG concepts, APIs, practical coding.' },
  other: { label: 'Not sure yet', mock: 'product', blurb: 'A balanced default.' },
}

/* ---------- progress helpers (all derived from the user's own data) ---------- */
const solved = (s) => ALL_PROBLEMS.filter((p) => s.dsa[p.id]?.solved)
const solvedDiff = (s, d) => solved(s).filter((p) => p.diff === d).length
const trackPct = (s, id) => { const t = TRACKS.find((x) => x.id === id); return t ? Math.round((t.lessons.filter((l) => s.lessons[l.id]).length / t.lessons.length) * 100) : 0 }
const lessonDone = (s, id) => !!s.lessons[id]
const topicAcc = (s, topic) => { const [c, n] = mockStats(s, '2000-01-01').topics[topic] || [0, 0]; return n >= 3 ? c / n : null }
const aptAnswered = (s) => s.apt.log.reduce((a, l) => a + l.total, 0)
const aptAcc = (s) => { const n = aptAnswered(s); return n >= 30 ? s.apt.log.reduce((a, l) => a + l.correct, 0) / n : null }
const bestMock = (s, setId) => Math.max(0, ...(s.mocks || []).filter((m) => m.setId === setId).map((m) => m.overall))
const fullMocks = (s, setId) => (s.mocks || []).filter((m) => m.setId === setId && m.mode === 'full')
const resumeDone = (s) => Object.values(s.resume || {}).filter(Boolean).length

/* ---------- reading a pasted job posting ---------- */
// measure(s) → 0..100 how far the user's plan progress covers it, or null when it is outside the plan
const pct = (n, of) => Math.min(100, Math.round((n / of) * 100))
export const KEYWORDS = [
  { re: /\bpython\b/i, label: 'Python', to: 'build', measure: (s) => pct(Object.keys(s.steps).length + solved(s).length / 5, 10) },
  { re: /\bjava\b(?!script)/i, label: 'Java', note: 'Java is not in your daily plan. If your target needs it, solve some DSA problems in Java and revise OOP.' },
  { re: /\b(javascript|typescript|node\.?js|react)\b/i, label: 'JavaScript / React / Node', note: 'Front-end and Node are not in your daily plan. Only invest if several postings you want ask for them.' },
  { re: /\b(sql|postgres(ql)?|mysql|rdbms)\b/i, label: 'SQL / relational databases', to: 'learn', measure: (s) => trackPct(s, 'sql') },
  { re: /\b(mongo(db)?|nosql|dynamodb|cassandra)\b/i, label: 'NoSQL databases', to: 'practice', measure: (s) => (lessonDone(s, 'sql4') ? 40 : 0), note: 'Know when NoSQL fits (see mock Q&A: SQL vs NoSQL).' },
  { re: /\bredis\b|\bcach(e|ing)\b/i, label: 'Caching / Redis', to: 'learn', measure: (s) => (lessonDone(s, 's2') ? 100 : 0) },
  { re: /\bdocker\b|\bcontainer(s|ization)?\b/i, label: 'Docker / containers', to: 'learn', measure: (s) => trackPct(s, 'docker') },
  { re: /\bkubernetes\b|\bk8s\b/i, label: 'Kubernetes', note: 'Not in your plan. Learn Docker properly first; Kubernetes is a later step.' },
  { re: /\b(aws|azure|gcp|google cloud|cloud)\b/i, label: 'Cloud platforms', to: 'learn', measure: (s) => (lessonDone(s, 'd4') ? 50 : 0), note: 'You cover deployment basics; a specific cloud is outside your plan.' },
  { re: /\bgit(hub)?\b/i, label: 'Git / GitHub', to: 'learn', measure: (s) => trackPct(s, 'git') },
  { re: /\bci\s*\/?\s*cd\b|github actions|jenkins/i, label: 'CI/CD', to: 'learn', measure: (s) => (lessonDone(s, 't4') ? 100 : 0) },
  { re: /\brest(ful)?\s+apis?\b|\bapis?\b|\bhttp\b/i, label: 'REST APIs', to: 'learn', measure: (s) => trackPct(s, 'fastapi') },
  { re: /\bfastapi\b/i, label: 'FastAPI', to: 'learn', measure: (s) => trackPct(s, 'fastapi') },
  { re: /\b(flask|django)\b/i, label: 'Flask / Django', to: 'learn', measure: (s) => Math.round(trackPct(s, 'fastapi') * 0.7), note: 'Same ideas as FastAPI with a different framework.' },
  { re: /\bmicroservices?\b/i, label: 'Microservices', to: 'learn', measure: (s) => Math.round(trackPct(s, 'sysdesign') * 0.8) },
  { re: /system design|low[- ]level design|high[- ]level design|scalab/i, label: 'System design', to: 'learn', measure: (s) => trackPct(s, 'sysdesign') },
  { re: /data structures?|algorithms?|\bdsa\b/i, label: 'Data structures & algorithms', to: 'dsa', measure: (s) => pct(solved(s).length, 120) },
  { re: /\boop\b|object[- ]oriented/i, label: 'OOP', to: 'practice', measure: (s) => { const a = topicAcc(s, 'oop'); return a === null ? 0 : Math.round(a * 100) } },
  { re: /\bdbms\b|database management/i, label: 'DBMS concepts', to: 'practice', measure: (s) => { const a = topicAcc(s, 'dbms'); return a === null ? Math.min(40, trackPct(s, 'sql')) : Math.round(a * 100) } },
  { re: /operating systems?|\bos concepts\b/i, label: 'Operating systems', to: 'practice', measure: (s) => { const a = topicAcc(s, 'os'); return a === null ? 0 : Math.round(a * 100) } },
  { re: /computer networks?|networking|\btcp\b/i, label: 'Computer networks', to: 'practice', measure: (s) => { const a = topicAcc(s, 'cn'); return a === null ? 0 : Math.round(a * 100) } },
  { re: /\b(unit )?test(ing|s)?\b|pytest|\btdd\b/i, label: 'Testing', to: 'learn', measure: (s) => trackPct(s, 'testing') },
  { re: /\bllms?\b|large language model|generative ai|gen ?ai|prompt engineering|openai|anthropic|gpt/i, label: 'LLMs / generative AI', to: 'learn', measure: (s) => trackPct(s, 'llm') },
  { re: /\brag\b|retrieval|embeddings?|vector (db|database|store)|semantic search/i, label: 'RAG / embeddings', to: 'learn', measure: (s) => pct(['ai3', 'ai4', 'ai5', 'ai6'].filter((id) => lessonDone(s, id)).length, 4) },
  { re: /\bai agents?\b|agentic|langchain|langgraph|tool calling|function calling/i, label: 'Agents / tool calling', to: 'learn', measure: (s) => (lessonDone(s, 'ai7') ? 70 : 0) },
  { re: /\bmcp\b|model context protocol/i, label: 'MCP', to: 'learn', measure: (s) => trackPct(s, 'mcp') },
  { re: /machine learning|deep learning|\bml\b|pytorch|tensorflow|scikit/i, label: 'Machine learning', note: 'Model training is outside your plan (it focuses on building with LLM APIs). Check how central ML is to the role.' },
  { re: /\bpandas\b|\bnumpy\b|data analysis/i, label: 'Pandas / NumPy', note: 'Outside the daily plan; a short project would cover it if the role needs it.' },
  { re: /\blinux\b|shell scripting|\bbash\b/i, label: 'Linux / shell', note: 'Not in your plan; spend 2–3 hours on basic commands if the role lists it.' },
  { re: /communication|teamwork|collaborat/i, label: 'Communication', to: 'practice', measure: (s) => pct(s.speak.length, 15) },
]

export function extractRequirements(text) {
  if (!text || text.trim().length < 20) return []
  return KEYWORDS.filter((k) => k.re.test(text))
}

export function assess(state, kw) {
  if (!kw.measure) return { status: 'outside', pct: null, note: kw.note || 'Outside your current plan.' }
  const p = kw.measure(state)
  return { status: p >= 60 ? 'covered' : p > 0 ? 'partial' : 'gap', pct: p, note: kw.note || '' }
}

/* ---------- checklist ---------- */
const item = (id, text, extra = {}) => ({ id, text, ...extra })

function styleItems(style, setId) {
  const mockItem = item('mock-clear', `Score 60%+ on the “${MOCK_BY_ID[setId]?.name || setId}” mock`, { auto: (s) => bestMock(s, setId) >= 60, to: 'mock' })
  const full2 = item('mock-two', 'Sit this style as a full-length exam at least twice', { auto: (s) => fullMocks(s, setId).length >= 2, to: 'mock' })
  switch (style) {
    case 'service': return [
      item('apt', 'Aptitude accuracy 70%+ over at least 30 answered questions', { auto: (s) => (aptAcc(s) ?? 0) >= 0.7, to: 'practice' }),
      item('easy40', 'Solve 40 easy DSA problems', { auto: (s) => solvedDiff(s, 'E') >= 40, to: 'dsa' }),
      item('sql', 'Finish the SQL lessons (SQL is asked in most drives)', { auto: (s) => trackPct(s, 'sql') >= 75, to: 'learn' }),
      item('cs', 'Revise OOP, DBMS, OS and networks (aim for 60%+ on the CS blitz)', { manual: true, to: 'mock' }),
      mockItem, full2,
    ]
    case 'product': return [
      item('solve80', 'Solve 80 DSA problems, at least 25 of them medium', { auto: (s) => solved(s).length >= 80 && solvedDiff(s, 'M') >= 25, to: 'dsa' }),
      item('cs', 'Revise OOP, DBMS, OS and networks (60%+ on the CS blitz)', { manual: true, to: 'mock' }),
      item('sd', 'Complete half of the system design lessons', { auto: (s) => trackPct(s, 'sysdesign') >= 50, to: 'learn' }),
      item('deploy', 'Have one project deployed with a live link', { auto: (s) => !!(s.steps.us12 || s.steps.rg10 || s.steps.hd6), to: 'build' }),
      mockItem, full2,
    ]
    case 'bigtech': return [
      item('solve150', 'Solve 150 DSA problems with 60 medium and some hard', { auto: (s) => solved(s).length >= 150 && solvedDiff(s, 'M') >= 60 && solvedDiff(s, 'H') >= 5, to: 'dsa' }),
      item('sd', 'Finish the system design track', { auto: (s) => trackPct(s, 'sysdesign') >= 100, to: 'learn' }),
      item('star', 'Write six STAR stories (conflict, failure, leadership, ambiguity, deadline, learning)', { manual: true, to: 'practice' }),
      item('friend', 'Do one mock interview with a friend or senior (talk aloud, get feedback)', { manual: true }),
      mockItem, full2,
    ]
    case 'ai': return [
      item('rag', 'RAG project with an evaluation script done', { auto: (s) => !!s.steps.rg6, to: 'build' }),
      item('mcp', 'MCP server project: at least 5 steps complete', { auto: (s) => ['mc1', 'mc2', 'mc3', 'mc4', 'mc5'].every((id) => s.steps[id]), to: 'build' }),
      item('llm', 'LLM & RAG track at 75%+', { auto: (s) => trackPct(s, 'llm') >= 75, to: 'learn' }),
      item('deploy', 'One project deployed with a live link', { auto: (s) => !!(s.steps.us12 || s.steps.rg10 || s.steps.hd6), to: 'build' }),
      item('talk', 'Can explain hallucination, evaluation and tool calling out loud in 90 seconds each', { manual: true, to: 'mock' }),
      mockItem, full2,
    ]
    default: return [
      item('solve60', 'Solve 60 DSA problems', { auto: (s) => solved(s).length >= 60, to: 'dsa' }),
      item('cs', 'Revise CS fundamentals (60%+ on the CS blitz)', { manual: true, to: 'mock' }),
      mockItem, full2,
    ]
  }
}

export function buildChecklist(company, state) {
  const style = STYLES[company.style] ? company.style : 'other'
  const reqs = extractRequirements(company.jd).map((k) => ({ k, a: assess(state, k) }))
  const gapItems = reqs.filter((r) => r.a.status === 'gap' || r.a.status === 'partial').filter((r) => r.k.measure).map((r) => item(`req-${r.k.label}`, `Strengthen ${r.k.label} (the posting mentions it)`, { auto: (s) => assess(s, r.k).status === 'covered', to: r.k.to, source: 'posting' }))
  const sections = [
    { title: 'Understand the process', items: [
      item('official', 'Open the company’s official careers / hiring-process page and note the stages below as a verified note', { manual: true }),
      item('jd', 'Paste the full job posting here so the requirements check can run', { auto: (s, c) => (c.jd || '').trim().length >= 200 }),
      item('values', 'Find the values or principles the company states and prepare a STAR story for three of them', { manual: true }),
      item('date', 'Set the interview or deadline date', { auto: (s, c) => !!c.interviewDate }),
    ] },
    { title: 'Resume & profile', items: [
      item('resume', 'Resume checklist at least 9 of 11 done', { auto: (s) => resumeDone(s) >= 9, to: 'career' }),
      item('tailor', 'Rewrite your top 3 resume bullets to match this posting', { manual: true }),
      item('github', 'Pin your best repos with clear READMEs', { manual: true }),
      item('linkedin', 'Update your LinkedIn headline and featured projects', { manual: true }),
      item('referral', 'Ask one person who works there for a referral or advice', { manual: true, to: 'career' }),
    ] },
    { title: `Technical — ${STYLES[style].label}`, items: styleItems(style, STYLES[style].mock) },
  ]
  if (gapItems.length) sections.push({ title: 'From the job posting', items: gapItems })
  sections.push(
    { title: 'Day before and day of', items: [
      item('tech', 'Test your laptop, charger, internet and camera', { manual: true }),
      item('room', 'Pick a quiet room and silence notifications', { manual: true }),
      item('questions', 'Prepare three questions to ask the interviewer', { manual: true }),
      item('sleep', 'Sleep at least 7 hours; eat before the interview', { manual: true }),
      item('early', 'Join 10 minutes early with resume and notes open', { manual: true }),
    ] },
    { title: 'After', items: [
      item('thanks', 'Send a short thank-you note within 24 hours', { manual: true }),
      item('notes', 'Write down every question you were asked while you remember it', { manual: true }),
      item('status', 'Update the status in your Applications board', { manual: true, to: 'career' }),
    ] },
  )
  return sections.map((sec) => ({
    ...sec,
    items: sec.items.map((it) => ({ ...it, isAuto: !!it.auto, done: it.auto ? !!it.auto(state, company) : !!company.checks?.[it.id] })),
  }))
}

export function companyProgress(company, state) {
  const items = buildChecklist(company, state).flatMap((s) => s.items)
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0, next: items.find((i) => !i.done) }
}

export const daysToInterview = (company, date) => (company.interviewDate ? daysBetween(date, company.interviewDate) : null)

export const newCompany = (date, init = {}) => ({
  id: uid(), name: '', role: '', url: '', officialUrl: '', style: 'product', interviewDate: '', applicationId: '', jd: '', notes: [], checks: {}, createdAt: date, ...init,
})

/** Search links only — they make no claim about the company. */
export const searchLinks = (name) => {
  const q = encodeURIComponent(name)
  return [
    { label: 'Find the official hiring-process page', url: `https://www.google.com/search?q=${q}+careers+hiring+process+how+we+hire` },
    { label: 'Read candidate experiences (third-party — may be outdated)', url: `https://www.google.com/search?q=${q}+interview+experience+software+engineer+intern` },
    { label: 'Open roles on LinkedIn', url: `https://www.linkedin.com/jobs/search/?keywords=${q}` },
  ]
}
export { addDays }
