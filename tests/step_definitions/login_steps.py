"""Step definitions for features/login.feature.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot
# Overall AI Contribution: ~85%
# AI-Assisted Areas: Step definition scaffolding, pattern design, assertion logic
# Human Contributions: Feature file refinement, step wording clarity
# Areas of AI Influence:
#   - @given, @when, @then decorator usage and patterns
#   - Page object method invocations
#   - Assertion patterns for error messages and UI state
# Modifications:
#   - Removed duplicate steps (enters_username_and_no_password, enters_password_and_no_username)
#     in favor of generic credential step with empty string parameters
#   - Removed browser validationMessage extraction steps (no longer needed with manual validation)
#   - Added separate enter_username and enter_password steps to support feature file Scenario structure
# Verification: pytest-bdd test execution confirms all steps bind correctly to feature scenarios
#              Each scenario passes when backend validation is current
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
def enter_username(login_page, username):
    login_page.fill_username(username)


@when(parsers.parse('the user enters password "{password}"'))
def enter_password(login_page, password):
    login_page.fill_password(password)


@when("the user clicks Sign In")
def click_sign_in(login_page: LoginPage) -> None:
    login_page.click_sign_in()


@when("the user clicks Logout")
def click_logout(login_page: LoginPage) -> None:
    login_page.click_logout()


@then("the Document Dashboard is visible")
def dashboard_is_visible(login_page: LoginPage) -> None:
    login_page.wait_for_dashboard()


@then("the login page is visible")
def login_page_is_visible(login_page: LoginPage) -> None:
    login_page.wait_for_login_page()


@then(parsers.parse('the login error reads "{expected}"'))
def login_error_reads(login_page: LoginPage, expected: str) -> None:
    assert login_page.get_login_error_text() == expected


@then("the logout button is visible")
def logout_button_is_visible(login_page: LoginPage) -> None:
    assert login_page.is_logout_button_visible()


@then(parsers.parse('the login title reads "{expected}"'))
def login_title_reads(login_page: LoginPage, expected: str) -> None:
    assert login_page.login_title.inner_text() == expected



