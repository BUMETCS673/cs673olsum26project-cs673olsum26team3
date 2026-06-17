"""Page Object for the SpecCheck Login page.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot + Claude Code
# Overall AI Contribution: ~80%
# Human Contributions: Selector alignment with actual Login.jsx DOM
# Modifications:
#   - Updated all selectors to match Login.jsx (no id attrs, no btn-login/btn-logout classes)
#   - login_error uses .error (not .login-error)
#   - logout_button targets button[title="Logout"] in Navbar
#   - wait_for_dashboard waits for Logout button (Navbar visible after login)
# Verification: Selectors validated against Login.jsx and Navbar.jsx source
"""

from __future__ import annotations

from playwright.sync_api import Page


class LoginPage:
    BASE_URL = "http://localhost:5173"

    def __init__(self, page: Page) -> None:
        self.page = page
        # Login form elements — Login.jsx has no id/class attrs, use structural selectors
        self.login_title = page.locator(".login-card h1")
        self.username_input = page.locator(".login-card input[type='text']")
        self.password_input = page.locator(".login-card input[type='password']").first
        self.confirm_password_input = page.locator(".login-card input[placeholder='Re-type password']")
        self.sign_in_button = page.locator(".login-card button[type='submit']")
        self.login_error = page.locator(".login-card .error")
        self.success_message = page.locator(".login-card .success")
        self.register_link = page.get_by_text("Register here")
        # After login, Navbar renders with a Logout button (title="Logout")
        self.logout_button = page.locator("button[title='Logout']")

    def navigate(self, base_url: str = BASE_URL) -> None:
        self.page.goto(base_url)
        self.login_title.wait_for(state="visible", timeout=10_000)

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

    def switch_to_register(self) -> None:
        self.register_link.click()
        self.page.wait_for_timeout(250)

    def fill_confirm_password(self, password: str) -> None:
        self.confirm_password_input.fill(password)

    def get_success_message_text(self) -> str:
        self.success_message.wait_for(state="visible", timeout=10_000)
        return self.success_message.text_content() or ""

    def wait_for_dashboard(self) -> None:
        """After successful login the Navbar appears with the Logout button."""
        self.logout_button.wait_for(state="visible", timeout=10_000)

    def wait_for_login_page(self) -> None:
        self.login_title.wait_for(state="visible", timeout=10_000)

    def get_login_error_text(self) -> str:
        return self.login_error.text_content() or ""

    def is_logout_button_visible(self) -> bool:
        return self.logout_button.is_visible()
