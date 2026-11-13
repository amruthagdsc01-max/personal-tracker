// The journey: six stages, each one needs the previous. Names follow the learner's roadmap
// (Foundation -> Beginner -> Intermediate -> Upper intermediate -> Interview method -> Interview mastery).
export const STAGES = [
  { id: 1, key: 'foundation', name: 'Foundation', blurb: 'How the internet and a web app actually work, from the first keystroke.', test: 'Explain, end to end, what happens when someone opens an app and logs in.' },
  { id: 2, key: 'beginner', name: 'Backend & Data', blurb: 'Servers, why they get slow, and where data lives.', test: 'A growing app gets slow. Find the bottleneck and name the first fix.' },
  { id: 3, key: 'intermediate', name: 'Core Components', blurb: 'Scaling out, load balancers, caches, queues, replicas and shards.', test: 'Take a single-server app to a million users using the right components.' },
  { id: 4, key: 'upper', name: 'Distributed Systems', blurb: 'What changes when many machines must agree, and some of them fail.', test: 'Keep an order system correct when networks drop and services crash.' },
  { id: 5, key: 'method', name: 'Interview Method', blurb: 'A repeatable way to approach any unfamiliar design problem.', test: 'Run the 12-step framework on a new problem and justify each choice.' },
  { id: 6, key: 'mastery', name: 'Design Problems', blurb: 'Full problems, solved step by step, then on your own.', test: 'Solve an unseen problem independently under mock-interview conditions.' },
]
export const TIERS = {
  must: { label: 'Must learn', note: 'Essential fundamentals and interview staples' },
  should: { label: 'Should learn', note: 'Important in practical engineering' },
  advanced: { label: 'Advanced', note: 'Deeper engineering knowledge' },
  optional: { label: 'Optional', note: 'Specialised or niche' },
}
export const MASTERY = [
  { id: 0, key: 'none', label: 'Not started' },
  { id: 1, key: 'learning', label: 'Learning' },
  { id: 2, key: 'revise', label: 'Needs revision' },
  { id: 3, key: 'explain', label: 'Can explain independently' },
  { id: 4, key: 'apply', label: 'Can apply in a scenario' },
  { id: 5, key: 'ready', label: 'Interview ready' },
]
