# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements

"""Step definitions for features/login.feature.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot + Claude Code
# Modifications:
#   - Added 'the user logs in with valid credentials' step (reads from test_credentials fixture)
#   - 'the app is accessible' step checks Logout button instead of "Document Dashboard" h1
#   - 'the login title reads' step uses .login-card h1 selector
"""

from __future__ import annotations

from pytest_bdd import given, parsers, then, when

from pages.login_page import LoginPage


@given("the login page is open")
def login_page_is_open(login_page: LoginPage) -> None:
    login_page.wait_for_login_page()


@when(parsers.parse('the user enters username "{username}" and password "{password}"'))
def enters_credentials(login_page: LoginPage, username: str, password: str) -> None:
    login_page.fill_username(username)
    login_page.fill_password(password)


@when(parsers.parse('the user enters username "{username}"'))
def enter_username(login_page: LoginPage, username: str) -> None:
    login_page.fill_username(username)


@when(parsers.parse('the user enters password "{password}"'))
def enter_password(login_page: LoginPage, password: str) -> None:
    login_page.fill_password(password)


@when("the user logs in with valid credentials")
def user_logs_in_with_valid_credentials(
    login_page: LoginPage, test_credentials: dict
) -> None:
    login_page.fill_username(test_credentials["username"])
    login_page.fill_password(test_credentials["password"])


@when("the user clicks Sign In")
def click_sign_in(login_page: LoginPage) -> None:
    login_page.click_sign_in()


@when("the user clicks Logout")
def click_logout(login_page: LoginPage) -> None:
    login_page.click_logout()


@then("the Document Dashboard is visible")
def dashboard_is_visible(login_page: LoginPage) -> None:
    login_page.wait_for_dashboard()


@then("the app is accessible")
def app_is_accessible(login_page: LoginPage) -> None:
    """After login the Navbar is rendered with a Logout button — that is our signal."""
    login_page.wait_for_dashboard()


@then("the login page is visible")
def login_page_is_visible(login_page: LoginPage) -> None:
    login_page.wait_for_login_page()


@then(parsers.parse('the login error reads "{expected}"'))
def login_error_reads(login_page: LoginPage, expected: str) -> None:
    actual = login_page.get_login_error_text()
    assert actual == expected, f"Expected error '{expected}', got '{actual}'"


@then("the logout button is visible")
def logout_button_is_visible(login_page: LoginPage) -> None:
    assert login_page.is_logout_button_visible()


@then(parsers.parse('the login title reads "{expected}"'))
def login_title_reads(login_page: LoginPage, expected: str) -> None:
    actual = login_page.login_title.inner_text()
    assert actual == expected, f"Expected title '{expected}', got '{actual}'"
