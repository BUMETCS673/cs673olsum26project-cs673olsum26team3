# Playwright BDD Test Automation — Document Dashboard

End-to-end test suite for the **Document Dashboard** application.  
Stack: Python · Playwright · pytest-bdd (Gherkin BDD) · Page Object Model · pytest-html reports.

---

## Architecture

```
tests/
├── features/
│   └── dashboard.feature       ← Gherkin scenarios (1 per page object)
├── pages/
│   └── dashboard_page.py       ← DashboardPage — all UI interactions
├── step_definitions/
│   └── dashboard_steps.py      ← @given/@when/@then mapped to DashboardPage
├── fixtures/                   ← Static test-data files (add manually)
│   ├── sample_valid.pdf/png/jpg
│   ├── sample_invalid.exe/mp3  ← wrong extension
│   └── sample_oversized.pdf    ← file > 20 MB for size-limit testing
├── reports/                    ← Auto-generated (gitignored)
│   ├── report.html
│   └── screenshots/
├── conftest.py                 ← Fixtures + screenshot-on-failure hook
├── pytest.ini                  ← pytest / pytest-bdd configuration
├── test_dashboard.py           ← scenarios() entry point
├── create_fixtures.py          ← Helper to create valid sample files
└── requirements.txt
```

**Pattern:** 1 Page class → 1 feature file → 1 step file.  
Adding a new page = add `pages/new_page.py` + `features/new_page.feature` + `step_definitions/new_page_steps.py`.

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

### 5. Start the application

Open **two** terminals and keep them running:

```powershell
# Terminal 1 — backend (http://localhost:5000)
cd ..\test-case-generator\backend
npm install
node server.js

# Terminal 2 — frontend (http://localhost:5173)
cd ..\test-case-generator\frontend
npm install
npm run dev
```

---

## Running Tests

All commands below are run from the `tests/` directory with the virtualenv active.

### Run the full suite

```powershell
.\venv\Scripts\Activate.ps1
pytest
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

| Tag | Scenarios |
|-----|-----------|
| `@smoke` | Core happy-path — must pass before a full suite run |
| `@upload` | File upload via file-input |
| `@validation` | Client-side format and size validation |
| `@management` | Table display, delete with confirm/cancel, empty state |
| `@drag_drop` | Drag-and-drop upload |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ConnectionError` / page blank | Ensure backend (`node server.js`) and frontend (`npm run dev`) are running |
| `FileNotFoundError: fixture` | Add the required files to `fixtures/` (see Setup step 4) |
| `ModuleNotFoundError: pages` | Run `pytest` from the `tests/` directory, not from the repo root |
| OCR upload test fails | Ensure `sample_valid.jpg` and `sample_valid.png` contain readable text that Tesseract can process |
| PDF upload test fails | Ensure `sample_valid.pdf` contains readable text |
