export const STATUSES = ['discovered', 'shortlisted', 'ready', 'applied', 'assessment', 'interview', 'final', 'offer', 'rejected']
export const STATUS_LABEL = {
  discovered: 'Discovered', shortlisted: 'Shortlisted', ready: 'Ready', applied: 'Applied',
  assessment: 'Assessment', interview: 'Interview', final: 'Final round', offer: 'Offer', rejected: 'Rejected',
}

// Daily 5-hour structure (minutes). Blocks add up to 300.
export const BLOCKS = [
  { id: 'dsa', label: 'DSA', minutes: 90, sub: '2 problems' },
  { id: 'build', label: 'Build', minutes: 75, sub: 'project step' },
  { id: 'learn', label: 'Learn', minutes: 45, sub: 'one useful tool' },
  { id: 'apt', label: 'Aptitude', minutes: 30, sub: '10 questions' },
  { id: 'speak', label: 'Speak', minutes: 20, sub: 'communication' },
  { id: 'career', label: 'Career', minutes: 40, sub: 'resume · apply · post' },
]
export const DAY_MODES = {
  full: { label: 'Full day · 5h', blocks: ['dsa', 'build', 'learn', 'apt', 'speak', 'career'] },
  light: { label: 'Light day · 2.5h', blocks: ['dsa', 'apt', 'speak'] },
  rest: { label: 'Rest day', blocks: [] },
}

export const emptyState = () => ({
  version: 2,
  profile: { name: 'Amrutha', startDate: null, focusTrack: null, activeProject: 'shortener' },
  dsa: {},
  lessons: {},
  steps: {},
  apt: { log: [], last: {} },
  speak: [],
  mocks: [],
  companies: [],
  events: [],
  posts: [],
  careerDone: {},
  resume: {},
  applications: [],
  dayTypes: {},
  plans: {},
  reviews: {},
})
