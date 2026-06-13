"""Root conftest: fixtures, screenshot-on-failure hook, and step-definition registration."""
from __future__ import annotations

import json
import os
import re
from datetime import datetime
from pathlib import Path

import pytest
from dotenv import load_dotenv

from pages.dashboard_page import DashboardPage
from pages.login_page import LoginPage
from pages.test_cases_page import TestCasesPage

# Load tests/.env into os.environ for local runs (no-op when already set by CI/Docker)
load_dotenv(Path(__file__).parent / ".env")

pytest_plugins = [
    "step_definitions.dashboard_steps",
    "step_definitions.login_steps",
    "step_definitions.test_cases_steps",
]

TESTS_DIR = Path(__file__).parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
SCREENSHOTS_DIR = TESTS_DIR / "reports" / "screenshots"


# ─────────────────────────────────── Fixtures ──────────────────────────────────


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.environ.get("BASE_URL", "http://localhost:5173")


@pytest.fixture
def login_page(page, base_url):
    """Navigate to the login page and return a LoginPage instance."""
    lp = LoginPage(page)
    lp.navigate(base_url)
    return lp


@pytest.fixture(scope="session")
def test_credentials() -> dict:
    """Login credentials from tests/.env (or env vars set by CI/Docker).

    Copy tests/.env.example → tests/.env and fill in real values for local runs.
    In GitHub Actions, set TEST_USERNAME and TEST_PASSWORD as repository secrets.
    """
    return {
        "username": os.environ.get("TEST_USERNAME", "admin"),
        "password": os.environ.get("TEST_PASSWORD", "pass"),
    }


@pytest.fixture(scope="session")
def fixture_path():
    """Factory that returns the absolute path to a file inside tests/fixtures/."""
    def _get(filename: str) -> str:
        return str(FIXTURES_DIR / filename)
    return _get


@pytest.fixture
def dialog_messages() -> list[str]:
    """Shared mutable list; steps append captured dialog messages here."""
    return []


@pytest.fixture
def row_count_store() -> dict:
    """Mutable store for sharing the 'initial row count' between When/Then steps."""
    return {}


@pytest.fixture
def dashboard_page(page, base_url, mock_upload_api):
    """Navigate to the app root and return a DashboardPage instance."""
    dp = DashboardPage(page)
    dp.navigate(base_url)
    return dp


@pytest.fixture
def test_cases_page(page, base_url, mock_upload_api):
    """Navigate to the app root and return a TestCasesPage instance."""
    tc = TestCasesPage(page)
    tc.navigate(base_url)
    return tc


# ──────────────────────────── Upload API mock ──────────────────────────────────


