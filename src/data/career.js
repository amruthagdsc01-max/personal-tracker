// The daily "career block" (40 min) rotates by weekday so resume, applications, LinkedIn and
// networking all get regular attention without becoming a chore.

export const CAREER_WEEK = {
  1: { key: 'resume', title: 'Resume sharpening', steps: ['Open your resume checklist and fix the next unchecked item.', 'Rewrite one project bullet using: Action verb + what you built + measurable result.'], why: 'A resume is rewritten many times. 30 minutes every Monday beats one panicked all-nighter.' },
  2: { key: 'apply', title: 'Apply to 4–5 roles', steps: ['Find 5 internship/entry roles posted in the last 7 days (company career pages, LinkedIn, Wellfound).', 'Apply to the ones where you match at least 60% of requirements; log each in Applications.'], why: 'Early applicants get seen first. Log each one — the funnel later tells you what to fix.' },
  3: { key: 'linkedin', title: 'Post what you learned or built', steps: ['Open the LinkedIn generator and draft a post about this week’s best lesson, solved topic or project step.', 'Post it, then comment meaningfully on 3 other people’s posts.'], why: 'Recruiters search LinkedIn. A steady trail of real work is proof that is hard to fake.' },
  4: { key: 'apply', title: 'Apply to 4–5 roles', steps: ['Same as Tuesday: fresh postings first, tailor your top 3 bullets for each role.', 'Send one referral request to an alumnus or connection at a company you applied to.'], why: 'Applications with a referral convert far better than cold ones.' },
  5: { key: 'network', title: 'Networking', steps: ['Send 3 personalised connection notes (alumni, engineers, recruiters).', 'Reply to every message you have been sitting on.'], why: 'Most opportunities come through people. Three short, specific messages a week adds up.' },
  6: { key: 'apply', title: 'Apply + tidy the funnel', steps: ['Apply to 3 roles; follow up on anything older than 7 days with no reply.', 'Update statuses in Applications.'], why: 'Follow-ups are free and most people never send them.' },
  0: { key: 'review', title: 'Weekly review & plan', steps: ['Open Progress → Weekly review and read it honestly.', 'Choose one thing to stop, one to keep, and write next week’s single most important goal.'], why: 'A weekly reset keeps a long plan realistic.' },
}

export const RESUME_CHECKLIST = [
  'One page, clean single-column layout, PDF export',
  'Contact line: email, phone, LinkedIn, GitHub (links work)',
  'Education with CGPA and relevant coursework',
  'Skills grouped (Languages, Backend, AI, Tools) — only what you can discuss',
  '3–4 projects, each with 2–3 bullets: action + tech + result',
  'Every bullet starts with a verb and, where possible, has a number',
  'Live links (deployed demo / GitHub) on each project',
  'No fluff: no "hard-working" adjectives, no photos, no objective paragraph',
  'Spelling checked and read aloud once',
  'A tailored version for AI roles and one for backend roles',
  'Reviewed by one senior or friend',
]

export const NETWORK_TEMPLATES = [
  { name: 'Alumni referral request', text: 'Hi {name}, I’m {me}, a final-year B.E. student at {college}. I saw you work at {company}. I’m applying for {role} and have built {project}. Would you be open to a 10-minute chat or to referring me if you think I’m a fit? Happy to share my resume. Thank you!' },
  { name: 'Connection note (short)', text: 'Hi {name}, I’m {me}, learning backend and AI engineering. I enjoyed your post on {topic}. Would love to connect and learn from your work at {company}.' },
  { name: 'Follow-up after applying', text: 'Hi {name}, I applied for the {role} role on {date} and wanted to reiterate my interest. I recently built {project}, which relates closely to the role. Please let me know if I can share anything further.' },
]

export const POST_IDEAS = [
  'One thing I learned today that I wish I had known sooner',
  'How I built {project}: the architecture in 5 bullets',
  'A bug that cost me 2 hours and what it taught me',
  'Before/after: how I improved retrieval accuracy from X% to Y%',
  'What I learned from solving N DSA problems on {topic}',
  'Explaining {concept} in simple words',
  'A mistake I made as a beginner, and how I fixed it',
]

export const FAQ = [
  { q: 'What should I do after I finish a DSA topic?', a: 'Revisit the problems you marked for revision after 3–4 days, then solve 2 new problems from that topic without hints. If you can explain the pattern out loud, move on.' },
  { q: 'Tutorials or building — which one?', a: 'Learn the minimum from one good source in your Learn block, then use it in your Build block the same day. If you cannot use it within 48 hours, you probably should not be learning it yet.' },
  { q: 'How many applications should I send?', a: 'Aim for 4–5 quality applications on 3 days a week. Tailor the top of your resume for each. Quality, early and with a referral beats 50 blind clicks.' },
  { q: 'I missed a few days. What now?', a: 'Nothing to make up. The curriculum pointer only moves when you finish something, so you simply continue where you stopped. Do today’s plan and carry on.' },
  { q: 'Why build a URL shortener and an MCP server?', a: 'A URL shortener is a favourite design question and covers APIs, databases, caching and rate limiting. An MCP server shows you can build real tooling for AI assistants — a newer, in-demand skill that few students have.' },
  { q: 'Should I learn another AI framework?', a: 'Probably not. The bigger gap for most students is a deployed, tested, evaluated AI project. Build one properly before adding frameworks.' },
  { q: 'How do I know a skill is interview-ready?', a: 'You can (1) point to code that uses it, (2) explain it out loud in 2 minutes, and (3) answer a follow-up about trade-offs. If one of those is missing, it is not ready yet.' },
  { q: 'I only have a low-energy day. What is the minimum?', a: 'Switch the day to Light: 2 DSA problems, aptitude, and one speaking prompt. Rest days are fine too — consistency matters more than perfection.' },
]
