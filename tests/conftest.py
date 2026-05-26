"""Root conftest: fixtures, screenshot-on-failure hook, and step-definition registration."""
from __future__ import annotations

import os
import re
import urllib.request
from datetime import datetime
from pathlib import Path

import pytest

from pages.dashboard_page import DashboardPage

# Register step definitions as a pytest plugin so their @given/@when/@then
# decorators are discovered before scenario collection.
pytest_plugins = ["step_definitions.dashboard_steps"]

TESTS_DIR = Path(__file__).parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
SCREENSHOTS_DIR = TESTS_DIR / "reports" / "screenshots"


# ─────────────────────────────────── Fixtures ──────────────────────────────────


@pytest.fixture(scope="session")
def base_url() -> str:
    return "http://localhost:5173"


@pytest.fixture(scope="session")
def test_credentials() -> dict:
    """Login credentials read from env vars TEST_USERNAME / TEST_PASSWORD.

    Set these in a local tests/.env file (git-ignored) or in your CI secrets.
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
    """Mutable store used to share the 'initial row count' between When/Then steps."""
    return {}


@pytest.fixture
def dashboard_page(page, base_url):
    """Navigate to the dashboard and return a DashboardPage instance.

    Each test function gets a fresh browser page (pytest-playwright default)
    so React state resets on every navigation.
    """
    dp = DashboardPage(page)
    dp.navigate(base_url)
    return dp


# ──────────────────────────── Upload API mock ──────────────────────────────────


def _backend_running() -> bool:
    """Return True only if server.js is healthy (HTTP 200 on /api/upload OPTIONS).

    server.js listens on port 5001. A plain TCP connect is not enough —
    another process may occupy the port.  We do a real HTTP probe so the mock
    is activated whenever the backend isn't actually serving upload requests.
    """
    try:
        req = urllib.request.Request(
            "http://localhost:5001/api/upload",
            method="OPTIONS",
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status < 500
    except Exception:
        return False


@pytest.fixture(scope="session")
def _use_real_backend() -> bool:
    available = _backend_running()
    if not available:
        print("\n[conftest] Backend not running — upload requests will be mocked.")
    return available


@pytest.fixture(autouse=True)
def mock_upload_api(page, _use_real_backend):
    """Mock the backend upload API when server.js is not running.

    Injects a fetch interceptor via add_init_script so it is in place before
    React loads. The interceptor reads FormData entries directly (reliable for
    any number of files) and returns a realistic success payload.
    If the real backend is running the fixture is a no-op.
    """
    if _use_real_backend:
        yield
        return

    page.add_init_script("""
        const _origFetch = window.fetch;
        window.fetch = async function(url, options) {
            if (typeof url === 'string' && url.includes('/api/login')) {
                return new Response(
                    JSON.stringify({ user: { username: 'testuser', name: 'Test User' } }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }
            if (typeof url === 'string' && url.includes('/api/upload')) {
                const body = options && options.body;
                const files = [];
                if (body instanceof FormData) {
                    for (const [, value] of body.entries()) {
                        if (value instanceof File) files.push(value.name);
                    }
                }
                const today = new Date().toISOString().split('T')[0];
                return new Response(
                    JSON.stringify({
                        message: 'Files uploaded and processed successfully!',
                        data: files.map(function(name) {
                            return {
                                fileName: name,
                                fileSize: '0.01 MB',
                                uploadDate: today,
                                textPreview: ''
                            };
                        })
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }
            return _origFetch.apply(this, arguments);
        };
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
        return  # page may already be closed; don't crash the report

    # Embed the screenshot inline in the pytest-html report
    try:
        import pytest_html
        report.extras = getattr(report, "extras", [])
        report.extras.append(
            pytest_html.extras.image(str(screenshot_path), mime_type="image/png")
        )
    except Exception:
        pass