@pytest.fixture(autouse=True)
def mock_upload_api(page, test_credentials):
    """Intercept all backend API calls with an in-browser JS fetch mock.

    These are BDD UI tests — they verify application behaviour, not backend
    integration. Using a mock makes the suite independent of OpenAI, MongoDB,
    and network conditions so it runs reliably locally and in CI.

    Handles:
      POST /api/login       — credential-aware (correct creds → 200, wrong → 401)
      GET  /api/projects    — returns one test project so Documents view is reachable
      POST /api/projects    — creates a project (used by dashboard tests)
      GET  /api/upload/:id  — returns the current in-memory document list
      POST /api/upload      — adds uploaded files to the in-memory store
      DELETE /api/upload/:id — removes document from the in-memory store
    """
    test_user = json.dumps(test_credentials["username"])
    test_pass = json.dumps(test_credentials["password"])

    page.add_init_script(f"""
        (() => {{
            const TEST_USERNAME = {test_user};
            const TEST_PASSWORD = {test_pass};
            const TEST_PROJECT_ID = 'mock-project-001';
            const TEST_PROJECT = {{
                _id: TEST_PROJECT_ID,
                id: TEST_PROJECT_ID,
                name: 'Mock Test Project',
                description: 'Auto-created for test automation',
                createdAt: new Date().toISOString()
            }};

            // In-memory document store — seeded with one doc so delete tests always have a row
            let mockDocuments = [{{
                id: 'mock-seed-doc-001',
                name: 'seed_document.pdf',
                uploadedAt: new Date().toISOString(),
                status: 'Ready'
            }}];

            const _origFetch = window.fetch;
            window.fetch = async function(url, options) {{
                const method = (options && options.method && options.method.toUpperCase()) || 'GET';
                const urlStr = typeof url === 'string' ? url : url.toString();

                // --- POST /api/login ---
                if (urlStr.includes('/api/login') && method === 'POST') {{
                    let body = {{}};
                    try {{ body = JSON.parse(options.body); }} catch(e) {{}}
                    if (body.username === TEST_USERNAME && body.password === TEST_PASSWORD) {{
                        return new Response(
                            JSON.stringify({{ success: true, user: {{ id: 'u1', username: TEST_USERNAME }} }}),
                            {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                        );
                    }}
                    return new Response(
                        JSON.stringify({{ success: false, message: 'Incorrect username or password' }}),
                        {{ status: 401, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- GET /api/projects ---
                if (urlStr.includes('/api/projects') && method === 'GET') {{
                    return new Response(
                        JSON.stringify([TEST_PROJECT]),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- POST /api/projects ---
                if (urlStr.includes('/api/projects') && method === 'POST') {{
                    let body = {{}};
                    try {{ body = JSON.parse(options.body); }} catch(e) {{}}
                    const newProject = {{ ...TEST_PROJECT, ...body, _id: 'mock-new-' + Date.now() }};
                    return new Response(
                        JSON.stringify(newProject),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- DELETE /api/upload/:id ---
                if (urlStr.includes('/api/upload/') && method === 'DELETE') {{
                    const docId = urlStr.split('/api/upload/')[1];
                    mockDocuments = mockDocuments.filter(d => d.id !== docId);
                    return new Response(
                        JSON.stringify({{ message: 'Document deleted successfully.' }}),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- GET /api/upload/:projectId ---
                if (urlStr.includes('/api/upload/') && method === 'GET') {{
                    return new Response(
                        JSON.stringify(mockDocuments),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- POST /api/upload ---
                if (urlStr.includes('/api/upload') && method === 'POST') {{
                    const body = options && options.body;
                    const files = [];
                    if (body instanceof FormData) {{
                        for (const [, value] of body.entries()) {{
                            if (value instanceof File) files.push(value);
                        }}
                    }}
                    const today = new Date().toISOString();
                    const newDocs = files.map(function(f, i) {{
                        const doc = {{
                            id: 'mock-doc-' + Date.now() + '-' + i,
                            name: f.name,
                            uploadedAt: today,
                            status: 'Ready'
                        }};
                        mockDocuments.push(doc);
                        return doc;
                    }});
                    return new Response(
                        JSON.stringify({{
                            message: 'Files uploaded and processed successfully!',
                            data: newDocs
                        }}),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- GET /api/test-cases/all (management dashboard) ---
                if (urlStr.includes('/api/test-cases/all') && method === 'GET') {{
                    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
                    const yesterday = new Date(Date.now() - 86400000).toISOString();
                    const allTCs = [
                        {{
                            id: 'AI-001', storyId: 'story-001',
                            projectId: TEST_PROJECT_ID, projectName: 'Mock Test Project',
                            title: 'Verify successful login with valid credentials',
                            type: 'Functional', priority: 'High',
                            preconditions: 'User has a registered account',
                            steps: ['Navigate to login page', 'Enter valid credentials', 'Click Sign In'],
                            expectedResults: 'User is redirected to the projects dashboard',
                            createdAt: twoDaysAgo, archived: false, isManual: false
                        }},
                        {{
                            id: 'AI-002', storyId: 'story-001',
                            projectId: TEST_PROJECT_ID, projectName: 'Mock Test Project',
                            title: 'Verify login fails with incorrect password',
                            type: 'Negative', priority: 'High',
                            preconditions: 'User has a registered account',
                            steps: ['Navigate to login page', 'Enter wrong password', 'Click Sign In'],
                            expectedResults: 'An error message is displayed',
                            createdAt: twoDaysAgo, archived: false, isManual: false
                        }},
                        {{
                            id: 'AI-003', storyId: 'story-002',
                            projectId: TEST_PROJECT_ID, projectName: 'Mock Test Project',
                            title: 'Verify PDF document upload completes successfully',
                            type: 'Functional', priority: 'Medium',
                            preconditions: 'User is logged in to SpecCheck',
                            steps: ['Navigate to Documents section', 'Select a valid PDF file', 'Submit the upload'],
                            expectedResults: 'Document appears in the table with Ready status',
                            createdAt: yesterday, archived: false, isManual: false
                        }}
                    ];
                    return new Response(
                        JSON.stringify(allTCs),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- PATCH /api/test-cases/:storyId/cases/:tcId/archive ---
                if (urlStr.match(/\/api\/test-cases\/[^\/]+\/cases\/[^\/]+\/archive/) && method === 'PATCH') {{
                    return new Response(
                        JSON.stringify({{ message: 'Toggled', archived: true }}),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- PATCH /api/test-cases/:storyId/cases/:tcId (edit) ---
                if (urlStr.match(/\/api\/test-cases\/[^\/]+\/cases\/[^\/]+$/) && method === 'PATCH') {{
                    let body = {{}};
                    try {{ body = JSON.parse(options.body); }} catch(e) {{}}
                    return new Response(
                        JSON.stringify({{ message: 'Updated', testCase: body }}),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- DELETE /api/test-cases/:storyId/cases/:tcId ---
                if (urlStr.match(/\/api\/test-cases\/[^\/]+\/cases\/[^\/]+$/) && method === 'DELETE') {{
                    return new Response(
                        JSON.stringify({{ message: 'Deleted' }}),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                // --- GET /api/generate-tests/:projectId ---
                if (urlStr.includes('/api/generate-tests/') && method === 'GET') {{
                    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
                    const yesterday = new Date(Date.now() - 86400000).toISOString();
                    const mockStories = [
                        {{
                            _id: 'story-001',
                            projectId: TEST_PROJECT_ID,
                            requirement: 'User login functionality',
                            generatedAt: twoDaysAgo,
                            options: {{ manual: false }},
                            testCases: [
                                {{
                                    id: 'AI-001',
                                    title: 'Verify successful login with valid credentials',
                                    type: 'Functional',
                                    priority: 'High',
                                    preconditions: 'User has a registered account',
                                    steps: ['Navigate to the login page', 'Enter valid username and password', 'Click Sign In'],
                                    expectedResults: 'User is redirected to the projects dashboard'
                                }},
                                {{
                                    id: 'AI-002',
                                    title: 'Verify login fails with incorrect password',
                                    type: 'Negative',
                                    priority: 'High',
                                    preconditions: 'User has a registered account',
                                    steps: ['Navigate to the login page', 'Enter valid username and wrong password', 'Click Sign In'],
                                    expectedResults: 'An error message is displayed'
                                }}
                            ]
                        }},
                        {{
                            _id: 'story-002',
                            projectId: TEST_PROJECT_ID,
                            requirement: 'File upload feature',
                            generatedAt: yesterday,
                            options: {{ manual: false }},
                            testCases: [
                                {{
                                    id: 'AI-003',
                                    title: 'Verify PDF document upload completes successfully',
                                    type: 'Functional',
                                    priority: 'Medium',
                                    preconditions: 'User is logged in to SpecCheck',
                                    steps: ['Navigate to Documents section', 'Select a valid PDF file', 'Submit the upload'],
                                    expectedResults: 'Document appears in the table with Ready status'
                                }}
                            ]
                        }}
                    ];
                    return new Response(
                        JSON.stringify(mockStories),
                        {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
                    );
                }}

                return _origFetch.apply(this, arguments);
            }};
        }})();
    """)
    yield


# ──────────────────────────── Screenshot on failure ────────────────────────────


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture a screenshot whenever a test step fails."""
    outcome = yield
    report = outcome.get_result()

    if report.when != "call" or not report.failed:
        return

    page = item.funcargs.get("page")
    if not page:
        return

    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = re.sub(r"[^\w]", "_", item.nodeid)
    screenshot_path = SCREENSHOTS_DIR / f"{safe_name}_{timestamp}.png"

    try:
        page.screenshot(path=str(screenshot_path))
    except Exception:
        return

    try:
        import pytest_html
        report.extras = getattr(report, "extras", [])
        report.extras.append(
            pytest_html.extras.image(str(screenshot_path), mime_type="image/png")
        )
    except Exception:
        pass
