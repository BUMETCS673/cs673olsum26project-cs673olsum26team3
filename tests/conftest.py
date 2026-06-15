"""Root conftest: fixtures, screenshot-on-failure hook, and step-definition registration."""
from __future__ import annotations

import json
import os
import re
from urllib.parse import quote
from datetime import datetime
from pathlib import Path

import pytest
from dotenv import load_dotenv

from pages.dashboard_page import DashboardPage
from pages.login_page import LoginPage
from pages.registration_page import RegistrationPage
from pages.test_cases_page import TestCasesPage

# Load tests/.env into os.environ for local runs (no-op when already set by CI/Docker)
load_dotenv(Path(__file__).parent / ".env")

pytest_plugins = [
    "step_definitions.dashboard_steps",
    "step_definitions.login_steps",
    "step_definitions.projects_steps",
    "step_definitions.registration_steps",
    "step_definitions.test_cases_steps",
]

TESTS_DIR = Path(__file__).parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
SCREENSHOTS_DIR = TESTS_DIR / "reports" / "screenshots"

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5001")
# Set USE_MOCK=true only for local development without a running backend.
# In CI and Docker, leave it unset so tests exercise the real backend.
USE_MOCK = os.environ.get("USE_MOCK", "false").lower() == "true"


# ─────────────────────────────────── Fixtures ──────────────────────────────────


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.environ.get("BASE_URL", "http://localhost:5173")


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
def seed_api_data(playwright, test_credentials):
    """Seed the real backend with a test user, a project, and 3 manual test cases.

    Runs once per session before any test that depends on a page fixture.
    When USE_MOCK=true this is a no-op; the JS fetch mock provides all data.
    Teardown deletes the seeded project (cascade-deletes test cases too).
    """
    if USE_MOCK:
        yield {"project_id": "mock-project-001", "project_name": "Mock Test Project"}
        return

    ctx = playwright.request.new_context(base_url=BACKEND_URL)
    # Playwright 1.44 Python does not support json= on APIRequestContext methods.
    # Use data=json.dumps(...) with an explicit Content-Type header instead.
    _h = {"Content-Type": "application/json"}
    project_id = None

    # 1. Register the primary test user — ignore 409 if it already exists.
    ctx.post("/api/register",
             data=json.dumps({"username": test_credentials["username"],
                              "password": test_credentials["password"]}),
             headers=_h)

    # 2. Ensure "admin" exists so REG-004 (duplicate-username) always passes.
    ctx.post("/api/register",
             data=json.dumps({"username": "admin", "password": "Admin!234"}),
             headers=_h)

    # 3. Login to obtain the userId needed for project creation.
    login_resp = ctx.post("/api/login",
                          data=json.dumps({"username": test_credentials["username"],
                                           "password": test_credentials["password"]}),
                          headers=_h)
    user_id = login_resp.json().get("user", {}).get("id")

    # 4. Create the integration-test project.
    proj_resp = ctx.post("/api/projects",
                         data=json.dumps({"name": "CI Test Project",
                                          "description": "Auto-created by the integration test suite",
                                          "userId": user_id}),
                         headers=_h)
    project = proj_resp.json()
    project_id = project.get("_id")

    # 5. Seed 2 documents so the @management delete scenarios always have rows
    #    to work with, independent of whether @upload tests ran first.
    seed_pdf = FIXTURES_DIR / "sample_valid.pdf"
    if seed_pdf.exists() and project_id:
        pdf_bytes = seed_pdf.read_bytes()
        for i in range(1, 3):
            ctx.post("/api/upload", multipart={
                "projectId": project_id,
                "documents": {
                    "name": f"seed_doc_{i}.pdf",
                    "mimeType": "application/pdf",
                    "buffer": pdf_bytes,
                },
            })

    # 6. Seed exactly 3 manual test cases — titles mirror the mock so that
    #    AT2 (search "login" → 2 hits) and AT5/AT15 (total = 3) still pass.
    seed_cases = [
        {
            "title": "Verify successful login with valid credentials",
            "type": "Functional", "priority": "High",
            "preconditions": "User has a registered account",
            "steps": ["Navigate to login page", "Enter valid credentials", "Click Sign In"],
            "expectedResults": "User is redirected to the projects dashboard",
        },
        {
            "title": "Verify login fails with incorrect password",
            "type": "Negative", "priority": "High",
            "preconditions": "User has a registered account",
            "steps": ["Navigate to login page", "Enter wrong password", "Click Sign In"],
            "expectedResults": "An error message is displayed",
        },
        {
            "title": "Verify PDF document upload completes successfully",
            "type": "Functional", "priority": "Medium",
            "preconditions": "User is logged in to SpecCheck",
            "steps": [
                "Navigate to Documents section",
                "Select a valid PDF file",
                "Submit the upload",
            ],
            "expectedResults": "Document appears in the table with Ready status",
        },
    ]
    for tc in seed_cases:
        ctx.post("/api/generate-tests/manual",
                 data=json.dumps({"projectId": project_id, "testCase": tc}),
                 headers=_h)

    yield {
        "project_id": project_id,
        "project_name": "CI Test Project",
        "user_id": user_id,
    }

    # Teardown: cascade-delete the seeded project and all its test cases.
    if project_id:
        ctx.delete(f"/api/projects/{project_id}")
    # Remove registration test users so the next CI run can re-register them.
    for uname in ("brand_new_user_001", "user with spaces", "special_char_user"):
        ctx.delete(f"/api/users/{quote(uname, safe='')}")
    ctx.dispose()


