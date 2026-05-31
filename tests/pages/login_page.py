"""Page Object for the SpecCheck Login page.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot
# Overall AI Contribution: ~80%
# AI-Assisted Areas: Page object structure, locator strategy, method design
# Human Contributions: CSS selector refinement (e.g., using get_by_role for accessibility)
# Areas of AI Influence:
#   - Locator initialization in __init__
#   - Navigation and form interaction methods
#   - Wait-for-element helpers (wait_for_dashboard, wait_for_login_page)
#   - Error message extraction (get_login_error_text)
# Modifications:
#   - Updated login_title locator from 'h1.login-title' to get_by_role('heading', name='Login')
#     for better accessibility and robustness
#   - Refined navigate() to use get_by_role instead of class selectors
#   - Removed validation message getters (no longer needed with manual validation)
# Verification: Playwright test execution confirms all locators resolve correctly
#              Manual browser inspection validated CSS selectors
"""

from __future__ import annotations

from playwright.sync_api import Page


class LoginPage:
    BASE_URL = "http://localhost:5173"

    def __init__(self, page: Page) -> None:
        self.page = page
        self.login_title = page.get_by_role("heading", name="Login")
        self.username_input = page.locator("#username")
        self.password_input = page.locator("#password")
        self.sign_in_button = page.locator("button.btn-login")
        self.login_error = page.locator(".login-error")
        self.dashboard_header = page.locator("h1").filter(has_text="Document Dashboard")
        self.logout_button = page.locator("button.btn-logout")

    def navigate(self, base_url: str = BASE_URL) -> None:
        self.page.goto(base_url)
        self.page.get_by_role("heading", name="Login").wait_for()

    def fill_username(self, username: str) -> None:
        self.username_input.fill(username)

    def fill_password(self, password: str) -> None:
        self.password_input.fill(password)

    def click_sign_in(self) -> None:
        self.sign_in_button.click()
        self.page.wait_for_timeout(500)

    def login(self, username: str, password: str) -> None:
        self.fill_username(username)
        self.fill_password(password)
        self.click_sign_in()
        self.wait_for_dashboard()

    def click_logout(self) -> None:
        self.logout_button.click()

    def wait_for_dashboard(self) -> None:
        self.dashboard_header.wait_for(state="visible", timeout=10_000)

    def wait_for_login_page(self) -> None:
        self.login_title.wait_for(state="visible", timeout=10_000)

    def get_login_error_text(self) -> str:
        return self.login_error.text_content() or ""

    def is_logout_button_visible(self) -> bool:
        return self.logout_button.is_visible()