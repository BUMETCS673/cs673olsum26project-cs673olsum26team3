# SpecCheck — AI-Powered Test Case Generator

> **CS673 Software Engineering | Team 3 Project**
>
> SpecCheck is a web tool that helps software teams save time on testing. Instead of writing tests by hand, users upload product documents (PDFs or images), enter a user story, and the AI automatically generates accurate, structured test cases using RAG + GPT-4o.

---

## Key Features

- **Project Management** — Organize work into projects; each project has its own documents, user stories, and test cases.
- **Document Upload** — Upload PDFs and images (PNG/JPEG) per project. Text is extracted (pdf-parse / Tesseract OCR), chunked, embedded, and stored in MongoDB Atlas for retrieval.
- **AI Test Generation** — Enter a user story, and the system embeds it, runs a vector search over your documents (top 8 chunks), and calls GPT-4o to generate 5–15 structured test cases (happy path, negative, edge cases).
- **Manual Test Cases** — Create test cases by hand; auto-assigned IDs (`HU-001`, `HU-002`, …).
- **Document Management** — View, delete documents per project. Deleting cascades to associated chunks/vectors.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + Vite, Tailwind CSS, Lucide icons |
| **Backend** | Node.js / Express (port 5001) |
| **Database** | MongoDB Atlas — documents, chunks (vectors), user stories, test cases |
| **AI / Embeddings** | OpenAI API (GitHub Models endpoint) — GPT-4o + text-embedding-3-small |
| **Document Parsing** | pdf-parse, Tesseract.js (OCR for images) |
| **Test Automation** | Python 3.12 + Playwright + pytest-bdd (Gherkin BDD) |
| **CI/CD** | GitHub Actions — runs tests on every PR to `development` or `main` |

---

## Upload Constraints

- Max **10 files** per upload
- Max **20 MB** per file
- Supported formats: `.pdf`, `.png`, `.jpeg`, `.jpg`

---

## Environment Setup

### Backend `.env`

Create `test-case-generator/backend/.env`:

```
PORT=5001
MONGODB_URI=<your_mongodb_connection_string>
OPENAI_API_KEY=<your_key>
```

### Test Credentials `.env`

Create `tests/.env` (copy from `tests/.env.example`):

```
TEST_USERNAME=<username_of_your_test_account>
TEST_PASSWORD=<password_of_your_test_account>
```

