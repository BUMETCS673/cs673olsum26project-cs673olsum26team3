# SpecCheck — AI-Powered Test Case Generator

> **CS673 Software Engineering | Team 3 Project**
>
> SpecCheck is a web tool that helps software teams save time on testing. Instead of writing tests by hand, users can upload product documents (like PDFs or images). The AI reads these files to understand the product, then automatically writes accurate test steps from a user story.

---

## 🚀 Key Features

### 👥 User Roles
*   **QA Engineer:** Can upload documents, generate test cases, and check the results.
*   **QA Lead:** Can do everything a QA Engineer does, plus see charts that show how new changes might impact old features.
*   **Developer:** Can view finished test cases to understand the rules before writing code.

### 🧠 Core Functions
*   **Document Upload & Memory:** Upload PDFs and images (PNG/JPEG). The system reads the text and saves it into a smart database so the AI can use it as background knowledge.
*   **Context Search:** When you type a user story, the app automatically finds the right information from your uploaded files to guide the AI.
*   **Smart Test Generation:** Creates 5 to 15 targeted tests (happy paths, bad inputs, and edge cases). You can edit, approve, or delete the tests before saving them.
*   **Document Dashboard:** View and manage your uploaded files. If you delete a file, the AI immediately forgets that information.
*   **Easy Export (Coming Soon):** Download test cases as CSV or Text files to import them directly into Jira or TestRail.

---

## 🛠️ Technology Stack

| Part | Tools Used |
| :--- | :--- |
| **Frontend** | JavaScript, HTML, CSS |
| **Backend** | Node.js / Express *(built to connect smoothly with Django setup)* |
| **Database** | MongoDB & Vector Database (for document memory) |
| **AI Tools** | OpenAI API / Claude API, `pdf-parse`, `Tesseract.js` (for reading image text) |
| **Management** | Jira, GitHub Issues |
| **Testing** | Playwright (for UI tests), PyTest (for backend tests) |

---

## 📐 Limits & Goals

### System Limits
*   Upload up to **10 files** at one time.
*   Each file must be smaller than **20 MB**.
*   Supported file formats: `.pdf`, `.png`, `.jpeg`.

### Speed Goals
*   Dashboard loading: Less than `2 seconds`.
*   File reading and saving: Less than `10 seconds per file`.
*   AI test generation: Less than `15 seconds`.

---

## 💻 Git & Code Rules

### 🌿 Branch Strategy
*   `main`: Safe code for live demos. We never write code directly here.
*   `development`: The main workplace. All features must be tested here first.
*   `feature/feature-name`: For working on a single task.
*   `bugfix/bug-name`: For fixing problems found during testing.

### 📝 Commit Message Labels
Every code save (commit) must start with one of these words so the team knows how the code was made:
*   `[HUMAN]` — Written 100% by a team member.
*   `[AI]` — Generated completely by an AI tool.
*   `[HYBRID]` — Written by a human and improved with AI help.

### 🔄 CI/CD Code Safety
*   We use **GitHub Actions** to automatically build and test the app every time someone wants to merge code.
*   Your code can only merge into the `development` branch if it **passes all tests** and gets at least **1 approval** from a teammate.


## 📁 Project Structure

