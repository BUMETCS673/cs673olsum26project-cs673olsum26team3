# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SpecCheck** is an AI-powered test case generator (CS673 capstone, Team 3). Users upload spec documents (PDF/PNG/JPEG), enter user stories, and the system uses RAG + GPT-4o to generate structured test cases.

## Commit Message Convention

Every commit message **must** start with one of these prefixes:
- `[HUMAN]` — written entirely by a team member
- `[AI]` — generated entirely by an AI tool
- `[HYBRID]` — written by human, improved with AI

Example: `[HYBRID] feat: add cascade delete for project documents`

## Git Branching

- `main` — stable demos only
- `development` — integration branch; PRs require passing CI + 1 approval
- `feature/*`, `bugfix/*` — branch from and PR back to `development`

## Environment Setup

Backend requires a `.env` file at `test-case-generator/backend/.env`:
```
PORT=5001
MONGODB_URI=<your_mongodb_connection_string>
OPENAI_API_KEY=<your_key>
```

Tests require a `.env` file at `tests/.env` (copy from `tests/.env.example`):
```
TEST_USERNAME=<username>
TEST_PASSWORD=<password>
```

## Development Commands

### Backend (Node.js/Express, port 5001)
```powershell
cd test-case-generator/backend
npm install
node src/server.js
```

### Frontend (React + Vite, port 5173)
```powershell
cd test-case-generator/frontend
npm install
npm run dev
# Proxies /api/* → http://localhost:5001
```

### Full stack via Docker Compose
```powershell
cd test-case-generator
docker compose up --build
```

## Running Tests

Tests use **Python 3.12 + Playwright + pytest-bdd** (Gherkin BDD). Run from the `tests/` directory.

### With Docker (matches CI)
```powershell
cd test-case-generator
docker compose --profile test run --rm test-runner
# Report generated at tests/reports/report.html
```

### Locally
```powershell
cd tests
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium

pytest                          # all tests
pytest -m smoke                 # smoke tests only
pytest -m upload                # upload tests only
pytest --headed --slowmo=500    # visible browser, slow motion
pytest tests/test_login.py      # single file
```

**Available markers:** `smoke`, `upload`, `validation`, `management`, `drag_drop`

HTML report with screenshots is auto-generated at `tests/reports/report.html`.

## Architecture

The app is a standard 3-tier SPA:

```
React SPA (port 5173)
    ↓ /api/* proxy
Express API (port 5001)
    ↓
MongoDB (Atlas) — users, projects, documents, chunks (vectors), user stories
    ↓
OpenAI API (GitHub Models endpoint) — GPT-4o + text-embedding-3-small
```

**Key backend routes** (`test-case-generator/backend/src/routes/`):
- `login.js` — `/api/login`, `/api/register`, `/api/change-password`
- `upload.js` — `/api/upload` — extracts text (pdf-parse / Tesseract OCR), chunks, embeds, stores vectors
- `testGen.js` — `/api/generate-tests` — embeds user story, runs MongoDB Atlas Vector Search (top 8 chunks), calls GPT-4o, parses and saves test cases
- `projects.js` — `/api/projects` — CRUD with cascade delete (Chunks → Documents → UserStories → Project)

**Frontend views** (`test-case-generator/frontend/src/views/`): Login → Projects → Documents → UserStoryInput → TestCases. All view routing and API calls are centralized in `App.jsx`.

**RAG pipeline:** On upload, text is chunked (1000 chars, 200 overlap) and each chunk is embedded with `text-embedding-3-small` and stored in MongoDB Atlas. At generation time, the user story is embedded and a `$vectorSearch` query retrieves the top 8 relevant chunks as context. Falls back to full document scan if no vector results exist.

**Test case IDs:** AI-generated cases get `AI-001, AI-002, ...`; manually created cases get `HU-001, HU-002, ...`.

## CI/CD

GitHub Actions (`.github/workflows/test-automation.yml`) triggers on PRs to `development` or `main`:
1. Creates backend `.env` from repository secrets (`MONGODB_URI`, `OPENAI_API_KEY`)
2. Creates tests `.env` from secrets (`TEST_USERNAME`, `TEST_PASSWORD`)
3. Runs `docker compose --profile test run --rm test-runner`
4. Uploads test report artifact (14-day retention)

## Upload Constraints

- Max 10 files per upload request
- Max 20 MB per file
- Supported formats: `.pdf`, `.png`, `.jpeg`
