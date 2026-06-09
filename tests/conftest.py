"""Root conftest: fixtures, screenshot-on-failure hook, and step-definition registration."""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

import pytest
from dotenv import load_dotenv

from pages.dashboard_page import DashboardPage
from pages.login_page import LoginPage

# Load tests/.env into os.environ for local runs (no-op when already set by CI/Docker)
load_dotenv(Path(__file__).parent / ".env")

pytest_plugins = [
    "step_definitions.dashboard_steps",
    "step_definitions.login_steps",
]

TESTS_DIR = Path(__file__).parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
SCREENSHOTS_DIR = TESTS_DIR / "reports" / "screenshots"

# The backend URL as seen by the Python process (used for health check and Docker proxy)
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5001")


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


# ──────────────────────────── Upload API mock ──────────────────────────────────


def _backend_running() -> bool:
    """Return True only when server.js is healthy AND MongoDB is accessible.
    Returns False immediately when FORCE_MOCK=true is set (local Docker override).
    Probes POST /api/login with dummy credentials.  A 401 response means the
    server reached MongoDB (wrong creds → expected); a 5xx means MongoDB is
    unreachable (use mock instead).  OPTIONS on /api/upload is intentionally
    NOT used — Express answers it even when MongoDB is down.
    """
    if os.environ.get("FORCE_MOCK", "").lower() in ("1", "true", "yes"):
        return False
    try:
        data = json.dumps({"username": "_healthcheck_", "password": "_healthcheck_"}).encode()
        req = urllib.request.Request(
            f"{BACKEND_URL}/api/login",
            data=data,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status < 500
    except urllib.error.HTTPError as e:
        return e.code < 500  # 401 = "incorrect creds" = DB is working
    except Exception:
        return False


@pytest.fixture(scope="session")
def _use_real_backend() -> bool:
    available = _backend_running()
    if not available:
        print("\n[conftest] Backend not running — API requests will be mocked.")
    return available


@pytest.fixture(autouse=True)
def proxy_backend_in_docker(page, _use_real_backend):
    """In Docker, Login.jsx and other views hardcode http://localhost:5001 for API calls.
    The Playwright browser runs inside the test-runner container where localhost:5001
    is unreachable — the real backend is at backend-service:5001.

    When BACKEND_URL differs from localhost, intercept all browser requests to
    localhost:5001 and forward them to the actual backend container.
    This is transparent to the app and requires no project code changes.
    """
    if not _use_real_backend or BACKEND_URL == "http://localhost:5001":
        yield
        return

    def _handle(route):
        new_url = route.request.url.replace("http://localhost:5001", BACKEND_URL, 1)
        route.continue_(url=new_url)

    page.route("http://localhost:5001/**", _handle)
    yield


@pytest.fixture(autouse=True)
def mock_upload_api(page, _use_real_backend, test_credentials):
    """Mock all backend API calls when server.js is not running.

    Handles:
      POST /api/login       — credential-aware (correct creds → success, wrong → 401)
      GET  /api/projects    — returns one test project so the Documents view is reachable
      POST /api/projects    — creates a project (used by dashboard tests)
      GET  /api/upload/:id  — returns an empty document list (populated after upload)
      POST /api/upload      — returns upload success with file metadata
      DELETE /api/upload/:id — returns deletion success
    """
    if _use_real_backend:
        yield
        return

    # Embed credentials as JSON-safe strings so the JS snippet can compare them
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
