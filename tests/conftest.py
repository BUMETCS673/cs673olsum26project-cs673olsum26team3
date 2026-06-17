"""Root conftest: fixtures, screenshot-on-failure hook, and step-definition registration."""
from __future__ import annotations

import os
import re
import time
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


# ─────────────────────────────────── Fixtures ──────────────────────────────────


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.environ.get("BASE_URL", "http://localhost:5173")


@pytest.fixture(scope="session")
def backend_url() -> str:
    return os.environ.get("BACKEND_URL", "http://localhost:5001")


@pytest.fixture(scope="session")
def unique_id():
    """Returns a callable that yields a new unique string on each call.

    Each call within a session produces a different value so scenarios that both
    use 'a unique new username' don't collide with each other.
    """
    base = str(int(time.time()))
    state = {"count": 0}

    def _next() -> str:
        state["count"] += 1
        return f"{base}_{state['count']}"

    return _next


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
def dashboard_page(page, base_url):
    """Navigate to the app root and return a DashboardPage instance."""
    dp = DashboardPage(page)
    dp.navigate(base_url)
    return dp


@pytest.fixture
def projects_page(page) -> "ProjectsPage":
    """Returns a freshly instantiated Page Object instance for ProjectsView."""
    from pages.projects_page import ProjectsPage
    return ProjectsPage(page)


@pytest.fixture
def registration_page(page, base_url):
    rp = RegistrationPage(page)
    rp.navigate(base_url)
    return rp


@pytest.fixture
def test_cases_page(page, base_url):
    """Navigate to the app root and return a TestCasesPage instance."""
    tc = TestCasesPage(page)
    tc.navigate(base_url)
    return tc


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
