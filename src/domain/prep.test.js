import { describe, expect, it } from 'vitest'
import { emptyState } from './model.js'
import { extractRequirements, assess, buildChecklist, companyProgress, daysToInterview, newCompany, STYLES, searchLinks } from './prep.js'
import { ALL_PROBLEMS } from '../data/dsa.js'
import { TRACKS } from '../data/learn.js'

const fresh = () => { const s = emptyState(); s.profile.startDate = '2026-10-01'; return s }
const JD = 'We are hiring a backend intern. You will build REST APIs in Python with FastAPI and PostgreSQL, deploy with Docker on AWS, and write unit tests. Experience with Kubernetes and LLMs is a plus. The rest of the team is friendly.'

describe('reading a job posting', () => {
  it('spots technologies and ignores the everyday word "rest"', () => {
    const labels = extractRequirements(JD).map((k) => k.label)
    expect(labels).toEqual(expect.arrayContaining(['Python', 'FastAPI', 'SQL / relational databases', 'Docker / containers', 'Cloud platforms', 'Testing', 'Kubernetes', 'LLMs / generative AI']))
    expect(extractRequirements('Take the rest of the day off and relax, then rest.').map((k) => k.label)).not.toContain('REST APIs')
  })
  it('returns nothing for empty or tiny text', () => {
    expect(extractRequirements('')).toEqual([])
    expect(extractRequirements('python')).toEqual([])
  })
  it('compares each requirement with real progress', () => {
    const s = fresh()
    const sql = extractRequirements('SQL and Kubernetes experience required for this role.')
    const byLabel = (l) => assess(s, sql.find((k) => k.label.startsWith(l)))
    expect(byLabel('SQL').status).toBe('gap')
    expect(byLabel('Kubernetes').status).toBe('outside')
    TRACKS.find((t) => t.id === 'sql').lessons.slice(0, 2).forEach((l) => { s.lessons[l.id] = '2026-10-02' })
    expect(byLabel('SQL').status).toBe('partial')
    TRACKS.find((t) => t.id === 'sql').lessons.forEach((l) => { s.lessons[l.id] = '2026-10-02' })
    expect(byLabel('SQL').status).toBe('covered')
  })
})

describe('company checklist', () => {
  it('has a section per stage and adds posting-based items for gaps', () => {
    const c = newCompany('2026-10-01', { name: 'Acme', style: 'ai', jd: JD })
    const secs = buildChecklist(c, fresh())
    expect(secs.map((s) => s.title)).toEqual(expect.arrayContaining(['Understand the process', 'Resume & profile', 'Technical — AI / backend startup', 'From the job posting', 'Day before and day of', 'After']))
    expect(secs.find((s) => s.title === 'From the job posting').items.some((i) => /FastAPI|SQL/.test(i.text))).toBe(true)
  })
  it('auto items tick from real progress and manual items from the user', () => {
    const c = newCompany('2026-10-01', { name: 'Acme', style: 'product', jd: JD, interviewDate: '2026-10-20' })
    const s = fresh()
    const item = (secs, id) => secs.flatMap((x) => x.items).find((i) => i.id === id)
    expect(item(buildChecklist(c, s), 'solve80').done).toBe(false)
    ALL_PROBLEMS.filter((p) => p.diff === 'E').slice(0, 80).forEach((p) => { s.dsa[p.id] = { solved: true } })
    expect(item(buildChecklist(c, s), 'solve80').done).toBe(false) // 80 solved but no medium yet
    ALL_PROBLEMS.filter((p) => p.diff === 'M').slice(0, 30).forEach((p) => { s.dsa[p.id] = { solved: true } })
    expect(item(buildChecklist(c, s), 'solve80').done).toBe(true)
    expect(item(buildChecklist(c, s), 'date').done).toBe(true)
    expect(item(buildChecklist(c, s), 'tailor').done).toBe(false)
    c.checks.tailor = true
    expect(item(buildChecklist(c, s), 'tailor').done).toBe(true)
  })
  it('progress reflects items done and names the next one', () => {
    const c = newCompany('2026-10-01', { name: 'Acme', style: 'service' })
    const p0 = companyProgress(c, fresh())
    expect(p0.pct).toBe(0)
    expect(p0.next).toBeTruthy()
    Object.assign(c.checks, { official: true, values: true, tailor: true })
    expect(companyProgress(c, fresh()).done).toBe(3)
  })
  it('counts days to the interview and builds claim-free search links', () => {
    expect(daysToInterview({ interviewDate: '2026-10-11' }, '2026-10-01')).toBe(10)
    expect(daysToInterview({}, '2026-10-01')).toBe(null)
    searchLinks('Acme Corp').forEach((l) => expect(l.url).toMatch(/Acme%20Corp/))
    Object.values(STYLES).forEach((s) => expect(s.mock).toBeTruthy())
  })
})