@pytest.fixture
def login_page(page, base_url, seed_api_data):
    """Navigate to the login page and return a LoginPage instance."""
    lp = LoginPage(page)
    lp.navigate(base_url)
    return lp


@pytest.fixture
def projects_page(page, seed_api_data):
    """Returns a freshly instantiated Page Object instance for ProjectsView."""
    from pages.projects_page import ProjectsPage
    return ProjectsPage(page)


@pytest.fixture
def registration_page(page, base_url, seed_api_data):
    rp = RegistrationPage(page)
    rp.navigate(base_url)
    return rp


@pytest.fixture
def dashboard_page(page, base_url, mock_upload_api, seed_api_data):
    """Navigate to the app root and return a DashboardPage instance."""
    dp = DashboardPage(page)
    dp.navigate(base_url)
    return dp


@pytest.fixture
def test_cases_page(page, base_url, mock_upload_api, seed_api_data):
    """Navigate to the app root and return a TestCasesPage instance."""
    tc = TestCasesPage(page)
    tc.navigate(base_url)
    return tc


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


# ──────────────────────────── Upload API mock ──────────────────────────────────


@pytest.fixture
def mock_upload_api(page, test_credentials):
    """Intercept backend API calls with an in-browser JS fetch mock.

    Only active when USE_MOCK=true. By default (USE_MOCK=false or unset) this
    fixture is a no-op so all requests reach the real backend.

    Set USE_MOCK=true only for local development without a running backend.
    """
    if not USE_MOCK:
        yield
        return

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

                // --- POST /api/register ---
                if (urlStr.includes('/api/register') && method === 'POST') {{
                    let body = {{}};
                    try {{ body = JSON.parse(options.body); }} catch(e) {{}}
                    const existingUsers = new Set([TEST_USERNAME, 'admin']);
                    if (existingUsers.has(body.username)) {{
                        return new Response(
                            JSON.stringify({{ success: false, message: 'This username is already taken' }}),
                            {{ status: 409, headers: {{ 'Content-Type': 'application/json' }} }}
                        );
                    }}
                    if (body.password && body.password.length < 8) {{
                        return new Response(
                            JSON.stringify({{ success: false, message: 'Password must be at least 8 characters' }}),
                            {{ status: 400, headers: {{ 'Content-Type': 'application/json' }} }}
                        );
                    }}
                    const complexityRegex = /(?=.*\\d)(?=.*[!@#\\$%\\^&\\*])/;
                    if (body.password && !complexityRegex.test(body.password)) {{
                        return new Response(
                            JSON.stringify({{ success: false, message: 'Password must include a number and special character' }}),
                            {{ status: 400, headers: {{ 'Content-Type': 'application/json' }} }}
                        );
                    }}
                    return new Response(
                        JSON.stringify({{
                            success: true,
                            message: 'Account created successfully!',
                            user: {{ id: 'mock-new-user-001', username: body.username }},
                        }}),
                        {{ status: 201, headers: {{ 'Content-Type': 'application/json' }} }}
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
