# Playwright BDD Test Automation — SpecCheck

End-to-end test suite for the **SpecCheck** application covering the Document Dashboard and TestCase Dashboard.  
Stack: Python · Playwright · pytest-bdd (Gherkin BDD) · Page Object Model · pytest-html reports.

---

## Architecture

```
tests/
├── features/
│   ├── dashboard.feature              ← Document Dashboard BDD scenarios
│   ├── login.feature                  ← Login BDD scenarios
│   └── testCaseDashboard.feature      ← TestCase Dashboard BDD scenarios
├── pages/
│   ├── dashboard_page.py              ← DashboardPage — document upload, table, delete
│   ├── login_page.py                  ← LoginPage — login form interactions
│   └── testCaseDashboard_page.py      ← TestCaseDashboardPage — card grid, search
├── step_definitions/
│   ├── dashboard_steps.py             ← @given/@when/@then for dashboard.feature
│   ├── login_steps.py                 ← @given/@when/@then for login.feature
│   └── testCaseDashboard_steps.py     ← @given/@when/@then for testCaseDashboard.feature
├── fixtures/                          ← Static test-data files (add manually)
│   ├── sample_valid.pdf/png/jpg
│   ├── sample_invalid.exe/mp3         ← wrong extension
│   └── sample_oversized.pdf           ← file > 20 MB for size-limit testing
├── reports/                           ← Auto-generated (gitignored)
│   ├── report.html
│   └── screenshots/
├── conftest.py                        ← Shared fixtures and screenshot-on-failure hook
├── pytest.ini                         ← pytest / pytest-bdd configuration
├── test_dashboard.py                  ← scenarios() entry point for dashboard
├── test_testCaseDashboard.py          ← scenarios() entry point for testCaseDashboard
├── create_fixtures.py                 ← Helper to create valid sample files
├── wait_and_run.sh                    ← Docker readiness probe + pytest launcher
└── requirements.txt
```

**Pattern:** 1 Page class → 1 feature file → 1 step file → 1 test entry point.  
Adding a new page = add `pages/new_page.py` + `features/new_page.feature` + `step_definitions/new_page_steps.py` + `test_new_page.py`, then register the steps plugin in `conftest.py`.

---

## Feature Coverage

### Document Dashboard (`dashboard.feature`)

Tests the documents view of the app: login, page layout, file upload via file-input and drag-and-drop, file validation, and document delete. The production code under test is `test-case-generator/frontend/src/App.jsx` (documents section) and `test-case-generator/backend/server.js`.

### TestCase Dashboard (`testCaseDashboard.feature`)

Tests the test case card grid: page header, card layout, per-card elements (title, date, status badge, delete button), and keyword search filtering. The production code under test is `test-case-generator/frontend/src/TestCaseDashboard.jsx`.

---

## Setup

All commands are run from this `tests/` directory.

### 1. Prerequisites

- **Python 3.9–3.12** (Python 3.13+ is not supported yet by `playwright==1.44.0`)
- The app must be running (see **Start the application** below)

### 2. Create a virtual environment

Use Python 3.12 explicitly (if you have multiple versions installed):

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
playwright install chromium
```

### 4. Add fixture files

Place the following test files in the `fixtures/` directory before running the suite:

| File | Purpose |
|------|---------|
| `sample_valid.pdf` | Valid PDF with readable text |
| `sample_valid.png` | Valid PNG processable by Tesseract |
| `sample_valid.jpg` | Valid JPEG processable by Tesseract |
| `sample_oversized.pdf` | Any file > 20 MB (triggers size-limit rejection) |
| `sample_invalid.exe` | Any file with an unsupported extension |
| `sample_invalid.mp3` | Any file with an unsupported extension |

Run `python create_fixtures.py` once to ensure the `fixtures/` directory exists.

> Fixture files are required before step 5. Add them manually or generate placeholders with the helper script.

### 5. Configure login credentials

The `Given the user is logged in` step reads credentials from environment variables so the hardcoded values never live in source control.

```powershell
# Copy the example file and edit it with the real credentials
Copy-Item .env.example .env
notepad .env
```

`.env` is git-ignored. If you skip this step, the tests fall back to the defaults (`admin` / `pass`) that match the project's dev backend.

You can also pass the variables inline without a file:

```powershell
$env:TEST_USERNAME="admin"; $env:TEST_PASSWORD="pass"; pytest
```

### 6. Start the application

Open **two** terminals and keep them running:

```powershell
# Terminal 1 — backend (http://localhost:5001)
cd ..\test-case-generator\backend
npm install
node server.js

# Terminal 2 — frontend (http://localhost:5173)
cd ..\test-case-generator\frontend
npm install
npm run dev
```

> **Note:** When the backend is not running, the test suite activates a fetch mock that intercepts `/api/login` and `/api/upload` so upload and login scenarios still pass without a live server.

---

## Running Tests with Docker (Recommended)

Docker runs the full stack — backend, frontend, and test runner — automatically in isolated containers. No local Python, Node, or browser install required.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Navigate to the `test-case-generator` directory

```powershell
cd test-case-generator
```

### 2. Build and run all services + tests

```powershell
docker compose --profile test up --build
```

This will:
1. Build the backend, frontend, and test-runner Docker images
2. Start the backend (port `5001`) and frontend (port `5173`)
3. Wait until both services are ready
4. Run the full pytest suite automatically
5. Exit when tests finish

### 3. Run a single feature file (optional)

Set `PYTEST_ARGS` before the command to target one feature at a time:

```powershell
# TestCase Dashboard only
$env:PYTEST_ARGS="test_testCaseDashboard.py"; docker compose --profile test up --build

# Document Dashboard only
$env:PYTEST_ARGS="test_dashboard.py"; docker compose --profile test up --build