```
cs673olsum26project-cs673olsum26team3/
│
├── .github/
│   └── workflows/
│       └── test-automation.yml        ← GitHub Actions CI/CD pipeline
│
├── app/                               ← Django backend (early prototype)
│   ├── manage.py
│   └── speccheck/
│       ├── settings.py
│       ├── urls.py
│       ├── views.py
│       └── wsgi.py
│
├── doc/                               ← Project documentation
│   ├── CS673_SDD_team3.docx           ← Software Design Document
│   ├── CS673_STD_team3.docx           ← Software Test Document
│   ├── CS673_SPPP_team3.docx          ← Project Plan
│   ├── CS673_MeetingMinutes_team3.docx
│   └── CS673_ProgressReport_team3.xlsx
│
├── demo/
│   └── Iteration1DemoLink.md
│
├── test-case-generator/               ← Main application (React + Node.js)
│   ├── docker-compose.yml             ← Orchestrates backend, frontend, and test runner
│   │
│   ├── backend/                       ← Node.js / Express API
│   │   ├── Dockerfile
│   │   ├── server.js                  ← Login and file upload API endpoints
│   │   ├── package.json
│   │   └── eng.traineddata            ← Tesseract OCR language data
│   │
│   └── frontend/                      ← React / Vite SPA
│       ├── Dockerfile
│       ├── vite.config.js
│       ├── package.json
│       ├── index.html
│       └── src/
│           ├── App.jsx                ← App shell, login form, Document Dashboard
│           ├── App.css                ← Global styles
│           ├── TestCaseDashboard.jsx  ← Test Case card grid, search, archive, delete
│           ├── Login.jsx
│           ├── main.jsx
│           └── test/                  ← Vitest unit tests
│               ├── setup.js
│               └── TestCaseDashboard.test.jsx
│
├── tests/                             ← Playwright BDD end-to-end test suite
│   ├── Dockerfile                     ← Test runner container
│   ├── wait_and_run.sh                ← Readiness probe + pytest launcher
│   ├── conftest.py                    ← Shared fixtures and screenshot-on-failure hook
│   ├── pytest.ini                     ← pytest / pytest-bdd configuration
│   ├── requirements.txt               ← Python dependencies
│   ├── README.md                      ← Full test setup and usage guide
│   │
│   ├── features/                      ← Gherkin BDD specifications
│   │   ├── dashboard.feature          ← Document Dashboard scenarios
│   │   ├── login.feature              ← Login scenarios
│   │   └── testCaseDashboard.feature  ← TestCase Dashboard scenarios
│   │
│   ├── pages/                         ← Page Object Model classes
│   │   ├── dashboard_page.py          ← Document Dashboard interactions
│   │   ├── login_page.py              ← Login form interactions
│   │   └── testCaseDashboard_page.py  ← TestCase card grid interactions
│   │
│   ├── step_definitions/              ← @given/@when/@then implementations
│   │   ├── dashboard_steps.py
│   │   ├── login_steps.py
│   │   └── testCaseDashboard_steps.py
│   │
│   ├── fixtures/                      ← Static files used by upload/validation tests
│   │   ├── sample_valid.pdf/png/jpg
│   │   ├── sample_invalid.exe/mp3
│   │   └── sample_oversized.pdf
│   │
│   ├── test_dashboard.py              ← Entry point for dashboard.feature
│   ├── test_login.py                  ← Entry point for login.feature
│   └── test_testCaseDashboard.py      ← Entry point for testCaseDashboard.feature
│
├── Dockerfile                         ← Root-level Django container
├── docker-compose.yml                 ← Root-level Django + MongoDB compose
├── requirements.txt                   ← Python dependencies (Django layer)
├── README.md                          ← This file
└── team.md                            ← Team roster and roles
```

---

## 🧪 Running Unit Tests

Frontend unit tests use **Vitest** and **React Testing Library**.

```bash
cd test-case-generator/frontend
npm test
```

To run in watch mode during development:

```bash
npm run test:watch
```

The test suite covers the **Test Case Dashboard** feature:

| Test | What it checks |
| :--- | :--- |
| Initial render | All 10 mock test cases are displayed and stats bar shows correct counts |
| Search by title | Typing a keyword filters cards to only matching titles |
| Status filter | Selecting a status (e.g. Draft) shows only cards with that status |
| Archive toggle | Clicking Archive on an Active card switches the button to Restore |
| Delete with confirm | Confirming deletion removes the card and decreases the total count |
## 🧪 Test Automation

End-to-end UI tests are written with **Playwright + pytest-bdd** (Gherkin BDD) and live in the `tests/` folder.

```
tests/
├── features/          ← Gherkin scenarios (.feature files)
├── pages/             ← Page Object Model classes
├── step_definitions/  ← @given/@when/@then step implementations
├── fixtures/          ← Sample files used by tests (PDF, PNG, JPG, EXE, MP3)
├── reports/           ← Auto-generated HTML report + failure screenshots
├── conftest.py        ← Shared fixtures and hooks
├── requirements.txt   ← Python dependencies
└── wait_and_run.sh    ← Docker readiness probe + pytest launcher
```

### Running Tests with Docker (Recommended)

Docker spins up the full stack automatically — no local Python or Node install needed.

**Step 1 — Navigate to the app directory:**
```powershell
cd test-case-generator
```

**Step 2 — Build and run everything:**
```powershell
docker compose --profile test up --build
```

This starts the backend (`localhost:5001`), frontend (`localhost:5173`), and the test runner. Tests execute automatically once services are ready.

**Step 3 — View the report:**
```powershell
# From the repo root
Start-Process "tests\reports\report.html"
```

### Running Tests Locally (without Docker)

Start backend and frontend first, then from the `tests/` directory:

```powershell
# Install dependencies (one time)
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium

# Run the full suite
pytest

# Run only smoke tests
pytest -m smoke

# Run with a visible browser (for debugging)
pytest --headed
```

> Full setup instructions and troubleshooting are in [`tests/README.md`](tests/README.md).



## 🔗 Project Links

*   **GitHub Repository:** [Team 3 Code](https://github.com/BUMETCS673/cs673olsum26project-cs673olsum26team3)
*   **Risk Sheet:** [Google Sheets Link](https://docs.google.com/spreadsheets/d/1TGf5X4D6LBQliZie8Sje-MLOzPqzJq3oUjNYyLj5sdw/edit?usp=sharing)
