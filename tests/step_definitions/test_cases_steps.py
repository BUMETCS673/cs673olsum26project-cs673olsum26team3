"""Step definitions for features/test_cases_dashboard.feature.

# AI-USAGE SUMMARY
# Tools: Claude Code
# Covers two acceptance tests:
#   AT1 - Dashboard lists test cases with title, creation date, and status.
#   AT2 - Search bar filters test cases by keyword (title or content).
# Notes:
#   - Uses 'a user is logged in' (vs 'the user is logged in') to avoid
#     conflicting with the existing dashboard_steps definition.
#   - Mock data provides 3 test cases: AI-001/AI-002 contain 'login' in their
#     title; AI-003 ('PDF upload') does not — used to verify AT2 filtering.
"""
from __future__ import annotations

from pytest_bdd import given, parsers, then, when

from pages.test_cases_page import TestCasesPage


# ─────────────────────────────── Given ──────────────────────────────────────


@given("a user is logged in")
def a_user_is_logged_in(test_cases_page: TestCasesPage, test_credentials: dict) -> None:
    test_cases_page.login(test_credentials["username"], test_credentials["password"])


@given("the test case dashboard is open")
def given_test_case_dashboard_is_open(test_cases_page: TestCasesPage) -> None:
    test_cases_page.navigate_to_test_cases()


@given("there are multiple test cases in the dashboard")
def multiple_test_cases_present(test_cases_page: TestCasesPage) -> None:
    count = test_cases_page.get_table_row_count()
    assert count >= 2, f"Expected at least 2 test cases in the dashboard, found {count}"


# ─────────────────────────────── When ───────────────────────────────────────


@when(parsers.parse('the user types "{keyword}" into the search bar'))
def type_into_search_bar(test_cases_page: TestCasesPage, keyword: str) -> None:
    test_cases_page.type_search_query(keyword)


# ─────────────────────────────── Then ───────────────────────────────────────


@then("the test case table is visible")
def then_test_case_table_is_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_table_visible(), "Test case table is not visible"


@then("each test case row displays a title")
def each_row_has_title(test_cases_page: TestCasesPage) -> None:
    count = test_cases_page.get_table_row_count()
    assert count > 0, "No test case rows found in the table"
    for i in range(count):
        title = test_cases_page.get_row_title(i)
        assert title.strip(), f"Row {i}: title is empty"


@then("each test case row displays a creation date")
def each_row_has_creation_date(test_cases_page: TestCasesPage) -> None:
    count = test_cases_page.get_table_row_count()
    assert count > 0, "No test case rows found in the table"
    for i in range(count):
        date_text = test_cases_page.get_row_creation_date(i)
        assert date_text and date_text != "—", f"Row {i}: creation date is missing or empty"


@then("each test case row displays a status")
def each_row_has_status(test_cases_page: TestCasesPage) -> None:
    count = test_cases_page.get_table_row_count()
    assert count > 0, "No test case rows found in the table"
    for i in range(count):
        status = test_cases_page.get_row_status(i)
        assert status.strip(), f"Row {i}: status/type is empty"


@then(parsers.parse('only test cases matching "{keyword}" are displayed in the results'))
def only_matching_results_shown(test_cases_page: TestCasesPage, keyword: str) -> None:
    titles = test_cases_page.get_all_visible_row_titles()
    assert titles, f"No test cases are displayed after searching for '{keyword}'"
    for title in titles:
        assert keyword.lower() in title.lower(), (
            f"Test case '{title}' does not match keyword '{keyword}' but is still displayed"
        )