# Only management scenarios across all features
$env:PYTEST_ARGS="-m management"; docker compose --profile test up --build

# Reset to run the full suite
Remove-Item Env:PYTEST_ARGS
docker compose --profile test up --build
```

### 4. View the test report

After the run, the HTML report is written to your local machine at:

```
tests/reports/report.html
```

Open it:

```powershell
Start-Process "..\tests\reports\report.html"
```

### Useful Docker commands

| Goal | Command (run from `test-case-generator/`) |
|------|------------------------------------------|
| Run tests (build images first) | `docker compose --profile test up --build` |
| Run tests (skip rebuild) | `docker compose --profile test up` |
| Run tests and remove containers after | `docker compose --profile test run --rm test-runner` |
| Stop all containers | `docker compose --profile test down` |
| View live test output only | `docker compose --profile test logs -f test-runner` |

### Port reference

| Service | URL |
|---------|-----|
| Frontend (React/Vite) | `http://localhost:5173` |
| Backend (Node/Express) | `http://localhost:5001` |
| Test runner | No port — runs and exits |

### Troubleshooting Docker runs

| Problem | Fix |
|---------|-----|
| `pytest==X.X.X` conflicts with `pytest-playwright` | Pin `pytest` to `8.2.0` in `requirements.txt` — `pytest-playwright==0.5.0` requires `pytest<9.0.0` |
| Tests fail with login timeout | Vite may still be compiling — the runner waits 15 s after startup; rebuild with `--build` if it persists |
| `wait_and_run.sh: not found` | Ensure `tests/wait_and_run.sh` is committed to git (`git add tests/wait_and_run.sh`) |
| Port already in use | Stop any locally running backend/frontend before running Docker |
| `Cannot connect to auth server` | Backend container may not have started in time; re-run with `--build` |
| `PYTEST_ARGS` ignored, all tests run | Ensure `- PYTEST_ARGS` is listed under `environment:` in `test-case-generator/docker-compose.yml` |

---

## Running Tests Locally

All commands below are run from the `tests/` directory with the virtualenv active.

### Run the full suite

```powershell
.\venv\Scripts\Activate.ps1
pytest
```

### Run a single feature file

```powershell
pytest test_dashboard.py
pytest test_testCaseDashboard.py
```

### Run only smoke tests (fast sanity check)

```powershell
pytest -m smoke
```

### Run a specific feature area

```powershell
pytest -m upload
pytest -m validation
pytest -m management
pytest -m drag_drop
```

### Run a specific scenario by name

```powershell
pytest -k "Successful upload of valid document types"
pytest -k "User can search for test cases by keyword"
```

### Run in headed mode (see the browser)

```powershell
pytest --headed
```

### Run with slow motion for debugging

```powershell
pytest --headed --slowmo=500
```

---

## Headless vs Headed Mode

By default, tests run in **headless** mode — the browser runs invisibly in the background. This is faster and is the right choice for CI/CD pipelines.

**Headed** mode opens a real browser window so you can watch the test execute step by step. Use it when a test is failing and you need to see what's happening on screen.

### Quick reference

| Goal | Command |
|------|---------|
| Normal run (headless) | `pytest` |
| Watch the browser | `pytest --headed` |
| Watch slowly (500 ms between actions) | `pytest --headed --slowmo=500` |
| Watch one failing test | `pytest --headed -k "test name"` |
| Use Firefox instead of Chromium | `pytest --headed --browser=firefox` |

### Debugging a failing test

1. Activate the virtualenv: `.\venv\Scripts\Activate.ps1`
2. Run only the failing scenario in headed + slow motion:
   ```powershell
   pytest --headed --slowmo=500 -k "name of failing scenario"
   ```
3. Watch the browser — the window stays open until the step fails, then closes.
4. Check `reports/screenshots/` for the auto-captured failure screenshot.
5. Check `reports/report.html` for the full run report with the screenshot embedded.

### Making headed mode the default (optional)

If you want every `pytest` run to open a browser window, add `--headed` to `pytest.ini`:

```ini
[pytest]
addopts =
    --html=reports/report.html
    --self-contained-html
    -v
    --headed
```

> **Note:** Remove `--headed` from `pytest.ini` before pushing — CI runners have no display and will error.

---

## Reports

After every run, an HTML report is generated at:

```
tests/reports/report.html
```

Open it:

```powershell
Start-Process "reports\report.html"
```

**Failure screenshots** are automatically captured and embedded inline in the report.  
Raw PNG files are saved to `reports/screenshots/`.

---

## Scenario Tags

| Tag | Feature | Scenarios |
|-----|---------|-----------|
| `@smoke` | Both | Core happy-path — must pass before a full suite run |
| `@management` | Both | Page layout, table/card display, delete with confirm/cancel |
| `@upload` | Document Dashboard | File upload via file-input |
| `@validation` | Document Dashboard | Client-side format and size validation |
| `@drag_drop` | Document Dashboard | Drag-and-drop upload |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ConnectionError` / page blank | Ensure backend (`node server.js`) and frontend (`npm run dev`) are running |
| Login step fails / "Cannot connect to auth server" | Check `.env` credentials or set `TEST_USERNAME`/`TEST_PASSWORD` env vars (see Setup step 5) |
| `FileNotFoundError: fixture` | Add the required files to `fixtures/` (see Setup step 4) |
| `ModuleNotFoundError: pages` | Run `pytest` from the `tests/` directory, not from the repo root |
| OCR upload test fails | Ensure `sample_valid.jpg` and `sample_valid.png` contain readable text that Tesseract can process |
| PDF upload test fails | Ensure `sample_valid.pdf` contains readable text |
| TestCase Dashboard steps not found | Check that `step_definitions.testCaseDashboard_steps` is listed in `pytest_plugins` inside `conftest.py` |