This file is loaded automatically by `python-dotenv` when running tests locally. For CI, set these as GitHub Actions secrets (see [CI/CD](#cicd) below).

> The test suite does **not** require the backend or OpenAI to be running. All API calls are intercepted by an in-browser JS fetch mock, so tests pass without MongoDB, OpenAI, or any live server.

---

## Live Website

The app is deployed on Render. Free tier instances sleep after inactivity, so follow these steps:

1. **Wake the backend first** — open https://speccheck-backend.onrender.com/ and wait until you see `{"status":"ok"}` (can take up to 60 seconds)
2. **Open the frontend** — https://speccheck-frontend.onrender.com/
3. Log in and use the app normally

> If login fails on the first try, the backend may still be waking up. Wait a few seconds and try again.

---

## Running the App

### Full stack via Docker Compose (recommended)

```powershell
cd test-case-generator
docker compose up --build
```

Frontend → `http://localhost:5173` | Backend → `http://localhost:5001`

### Backend only

```powershell
cd test-case-generator/backend
npm install
node src/server.js
```

### Frontend only

```powershell
cd test-case-generator/frontend
npm install
npm run dev
# Proxies /api/* → http://localhost:5001
```

---

## Test Automation

End-to-end UI tests use **Python 3.12 + Playwright + pytest-bdd** (Gherkin BDD).

```
tests/
├── features/              # Gherkin scenarios
│   ├── login.feature
│   └── dashboard.feature
├── pages/                 # Page Object Model
│   ├── login_page.py
│   └── dashboard_page.py
├── step_definitions/      # @given/@when/@then implementations
│   ├── login_steps.py
│   └── dashboard_steps.py
├── fixtures/              # Sample files (PDF, PNG, JPG, invalid, oversized)
├── reports/               # HTML report + failure screenshots (auto-generated)
├── conftest.py            # Shared fixtures, mock API, dotenv loader
├── requirements.txt       # Python dependencies
└── .env.example           # Credentials template
```

### Run with Docker (matches CI exactly)

```powershell
# From the test-case-generator/ directory
docker compose --profile test run --rm test-runner
# Report → tests/reports/report.html
```

### Run locally (without Docker)

First ensure `tests/.env` exists with valid credentials, then from `tests/`:

```powershell
# One-time setup
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium

# Run all tests
pytest

# Subsets by marker
pytest -m smoke        # core happy-path only
pytest -m upload       # upload scenarios
pytest -m validation   # format/size rejection
pytest -m management   # delete flows
pytest -m drag_drop    # drag-and-drop

# Debugging
pytest --headed --slowmo=500   # visible browser, slow motion
```

> **Note:** The test suite always uses a JS fetch mock for all API calls (`/api/login`, `/api/projects`, `/api/upload`). No running backend, MongoDB connection, or OpenAI key is needed to run tests.

### Test markers

| Marker | Scenarios covered |
| :--- | :--- |
| `smoke` | Login, upload valid file, delete with confirm |
| `upload` | Single and multi-file upload |
| `validation` | Unsupported format, oversized file, mixed batch |
| `management` | Table headers, delete confirm/cancel, empty state |
| `drag_drop` | Drag-over CSS class, valid/invalid file drop |

---

## Unit Tests

In addition to the BDD end-to-end tests, the project includes unit tests for both the backend routes and frontend React components.

### Frontend Unit Tests (Vitest + React Testing Library)

```powershell
cd test-case-generator/frontend
npm install
npm run test:run
```

Runs 97 tests across 6 component test files. To run in watch mode:

```powershell
npm run test
```

### Backend Unit Tests (Jest + Supertest)

```powershell
cd test-case-generator/backend
npm install
npm test
```

Runs 65 tests across 5 route test files. No running server, MongoDB, or OpenAI key is required — all dependencies are mocked.

### Unit Test Files

**Frontend** (`test-case-generator/frontend/src/__tests__/`)

| File | Tests | What it covers |
| :--- | :---: | :--- |
| `Login.test.jsx` | 15 | Login, register, forgot password flows, validation, API errors |
| `ProjectsView.test.jsx` | 13 | Project cards, empty state, new project modal, navigation |
| `DocumentsView.test.jsx` | 10 | Document list, upload zone, empty state, file input |
| `UserStoryInputView.test.jsx` | 17 | Form validation, checkbox interaction, API call, warning messages |
| `TestCasesView.test.jsx` | 16 | Test case table, search/filter, row expansion, Create modal |
| `TestCaseManagementView.test.jsx` | 24 | Multi-filter, status pills, edit modal, archive/active filtering |

**Backend** (`test-case-generator/backend/__tests__/`)

| File | Tests | What it covers |
| :--- | :---: | :--- |
| `login.test.js` | 15 | POST /login, /register, /change-password — success and error paths |
| `projects.test.js` | 11 | GET/POST/DELETE /projects with cascade delete |
| `upload.test.js` | 10 | File upload validation, PDF processing, GET docs, DELETE |
| `testGen.test.js` | 11 | AI/manual ID assignment (AI-001, HU-001), no-context warning |
| `testCaseManagement.test.js` | 14 | GET all, PATCH edit, archive toggle, DELETE test cases |

---

## CI/CD

GitHub Actions (`.github/workflows/test-automation.yml`) triggers on PRs to `development` or `main`:

1. Creates `test-case-generator/backend/.env` from repository secrets
2. Creates `tests/.env` from repository secrets
3. Runs `docker compose --profile test run --rm test-runner`
4. Uploads the HTML test report as an artifact (14-day retention)

### Required GitHub Actions secrets

Go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `OPENAI_API_KEY` | OpenAI / GitHub Models API key |
| `TEST_USERNAME` | Username of the test account in MongoDB |
| `TEST_PASSWORD` | Password of the test account |

---

## Git Workflow

### Branch strategy

| Branch | Purpose |
| :--- | :--- |
| `main` | Stable demos only — never commit directly |
| `development` | Integration branch — PRs require passing CI + 1 approval |
| `feature/*` | New features — branch from and PR back to `development` |
| `bugfix/*` | Bug fixes — same flow as feature branches |
| `test/*` | Test automation work |

### Commit message prefix (required)

Every commit message must start with one of:

- `[HUMAN]` — written entirely by a team member
- `[AI]` — generated entirely by an AI tool
- `[HYBRID]` — written by human, improved with AI

Example: `[HYBRID] feat: add cascade delete for project documents`

---

## Project Links

- **GitHub Repository:** [cs673olsum26project-cs673olsum26team3](https://github.com/BUMETCS673/cs673olsum26project-cs673olsum26team3)
- **Risk Sheet:** [Google Sheets](https://docs.google.com/spreadsheets/d/1TGf5X4D6LBQliZie8Sje-MLOzPqzJq3oUjNYyLj5sdw/edit?usp=sharing)
