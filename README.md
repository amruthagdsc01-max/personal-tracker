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

## Notes

- Passwords are hashed with scrypt; login attempts are rate-limited per IP+email.
- The login token is kept in the browser's localStorage and lasts 30 days.
- Saving uses a revision number: if you edit on two devices, the older copy is not allowed to overwrite the newer one.
