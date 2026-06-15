"""Page Object for the SpecCheck Registration page.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot + Claude Code
# Overall AI Contribution: ~80%
# Human Contributions: selector alignment, scenario mapping, integration with Playwright fixtures
# Modifications:
#   - Structural selectors aligned to Registration.jsx / Login.jsx DOM
#   - Added helpers: navigate(), switch_to_register(), fill_username(), fill_password(), fill_confirm_password()
#   - Added assertions/wait helpers: wait_for_login_page(), get_login_error_text(), get_success_message_text()
#   - Kept small timeouts after clicks to stabilize Playwright interactions
# Verification: Selectors and methods validated against Registration.jsx and tested via pytest-bdd + Playwright
"""

from __future__ import annotations

from playwright.sync_api import Page


class RegistrationPage:
    BASE_URL = "http://localhost:5173"

    def __init__(self, page: Page) -> None:
        self.page = page
        self.login_title = page.locator(".login-card h1")
        self.username_input = page.locator(".login-card input[type='text']")
        self.password_input = page.locator(".login-card input[type='password']").first
        self.confirm_password_input = page.locator(".login-card input[placeholder='Re-type password']")
        self.sign_in_button = page.locator(".login-card button[type='submit']")
        self.login_error = page.locator(".login-card .error")
        self.success_message = page.locator(".login-card .success")
        self.register_link = page.get_by_text("Register here")

    def navigate(self, base_url: str = BASE_URL) -> None:
        self.page.goto(base_url)
        self.wait_for_login_page()

    def wait_for_login_page(self) -> None:
        self.login_title.wait_for(state="visible", timeout=10_000)

    def fill_username(self, username: str) -> None:
        self.username_input.fill(username)

    def fill_password(self, password: str) -> None:
        self.password_input.fill(password)

    def fill_confirm_password(self, password: str) -> None:
        self.confirm_password_input.fill(password)

    def click_register(self) -> None:
        self.sign_in_button.click()
        self.page.wait_for_timeout(500)

    def switch_to_register(self) -> None:
        self.register_link.click()
        self.page.wait_for_timeout(250)

    def get_success_message_text(self) -> str:
        self.success_message.wait_for(state="visible", timeout=10_000)
        return self.success_message.text_content() or ""

    def get_login_error_text(self) -> str:
        return self.login_error.text_content() or ""

    def login_title_text(self) -> str:
        return self.login_title.inner_text()
