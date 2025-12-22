# Udemy Curriculum Planner

Turns a Udemy course URL into a structured lesson list and a daily study plan, then (optionally) pushes to Trello.

## What it does
- Fetches a course’s curriculum via Udemy’s public API (no scraping/AI).
- Groups lessons by section with durations.
- Builds a daily plan based on “hours per day” input.

## Getting started
1) Install deps: `npm install`
2) Run backend + frontend together: `npm run dev:full`
   - Frontend: http://localhost:5173
   - Backend proxy: http://localhost:3001
3) Paste a Udemy course URL and click “Extract lessons.”
4) Set “Daily hours” and build the study plan.

## Environment
- `.env` (optional): `PORT`/`BACKEND_PORT` to change backend port.
- No API keys required for Udemy curriculum fetch.

## Scripts
- `npm run dev:full` – start backend + Vite dev server.
- `npm run dev` – Vite only (requires backend running separately).
- `npm run server` – backend only.
- `npm run build` – type-check + production build.

## Notes
- Backend endpoints:
  - `GET /api/curriculum?url=<course_url>` → curriculum_context JSON.
  - `GET /api/health` → simple ok check.
- Study plan splits lessons sequentially into day buckets based on daily hours.
