// Mock interview sets. These imitate COMMON hiring-round patterns; real companies differ,
// so treat each as a rehearsal of a style, not a description of any specific employer.

export const MOCK_SETS = [
  {
    id: 'service', name: 'Service-company screening', tag: 'Style: mass-recruiter drive',
    blurb: 'A typical campus-drive pipeline: aptitude, CS basics, easy coding, then a mixed technical + HR chat.',
    rounds: [
      { type: 'mcq', label: 'Aptitude & verbal', bank: 'apt', topics: ['quant', 'logical', 'verbal'], count: 20, minutes: 30 },
      { type: 'mcq', label: 'CS fundamentals', bank: 'cs', topics: ['oop', 'dbms', 'os', 'cn', 'sql'], count: 15, minutes: 15 },
      { type: 'coding', label: 'Coding (easy)', diffs: ['E', 'E'], minutes: 40 },
      { type: 'qa', label: 'Technical + HR interview', cats: ['project', 'oop', 'dbms', 'hr'], count: 6, minutes: 20 },
    ],
  },
  {
    id: 'product', name: 'Product-company assessment + interview', tag: 'Style: product company',
    blurb: 'Online assessment with timed coding, then a technical interview and a behavioural round.',
    rounds: [
      { type: 'coding', label: 'Online assessment: coding', diffs: ['E', 'M'], minutes: 60 },
      { type: 'mcq', label: 'CS fundamentals', bank: 'cs', topics: ['oop', 'dbms', 'os', 'cn', 'python', 'dsa'], count: 15, minutes: 15 },
      { type: 'coding', label: 'Technical interview: DSA', diffs: ['M'], minutes: 30 },
      { type: 'qa', label: 'Technical interview: concepts', cats: ['dbms', 'os', 'api', 'project'], count: 4, minutes: 15 },
      { type: 'qa', label: 'Behavioural', cats: ['hr'], count: 4, minutes: 15 },
    ],
  },
  {
    id: 'bigtech', name: 'Big-tech style loop', tag: 'Style: multi-round loop',
    blurb: 'Two tougher DSA rounds, a design discussion and a behavioural round. Hard on purpose.',
    rounds: [
      { type: 'coding', label: 'DSA round 1', diffs: ['M', 'M'], minutes: 45 },
      { type: 'coding', label: 'DSA round 2', diffs: ['M', 'H'], minutes: 45 },
      { type: 'qa', label: 'System design', cats: ['design'], count: 2, minutes: 30 },
      { type: 'qa', label: 'Behavioural (STAR)', cats: ['hr'], count: 4, minutes: 20 },
    ],
  },
  {
    id: 'ai', name: 'AI-startup interview', tag: 'Style: AI / backend startup',
    blurb: 'Project deep-dive, LLM and RAG concepts, API design and one practical coding problem.',
    rounds: [
      { type: 'qa', label: 'Project deep-dive', cats: ['project'], count: 3, minutes: 15 },
      { type: 'qa', label: 'AI engineering concepts', cats: ['ai'], count: 5, minutes: 20 },
      { type: 'qa', label: 'APIs & backend', cats: ['api', 'dbms'], count: 4, minutes: 15 },
      { type: 'coding', label: 'Practical coding', diffs: ['E', 'M'], minutes: 45 },
      { type: 'qa', label: 'Culture & motivation', cats: ['hr'], count: 3, minutes: 10 },
    ],
  },
  {
    id: 'blitz-cs', name: 'CS fundamentals blitz', tag: 'Quick drill · 15 min',
    blurb: 'Twenty rapid questions across OOP, DBMS, OS, networks, Python, SQL and APIs.',
    rounds: [{ type: 'mcq', label: 'CS blitz', bank: 'cs', topics: ['oop', 'dbms', 'os', 'cn', 'python', 'sql', 'api', 'dsa'], count: 20, minutes: 15 }],
  },
  {
    id: 'blitz-hr', name: 'Behavioural blitz', tag: 'Quick drill · 15 min',
    blurb: 'Six common HR questions. Practise structured, specific answers.',
    rounds: [{ type: 'qa', label: 'HR questions', cats: ['hr'], count: 6, minutes: 15 }],
  },
  {
    id: 'resume', name: 'Resume & project deep-dive', tag: 'Quick drill · 25 min',
    blurb: 'Defend your own projects the way an interviewer will probe them.',
    rounds: [{ type: 'qa', label: 'Projects', cats: ['project'], count: 5, minutes: 25 }],
  },
]
export const MOCK_BY_ID = Object.fromEntries(MOCK_SETS.map((s) => [s.id, s]))
