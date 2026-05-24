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
├── fixtures/                   ← Static test-data files
│   ├── sample_valid.pdf/png/jpg
│   ├── sample_invalid.exe/mp3  ← wrong extension (zero bytes)
│   └── sample_oversized.pdf    ← 21 MB blob for size-limit testing
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

### 4. Generate sample fixture files (first time only)

```powershell
python create_fixtures.py
```

This creates `fixtures/sample_valid.pdf`, `fixtures/sample_valid.png`, and  
`fixtures/sample_valid.jpg`. The invalid and oversized fixtures are already present.

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
| `FileNotFoundError: fixture` | Run `python create_fixtures.py` to create missing fixture files |
| `ModuleNotFoundError: pages` | Run `pytest` from the `tests/` directory, not from the repo root |
| OCR upload test fails | The `sample_valid.jpg/png` files are minimal; Tesseract returns empty text but should not error. If it does, replace with a real image containing text |
| PDF upload test fails | Replace `sample_valid.pdf` with a real PDF containing readable text |
