# ezze — your daily mentor

React (Vite) frontend + FastAPI backend. Accounts and progress are stored on the server (SQLite locally, PostgreSQL in production). In production a single process serves both the site and the API.

## Run locally

```bash
npm install
pip install -r requirements-dev.txt

# terminal 1 — API on :8000
SECRET_KEY=any-long-random-string python -m uvicorn server.app:app --reload --port 8000

# terminal 2 — site on :5173 (proxies /api to :8000)
npm run dev
```

Without the API running you can still choose "Continue without an account" (progress stays in that browser).

## Tests

```bash
npm test                 # frontend/domain logic
python -m pytest server  # API: auth, isolation, saving
```

## Deploy on GitHub Pages (recommended: free, never sleeps)

This publishes ezze as a static site. There is no login or server: progress is saved in the browser, so use **Settings → Back up now** regularly (the app reminds you every 14 days).

1. Push this repo to GitHub (branch `main`).
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/pages.yml` (tests, build, publish). The site appears at `https://<your-username>.github.io/<repo-name>/` — see the **Actions** tab for progress and the link.

To build the same static version locally: `VITE_STATIC=1 VITE_BASE=/<repo-name>/ npm run build`.

## Deploy with login + server storage (Render, optional)

1. Push this folder to a GitHub repo.
2. On render.com: **New → Blueprint**, pick the repo. `render.yaml` creates the web service and a PostgreSQL database and generates `SECRET_KEY` for you.
3. Open the URL, create your account, then (optional) set `ALLOW_SIGNUP=false` in the service's environment so nobody else can register.

Any host that runs Docker works the same way: build the `Dockerfile`, set `SECRET_KEY`, and optionally `DATABASE_URL`. See `.env.example`.

Free-tier hosts may sleep when idle (first load can take ~30 s), and free databases can expire — use **Settings → Export backup** now and then.

## System Design module (the **Design** tab)

A one-hour-a-day System Design course inside ezze: 25 lessons in 5 stages (how the web works → databases → core components → distributed systems → interview method), each taught WHY → WHAT → HOW → WHEN → TRADE-OFF across four gated levels (Understand, Explore, Apply, Master), with think-first prompts, quizzes, an explain-it-back step and a challenge. Plus a concept dependency map, 8 working labs (load balancer, cache, replication, sharding, queue, rate limiter, estimator, architecture playground), 4 guided design problems with a scored 8-dimension mock interview, per-stage practical assessments, an interview question bank, real-world case studies, spaced repetition and a lesson-grounded mentor.

- Progress is stored in the same saved state as the rest of ezze (`state.sd`): browser storage on GitHub Pages, your account when logged in. Mastery comes only from evidence (quizzes, self-checked explanations, scenarios, reviews), never from opening pages.
- Content lives in `src/data/sd/`, logic in `src/domain/sd/` (tested: `npm test`), UI in `src/pages/sd/`. A curriculum test checks prerequisites, quiz answers and rubrics.
- Free-text answers are scored by self-assessment against a rubric; keyword matching only flags suggestions.
- Optional AI mentor: set `MENTOR_API_KEY` (and optionally `MENTOR_MODEL`) on the server. The key stays server-side and the model is told to answer only from the lesson text. Without it, the built-in mentor (lesson retrieval, hints, follow-ups) works everywhere, including GitHub Pages.
- Not included yet: intermediate and advanced full design problems (WhatsApp, YouTube, Uber, ...). Four beginner problems are built; the mock mode and rubric are ready for more.

## Notes

- Passwords are hashed with scrypt; login attempts are rate-limited per IP+email.
- The login token is kept in the browser's localStorage and lasts 30 days.
- Saving uses a revision number: if you edit on two devices, the older copy is not allowed to overwrite the newer one.
