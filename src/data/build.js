// Flagship projects: the things companies actually recognise. Each step ≈ one 75-minute build block
// and has a clear "done when" so you always know whether the step is finished.

const S = (id, title, doneWhen) => ({ id, title, doneWhen })

export const PROJECTS = [
  {
    id: 'shortener', name: 'URL Shortener Service', tag: 'systemdesign', stack: ['FastAPI', 'PostgreSQL', 'Redis (optional)', 'Docker'],
    why: 'A classic interview question that you will have actually built, tested and deployed. Touches APIs, databases, hashing, caching, rate limiting and analytics.',
    steps: [
      S('us1', 'Write the spec and API design', 'README lists endpoints (POST /shorten, GET /{code}, GET /stats/{code}), request/response examples and non-goals.'),
      S('us2', 'Project skeleton + health endpoint', 'FastAPI app runs, /health returns 200, repo has .gitignore and a first commit.'),
      S('us3', 'Database schema and models', 'urls table with code, long_url, created_at, expires_at, click_count; tables created in PostgreSQL.'),
      S('us4', 'Short-code generation (base62)', 'Function turns an auto-increment ID into a base62 code and back; unit-tested for collisions.'),
      S('us5', 'POST /shorten with URL validation', 'Invalid URLs get a 422; valid ones return a short URL; duplicates handled.'),
      S('us6', 'GET /{code} redirect', 'Returns 307/302 to the long URL; unknown code gives 404.'),
      S('us7', 'Expiry and click analytics', 'Expired links return 410; each redirect increments click_count; /stats works.'),
      S('us8', 'Caching hot links', 'Repeat redirects served from cache; you measured latency before/after and wrote the numbers down.'),
      S('us9', 'Rate limiting', 'More than N creates per minute per IP returns 429.'),
      S('us10', 'Automated tests', 'pytest suite covers happy paths and 4 error paths; runs green.'),
      S('us11', 'Dockerize with Compose', '`docker compose up` starts API + database from a clean clone.'),
      S('us12', 'Deploy it', 'Live URL works; added to README.'),
      S('us13', 'Architecture diagram + README polish', 'Diagram, setup steps, design decisions and "what I would do at scale" section written.'),
      S('us14', 'Write the LinkedIn post and 2-min explanation', 'Posted, and you recorded yourself explaining the design in 2 minutes.'),
    ],
  },
  {
    id: 'mcpserver', name: 'MCP Server: a tool people would use', tag: 'mcp', stack: ['Python', 'MCP SDK', 'Public API'],
    why: 'MCP is new and in demand. A working, documented MCP server proves you can build real AI tooling, not just call a chat API.',
    steps: [
      S('mc1', 'Pick the problem and write the spec', 'One paragraph: who uses it, which 3 tools it exposes, what data it touches.'),
      S('mc2', 'Hello-world server runs', 'Server starts and the Inspector lists your first tool.'),
      S('mc3', 'Tool #1 with a typed input schema', 'Tool returns correct output for valid input and a clear error for invalid input.'),
      S('mc4', 'Tool #2 wrapping a real API', 'Handles timeouts and API errors without crashing.'),
      S('mc5', 'Tool #3 + one resource', 'Resource readable from the Inspector.'),
      S('mc6', 'A reusable prompt template', 'Prompt appears in the client and produces a useful workflow.'),
      S('mc7', 'Tests for tool logic', 'Tool functions tested without a live client; external calls mocked.'),
      S('mc8', 'Security review', 'README section on permissions, secrets, input validation and prompt-injection risks.'),
      S('mc9', 'Connect to an MCP-capable client and record a demo', '30–60 second demo recorded.'),
      S('mc10', 'Package, document, publish', 'README with install steps; repo public; LinkedIn post written.'),
    ],
  },
  {
    id: 'rag', name: 'RAG Assistant with Evaluation', tag: 'ai', stack: ['Python', 'LLM API', 'Chroma', 'FastAPI'],
    why: 'The difference between a demo and an AI-engineering project is evaluation. This one measures its own accuracy.',
    steps: [
      S('rg1', 'Choose a document set and write 15 test questions', 'Corpus chosen; questions + expected answers saved in a JSON file.'),
      S('rg2', 'Ingestion: load and chunk documents', 'Chunks stored with source metadata.'),
      S('rg3', 'Embeddings + vector store', 'Query returns top-k chunks; you can print them.'),
      S('rg4', 'Answer generation with citations', 'Answer cites the chunks used; says "I don’t know" when context is missing.'),
      S('rg5', 'FastAPI /ask endpoint', 'Endpoint returns answer + sources; validated models.'),
      S('rg6', 'Evaluation script', 'Script reports retrieval hit-rate over your 15 questions.'),
      S('rg7', 'Improve using the eval results', 'Changed chunk size / top-k / prompt and recorded before-vs-after numbers.'),
      S('rg8', 'Logging of latency, tokens and cost', 'Each request logged; summary printed.'),
      S('rg9', 'Simple UI', 'A page where someone can ask a question and see sources.'),
      S('rg10', 'Deploy + README with the metrics', 'Live demo; README shows eval numbers and architecture.'),
    ],
  },
  {
    id: 'harden', name: 'Harden your best existing project', tag: 'testing', stack: ['Your stack'],
    why: 'Improving a project you already have beats starting another. Tests, CI and a deployment turn it from "a project" into evidence.',
    steps: [
      S('hd1', 'Audit: list what is missing', 'A checklist of gaps (tests, README, deployment, error handling) in the repo.'),
      S('hd2', 'Clean the repo', 'No secrets, sensible structure, .gitignore, requirements pinned.'),
      S('hd3', 'Add tests for the core logic', 'At least 8 meaningful tests, passing.'),
      S('hd4', 'Add CI', 'GitHub Actions runs the tests on push.'),
      S('hd5', 'Error handling and logging', 'Failures return clear messages; logs are useful.'),
      S('hd6', 'Dockerize + deploy', 'Live URL.'),
      S('hd7', 'README, screenshots, architecture diagram', 'A stranger can run it in 5 minutes.'),
    ],
  },
]

export const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map((p) => [p.id, p]))
export const ALL_STEPS = PROJECTS.flatMap((p) => p.steps.map((s) => ({ ...s, projectId: p.id, project: p.name })))
