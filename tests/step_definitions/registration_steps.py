"""Step definitions for registration.feature.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot + Claude Code
# Overall AI Contribution: ~70%
# Human Contributions: mapped Gherkin steps to page object calls, added validation/assertion helpers
# Modifications:
#   - Uses RegistrationPage page object for UI interactions
#   - Added steps for empty-field checks, mismatch, length/complexity, duplicate username, and success path
#   - Uses substring asserts for server/client validation messages where appropriate
# Verification: Executed as part of pytest-bdd scenarios REG-001..REG-010 with Playwright
"""

from __future__ import annotations

from pytest_bdd import when, then, parsers

from pages.login_page import LoginPage
from pages.registration_page import RegistrationPage


@when('the user switches to Create Account')
def switch_to_create_account(registration_page: RegistrationPage) -> None:
    registration_page.switch_to_register()


@when("the user enters the existing test username")
def enter_existing_test_username(registration_page: RegistrationPage, test_credentials: dict) -> None:
    """Use the TEST_USERNAME (always in DB) to trigger the duplicate-username error path."""
    registration_page.fill_username(test_credentials["username"])


@when("the user enters a unique new username")
def enter_unique_new_username(registration_page: RegistrationPage, unique_id) -> None:
    """Generate a unique username (via counter callable) so no two scenarios share one."""
    registration_page.fill_username(f"test_reg_{unique_id()}")


@when("the user enters a unique username with spaces")
def enter_unique_username_with_spaces(registration_page: RegistrationPage, unique_id) -> None:
    """Generate a unique username containing spaces to verify the backend accepts them."""
    registration_page.fill_username(f"test user {unique_id()}")


@when(parsers.parse('the user enters confirm password "{confirm_password}"'))
def enter_confirm_password(registration_page: RegistrationPage, confirm_password: str) -> None:
    registration_page.fill_confirm_password(confirm_password)


@when('the user clicks Register')
def click_register(registration_page: RegistrationPage) -> None:
    registration_page.click_register()


@then(parsers.parse('the registration success message reads "{expected}"'))
def registration_success_message_reads(registration_page: RegistrationPage, expected: str) -> None:
    actual = registration_page.get_success_message_text()
    assert actual == expected, f"Expected success '{expected}', got '{actual}'"


@when('the user leaves username empty')
def leave_username_empty(registration_page: RegistrationPage) -> None:
    """Intentionally leave username field empty (no fill operation)."""
    pass


@when('the user leaves password empty')
def leave_password_empty(registration_page: RegistrationPage) -> None:
    """Intentionally leave password field empty (no fill operation)."""
    pass


@when('the user leaves confirm password empty')
def leave_confirm_password_empty(registration_page: RegistrationPage) -> None:
    """Intentionally leave confirm password field empty (no fill operation)."""
    pass


@then('the browser shows required field validation errors')
def browser_shows_required_field_errors(registration_page: RegistrationPage) -> None:
    """Check that HTML5 required attribute prevented submission (page still on login)."""
    # Browser's built-in HTML5 validation prevents form submission
    # If we reach here without an API error, the form wasn't submitted
    registration_page.wait_for_login_page()


@then(parsers.parse('the login error contains "{expected_text}"'))
def login_error_contains(registration_page: RegistrationPage, expected_text: str) -> None:
    """Assert error message contains substring."""
    actual = registration_page.get_login_error_text()
    assert expected_text.lower() in actual.lower(), f"Expected '{expected_text}' in '{actual}'"
