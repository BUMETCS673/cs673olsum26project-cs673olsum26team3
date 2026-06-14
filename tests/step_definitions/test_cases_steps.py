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
def given_test_case_dashboard_is_open(test_cases_page: TestCasesPage, seed_api_data: dict) -> None:
    test_cases_page.navigate_to_test_cases(seed_api_data.get("project_name"))


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


# ── AT3 – Row IDs ────────────────────────────────────────────────────────────


@then("each test case row displays a valid test case ID")
def each_row_has_valid_id(test_cases_page: TestCasesPage) -> None:
    count = test_cases_page.get_table_row_count()
    assert count > 0, "No test case rows found in the table"
    for i in range(count):
        tc_id = test_cases_page.get_row_id(i)
        assert tc_id.strip(), f"Row {i}: ID is empty"
        assert tc_id.startswith("AI-") or tc_id.startswith("HU-"), (
            f"Row {i}: ID '{tc_id}' does not follow AI-### or HU-### format"
        )


# ── AT4 – Priority column ─────────────────────────────────────────────────────


@then("each test case row displays a priority value")
def each_row_has_priority(test_cases_page: TestCasesPage) -> None:
    count = test_cases_page.get_table_row_count()
    assert count > 0, "No test case rows found in the table"
    valid_priorities = {"High", "Medium", "Low"}
    for i in range(count):
        priority = test_cases_page.get_row_priority(i)
        assert priority in valid_priorities, (
            f"Row {i}: priority '{priority}' is not one of {valid_priorities}"
        )


# ── AT5 – Total count ─────────────────────────────────────────────────────────


@then(parsers.parse("the dashboard displays {count:d} test cases"))
def dashboard_displays_n_test_cases(test_cases_page: TestCasesPage, count: int) -> None:
    actual = test_cases_page.get_table_row_count()
    assert actual == count, f"Expected {count} test cases but found {actual}"


# ── AT6 – Type filter header ──────────────────────────────────────────────────


@when("the user clicks the Type column header")
def click_type_column_header(test_cases_page: TestCasesPage) -> None:
    test_cases_page.click_type_header()


@then("the Type column header shows an active filter label")
def type_header_shows_active_filter(test_cases_page: TestCasesPage) -> None:
    header_text = test_cases_page.get_type_header_text()
    assert "(" in header_text, (
        f"Type header '{header_text}' does not show an active filter in parentheses"
    )


# ── AT7 – Priority filter header ──────────────────────────────────────────────


@when("the user clicks the Priority column header")
def click_priority_column_header(test_cases_page: TestCasesPage) -> None:
    test_cases_page.click_priority_header()


@then("the Priority column header shows an active filter label")
def priority_header_shows_active_filter(test_cases_page: TestCasesPage) -> None:
    header_text = test_cases_page.get_priority_header_text()
    assert "(" in header_text, (
        f"Priority header '{header_text}' does not show an active filter in parentheses"
    )


# ── AT8 – Export button visible ───────────────────────────────────────────────


@then("the Export As button is visible")
def export_button_is_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_export_button_visible(), "Export As button is not visible"


# ── AT9 – Export dropdown ─────────────────────────────────────────────────────


@when("the user hovers over the Export button")
def hover_over_export_button(test_cases_page: TestCasesPage) -> None:
    test_cases_page.hover_export_button()


@then("the export dropdown shows an Export CSV option")
def export_csv_option_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_export_dropdown_visible(), (
        "Export CSV option is not visible in the export dropdown"
    )


@then("the export dropdown shows an Export JSON option")
def export_json_option_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_export_json_option_visible(), (
        "Export JSON option is not visible in the export dropdown"
    )


# ── AT10 – Create button opens modal ──────────────────────────────────────────


@when("the user clicks the Create button")
def click_create_button(test_cases_page: TestCasesPage) -> None:
    test_cases_page.click_create_button()


@then("the Create Manual Test Case modal is visible")
def create_modal_is_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_create_modal_visible(), (
        "Create Manual Test Case modal did not appear"
    )


# ── AT11 – Modal form fields ──────────────────────────────────────────────────


@then("the modal title input field is visible")
def modal_title_input_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_modal_title_input_visible(), (
        "Modal title input field is not visible"
    )


@then("the modal Type label is visible")
def modal_type_label_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_modal_type_label_visible(), (
        "Modal Type label is not visible"
    )


@then("the modal Steps label is visible")
def modal_steps_label_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_modal_steps_label_visible(), (
        "Modal 'Steps (One per line)' label is not visible"
    )


# ── AT12 – Cancel modal ───────────────────────────────────────────────────────


@given("the create modal is open")
def given_create_modal_is_open(test_cases_page: TestCasesPage) -> None:
    test_cases_page.click_create_button()
    assert test_cases_page.is_create_modal_visible(), "Create modal did not open"


@when("the user cancels the modal")
def user_cancels_modal(test_cases_page: TestCasesPage) -> None:
    test_cases_page.click_cancel_in_modal()


@then("the create modal is no longer visible")
def create_modal_closed(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_create_modal_closed(), "Create modal is still visible after cancel"


# ── AT13 – Row expansion ──────────────────────────────────────────────────────


@when("the user clicks the first test case row")
def click_first_test_case_row(test_cases_page: TestCasesPage) -> None:
    test_cases_page.click_first_row()


@then("the expanded row panel with test steps is visible")
def expanded_row_panel_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_expanded_row_visible(), (
        "Expanded row with test steps did not appear after clicking a row"
    )


# ── AT14 – Empty state ────────────────────────────────────────────────────────


@then("the table shows a no-results message")
def table_shows_no_results(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.has_no_results_message(), (
        "Expected a no-results message but none was found in the table"
    )


# ── AT15 – Clear search ───────────────────────────────────────────────────────


@when("the user clears the search bar")
def user_clears_search_bar(test_cases_page: TestCasesPage) -> None:
    test_cases_page.clear_search()


# ── AT16 – Back button ────────────────────────────────────────────────────────


@then("the Back to Projects button is visible")
def back_button_is_visible(test_cases_page: TestCasesPage) -> None:
    assert test_cases_page.is_back_button_visible(), "Back to Projects button is not visible"


# ── AT17 – Page heading ───────────────────────────────────────────────────────


@then(parsers.parse('the page heading contains "{text}"'))
def page_heading_contains(test_cases_page: TestCasesPage, text: str) -> None:
    heading = test_cases_page.get_heading_text()
    assert text in heading, (
        f"Page heading '{heading}' does not contain expected text '{text}'"
    )
