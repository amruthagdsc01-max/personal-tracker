// Learning tracks: one lesson ≈ one 45-minute study block. Every lesson ends in something
// you DO, so learning always produces proof. Resource links go only to official/primary docs.

const L = (id, title, what, doThis, outcome, resources = []) => ({ id, title, what, doThis, outcome, resources, minutes: 45 })
const R = (label, url) => ({ label, url })

export const TRACKS = [
  {
    id: 'git', name: 'Git & GitHub', tag: 'git', why: 'Every team uses Git daily. Clean history and good PRs show you can work in a real codebase.',
    lessons: [
      L('git1', 'Core loop: init, add, commit, log', 'The three areas (working tree, staging, repository) and how a commit is a snapshot.', 'Create a repo, make 5 small commits with meaningful messages, read `git log --oneline`.', 'You can explain staging vs committing.', [R('Pro Git book', 'https://git-scm.com/book/en/v2')]),
      L('git2', 'Branches and merging', 'Why we branch per feature; fast-forward vs merge commit.', 'Create a feature branch, change the same line on main and the branch, resolve the conflict by hand.', 'You are no longer scared of merge conflicts.', [R('Pro Git: Branching', 'https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell')]),
      L('git3', 'GitHub: remotes, push, pull requests', 'How a PR is the unit of code review.', 'Push a repo to GitHub, open a PR from a branch to main on your own repo, write a clear PR description.', 'Your first self-reviewed PR.', [R('GitHub Docs', 'https://docs.github.com/en/pull-requests')]),
      L('git4', 'Rebase, stash, undo mistakes', 'reset vs revert, stash, interactive rebase to tidy commits.', 'Make 3 messy commits, squash them into one with `git rebase -i`. Use `git stash` mid-change.', 'You can recover from most mistakes.', [R('Pro Git: Rewriting History', 'https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History')]),
      L('git5', 'A recruiter-ready GitHub profile', 'Pinned repos, profile README, repo descriptions, topics.', 'Pin your 3 best repos, write a profile README, add a one-line description and topics to each repo.', 'Your profile makes a good first impression in 30 seconds.', [R('Managing your profile README', 'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme')]),
    ],
  },
  {
    id: 'sql', name: 'SQL & PostgreSQL', tag: 'sql', why: 'Nearly every backend and data role tests SQL. It is also the cheapest skill to make interview-ready.',
    lessons: [
      L('sql1', 'SELECT, WHERE, ORDER BY, LIMIT', 'Reading data precisely.', 'Finish the first SQLBolt lessons, then write 10 queries on any sample table.', 'You can filter and sort without looking anything up.', [R('SQLBolt', 'https://sqlbolt.com/')]),
      L('sql2', 'Aggregates and GROUP BY / HAVING', 'COUNT, SUM, AVG and grouping logic.', 'Answer 8 "how many per category" questions on a dataset.', 'You know WHERE vs HAVING.', [R('PostgreSQL tutorial', 'https://www.postgresqltutorial.com/')]),
      L('sql3', 'JOINs (INNER, LEFT)', 'How tables relate; why LEFT JOIN keeps unmatched rows.', 'Create customers + orders tables and write INNER, LEFT and a "customers with no orders" query.', 'Joins are your most-used tool.', [R('SQLBolt joins', 'https://sqlbolt.com/lesson/select_queries_with_joins')]),
      L('sql4', 'Schema design & keys', 'Primary/foreign keys, normalisation to 3NF, one-to-many vs many-to-many.', 'Design the schema for a URL shortener and a task tracker on paper, then create them.', 'You can justify every table you create.', [R('PostgreSQL docs: constraints', 'https://www.postgresql.org/docs/current/ddl-constraints.html')]),
      L('sql5', 'Subqueries & CTEs', 'WITH clauses to break hard questions into steps.', 'Rewrite one nested query as a CTE.', 'Readable complex queries.', [R('PostgreSQL docs: WITH', 'https://www.postgresql.org/docs/current/queries-with.html')]),
      L('sql6', 'Window functions', 'ROW_NUMBER, RANK, running totals.', 'Find the top-3 per group using ROW_NUMBER.', 'You can answer the classic interview "top N per group".', [R('PostgreSQL docs: window functions', 'https://www.postgresql.org/docs/current/tutorial-window.html')]),
      L('sql7', 'Indexes and EXPLAIN', 'Why queries are slow and how an index helps.', 'Insert 100k rows, run EXPLAIN ANALYZE before and after adding an index.', 'You can talk about performance with evidence.', [R('PostgreSQL docs: indexes', 'https://www.postgresql.org/docs/current/indexes.html')]),
      L('sql8', 'Transactions & ACID', 'Why money transfers need transactions.', 'Write a transfer between two accounts that rolls back on failure.', 'You can explain ACID with an example.', [R('PostgreSQL docs: transactions', 'https://www.postgresql.org/docs/current/tutorial-transactions.html')]),
    ],
  },
  {
    id: 'fastapi', name: 'Backend with FastAPI', tag: 'fastapi', why: 'APIs are the core of backend and AI-application work. FastAPI is what most Python AI teams use.',
    lessons: [
      L('api1', 'HTTP & REST fundamentals', 'Methods, status codes, idempotency, resource naming.', 'List the endpoints for a notes app with correct methods and status codes, then test one with curl.', 'You can design a clean REST API.', [R('MDN: HTTP overview', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview')]),
      L('api2', 'First FastAPI app, path & query params', 'Routing and automatic docs at /docs.', 'Build GET/POST endpoints and explore the Swagger UI.', 'A running API.', [R('FastAPI tutorial', 'https://fastapi.tiangolo.com/tutorial/')]),
      L('api3', 'Pydantic models & validation', 'Request/response models, error responses.', 'Add validated request bodies and a response_model.', 'Bad input never reaches your logic.', [R('FastAPI: Request body', 'https://fastapi.tiangolo.com/tutorial/body/')]),
      L('api4', 'Database layer (SQLAlchemy + PostgreSQL)', 'Sessions, models, dependency injection.', 'Persist your notes in PostgreSQL via SQLAlchemy.', 'Real persistence.', [R('FastAPI: SQL databases', 'https://fastapi.tiangolo.com/tutorial/sql-databases/')]),
      L('api5', 'Authentication with JWT', 'Password hashing and tokens.', 'Add register/login and protect one route.', 'You can explain how login works end-to-end.', [R('FastAPI: Security', 'https://fastapi.tiangolo.com/tutorial/security/')]),
      L('api6', 'Async, background tasks, middleware', 'When async actually helps.', 'Add a background task and a request-timing middleware.', 'You know when NOT to use async.', [R('FastAPI: Background tasks', 'https://fastapi.tiangolo.com/tutorial/background-tasks/')]),
      L('api7', 'Config, errors & logging', 'Environment variables, exception handlers, structured logs.', 'Move secrets to env vars; add a global error handler and logs.', 'Production hygiene.', [R('FastAPI: Handling errors', 'https://fastapi.tiangolo.com/tutorial/handling-errors/')]),
    ],
  },
  {
    id: 'testing', name: 'Testing & Clean Code', tag: 'testing', why: 'Tests are the clearest signal that you write professional code. Few students have them.',
    lessons: [
      L('t1', 'pytest basics', 'Arrange-Act-Assert, fixtures, parametrize.', 'Write 6 tests for a small function including edge cases.', 'Green test suite.', [R('pytest docs', 'https://docs.pytest.org/en/stable/getting-started.html')]),
      L('t2', 'Testing a FastAPI app', 'TestClient and overriding dependencies.', 'Test every endpoint of your API, including a 404 and a validation error.', 'API with tests.', [R('FastAPI: Testing', 'https://fastapi.tiangolo.com/tutorial/testing/')]),
      L('t3', 'Mocking external calls', 'Never hit a real LLM or API in unit tests.', 'Mock an HTTP call and assert behaviour.', 'Fast, deterministic tests.', [R('unittest.mock', 'https://docs.python.org/3/library/unittest.mock.html')]),
      L('t4', 'Linting, formatting & CI', 'Ruff + GitHub Actions running tests on each push.', 'Add a workflow that runs pytest on every push.', 'A green CI badge in your README.', [R('GitHub Actions docs', 'https://docs.github.com/en/actions')]),
    ],
  },
  {
    id: 'docker', name: 'Docker & Deployment', tag: 'docker', why: '"Works on my machine" is not proof. Deployed projects are worth far more than local ones.',
    lessons: [
      L('d1', 'Containers vs VMs, images, running containers', 'The mental model.', 'Run nginx and postgres containers; stop, inspect, remove them.', 'You can explain what an image is.', [R('Docker get started', 'https://docs.docker.com/get-started/')]),
      L('d2', 'Write a Dockerfile', 'Layers, caching, slim base images.', 'Dockerize your FastAPI app and run it.', 'Your API runs identically anywhere.', [R('Dockerfile reference', 'https://docs.docker.com/reference/dockerfile/')]),
      L('d3', 'Docker Compose', 'App + database in one command.', 'Write compose.yaml for API + PostgreSQL.', '`docker compose up` runs your whole stack.', [R('Compose docs', 'https://docs.docker.com/compose/')]),
      L('d4', 'Deploy to a free cloud host', 'Environment variables, ports, health checks.', 'Deploy your API to a free-tier host (e.g. Render, Railway or Fly.io) and put the live URL in your README.', 'A live, shareable URL.', [R('Render docs', 'https://render.com/docs')]),
      L('d5', 'Basic monitoring', 'Logs, health endpoint, uptime check.', 'Add /health and read your host logs after an error.', 'You can debug a deployed app.', []),
    ],
  },
  {
    id: 'llm', name: 'LLM Apps & RAG', tag: 'ai', why: 'Your AI-engineer direction. The gap is not frameworks — it is building, evaluating and deploying one solid application.',
    lessons: [
      L('ai1', 'Calling an LLM API properly', 'Messages, system prompts, temperature, tokens, cost, error handling.', 'Write a function that calls an LLM API with retries and a timeout.', 'A reusable, safe LLM client.', [R('Anthropic API docs', 'https://docs.anthropic.com/')]),
      L('ai2', 'Prompting that works in products', 'Clear instructions, examples, structured (JSON) output.', 'Make a prompt return validated JSON; parse with Pydantic.', 'Reliable structured output.', [R('Anthropic prompt engineering', 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview')]),
      L('ai3', 'Embeddings & similarity search', 'Text → vectors; cosine similarity.', 'Embed 20 sentences and find the closest to a query.', 'You understand retrieval.', [R('Chroma docs', 'https://docs.trychroma.com/')]),
      L('ai4', 'Chunking and a vector store', 'Chunk size/overlap trade-offs.', 'Load a PDF, chunk it, store in Chroma, query it.', 'Working retrieval.', [R('Chroma getting started', 'https://docs.trychroma.com/docs/overview/getting-started')]),
      L('ai5', 'RAG end to end with citations', 'Retrieve → prompt → answer with sources.', 'Build /ask that returns an answer plus the source chunks.', 'A real RAG endpoint.', []),
      L('ai6', 'Evaluating your RAG system', 'A small test set, hit-rate, faithfulness checks.', 'Write 15 question/answer pairs and measure how often retrieval finds the right chunk.', 'You can say "my system answers X% correctly" — most people cannot.', []),
      L('ai7', 'Tool / function calling', 'Letting the model call your code safely.', 'Give the model a calculator and a search tool.', 'Foundation of agents and MCP.', [R('Anthropic tool use', 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview')]),
      L('ai8', 'Logging, cost & guardrails', 'Log prompts/latency/cost; handle bad outputs.', 'Log each call and add an output validator.', 'Production-minded AI.', []),
    ],
  },
  {
    id: 'mcp', name: 'MCP Servers', tag: 'mcp', why: 'Model Context Protocol is the open standard for connecting AI assistants to tools and data. Few students can build one — it makes your profile stand out.',
    lessons: [
      L('m1', 'What MCP is and why it exists', 'Hosts, clients and servers; tools vs resources vs prompts.', 'Read the intro, then write 5 lines on the problem MCP solves in your own words.', 'You can explain MCP to an interviewer.', [R('modelcontextprotocol.io', 'https://modelcontextprotocol.io/')]),
      L('m2', 'Build a hello-world MCP server (Python)', 'The official SDK, a first tool.', 'Create a server exposing one tool and run it locally.', 'A running MCP server.', [R('MCP Python SDK', 'https://github.com/modelcontextprotocol/python-sdk')]),
      L('m3', 'Test with MCP Inspector', 'Debug tools without a full client.', 'Inspect your tool schemas and call them from the Inspector.', 'Fast feedback loop.', [R('MCP docs', 'https://modelcontextprotocol.io/')]),
      L('m4', 'A useful tool: wrap a real API', 'Input schemas, errors, timeouts.', 'Expose a tool that calls a public API (weather, GitHub, your expense API).', 'A tool someone would actually use.', []),
      L('m5', 'Resources and prompts', 'Read-only data and reusable prompt templates.', 'Add one resource and one prompt to your server.', 'You know all three MCP primitives.', []),
      L('m6', 'Connect to an AI client & think about safety', 'Permissions, least privilege, prompt-injection risk.', 'Connect your server to an MCP-capable client, and write a short "security considerations" README section.', 'A demo-able, defensible project.', []),
    ],
  },
  {
    id: 'sysdesign', name: 'System Design Basics', tag: 'systemdesign', why: 'Even for internships, "how would you build a URL shortener?" is common. It also makes your projects sound senior.',
    lessons: [
      L('s1', 'Client-server, DNS, load balancers', 'What happens when you open a URL.', 'Draw the request path from browser to database from memory.', 'You can narrate a request end-to-end.', [R('System Design Primer', 'https://github.com/donnemartin/system-design-primer')]),
      L('s2', 'Caching & CDNs', 'Where to cache, invalidation, TTL.', 'Add Redis (or in-memory) caching to one endpoint and measure latency.', 'You can justify a cache.', [R('System Design Primer', 'https://github.com/donnemartin/system-design-primer')]),
      L('s3', 'Databases at scale: indexes, replication, sharding', 'Read replicas, partitioning, SQL vs NoSQL.', 'Write when you would choose each.', 'Clear trade-off language.', []),
      L('s4', 'Design a URL shortener', 'ID generation (base62), redirects, analytics, expiry, scale.', 'Write a one-page design doc: API, schema, ID strategy, caching, failure cases.', 'Your first interview-ready design.', []),
      L('s5', 'Rate limiting & queues', 'Token bucket; why queues smooth load.', 'Implement a token-bucket limiter in 30 lines.', 'You can design a rate limiter.', []),
      L('s6', 'Design a notification system / chat', 'Fan-out, retries, idempotency.', 'Sketch the architecture and list 3 failure modes.', 'Second design practised.', []),
    ],
  },
]

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]))
export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ ...l, trackId: t.id, track: t.name, tag: t.tag })))
export const LESSON_BY_ID = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]))
export const DEFAULT_TRACK_ORDER = ['git', 'sql', 'fastapi', 'testing', 'docker', 'llm', 'mcp', 'sysdesign']
