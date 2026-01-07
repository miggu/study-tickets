# Study Tickets

Study Tickets helps you transform course curricula into personalized, manageable study plans, intelligently broken down by a specific daily time commitment you define (e.g., 1.5 hours, 1 hour). It then allows you to integrate these plans with organizing platforms.

## Current Focus (MVP) & Future Vision

Currently, Study Tickets is designed as a Minimum Viable Product (MVP) with a strong focus on:

- **Course Content:** Integrating with **Udemy** to extract course curricula.
- **Organization:** Sending structured study plans to **Trello** for easy management.

This specific focus allows for a robust and polished experience with these services. However, the vision for Study Tickets is much broader. In the future, the application aims to expand its integrations significantly, supporting:

- **More Course Platforms:** Beyond Udemy, to include other popular online learning platforms.
- **Diverse Organizing Tools:** Integrating with a wider array of task managers and project management platforms, not just Trello.

The goal is to evolve Study Tickets into a versatile tool for managing educational content and personal organization across various services.

## What it does

- Fetches a course’s curriculum via Udemy’s public API (no scraping/AI).
- Groups lessons by section with durations.
- Builds a daily plan based on “hours per day” input.

## Getting started

1. Install deps: `npm install`
2. Run backend + frontend together: `npm run dev`
   - Frontend: http://localhost:5173
   - Backend proxy: http://localhost:3001
3. Paste a Udemy course URL and click “Extract lessons.”
4. Set “Daily hours” and build the study plan.

## Docker

You can also run Study Tickets using Docker for a consistent development environment.

### 1. Build the image

```bash
docker build -t study-tickets .
```

### 2. Run the container

The container is configured to wait for your command. You have two main options:

- **Development Mode** (Hot-reloading):

  ```bash
  docker run -it -p 5173:5173 study-tickets npm run dev
  ```

- **Production Build** (Build the assets inside the container):
  ```bash
  docker run -it study-tickets npm run build
  ```

## Environment

- `.env` (optional): `PORT`/`BACKEND_PORT` to change backend port.
- **Trello API Credentials:** For Trello integration, you need both an API Key and a Token. These can be provided via environment variables (`TRELLO_API_KEY`, `TRELLO_TOKEN`) or, for local development, in a `dev-untracked/trello-secrets.json` file (e.g., `{ "apiKey": "YOUR_API_KEY", "token": "YOUR_TOKEN" }`).
- **Trello Debugging:** Set `DEBUG_TRELLO=true` in your `.env` file to enable detailed debugging messages from the Trello integration on the server.
- No API keys required for Udemy curriculum fetch.

## Scripts

- `npm run dev` – start backend + Vite dev server.
- `npm run client` – Vite only (requires backend running separately).
- `npm run server` – backend only.
- `npm run build` – type-check + production build.

## Notes

- Backend endpoints:
  - `GET /api/curriculum?url=<course_url>` → curriculum_context JSON.
  - `POST /api/trello/create-board` → Creates a new Trello board with the study plan.
  - `GET /api/health` → simple ok check.
- **Trello API Rate Limits:** Be aware that Trello's API has rate limits. When sending a large study plan, the server attempts to space out requests to avoid overwhelming the API, but very large plans or rapid successive calls may still encounter issues.
- Study plan splits lessons sequentially into day buckets based on daily hours.
