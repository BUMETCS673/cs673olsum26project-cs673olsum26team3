"""Step definitions for features/testCaseDashboard.feature.

One step file per feature file, following the Page Object Model pattern:
  TestCaseDashboardPage  →  testCaseDashboard.feature  →  testCaseDashboard_steps.py

The shared "the user is logged in" Given step lives in dashboard_steps.py and
drives login via the dashboard_page fixture. After login the app lands on the
Documents view; the "the TestCase Dashboard is open" step navigates to the
card-based Test Cases view using DashboardPage.navigate_to_test_cases().
"""
from __future__ import annotations

from pytest_bdd import given, parsers, then, when

from pages.dashboard_page import DashboardPage
from pages.testCaseDashboard_page import TestCaseDashboardPage

# ─────────────────────────────────── Given ──────────────────────────────────────


@given("the TestCase Dashboard is open")
def tc_dashboard_is_open(dashboard_page: DashboardPage) -> None:
    dashboard_page.navigate_to_test_cases()


# ─────────────────────────────────── Then ───────────────────────────────────────


@then(parsers.parse('the test case page header reads "{expected_text}"'))
def check_tc_header(
    test_case_dashboard_page: TestCaseDashboardPage, expected_text: str
) -> None:
    assert test_case_dashboard_page.get_header_title() == expected_text


@then(parsers.parse('the test case page sub-header reads "{expected_text}"'))
def check_tc_subheader(
    test_case_dashboard_page: TestCaseDashboardPage, expected_text: str
) -> None:
    assert test_case_dashboard_page.get_header_subtitle() == expected_text


@then("the test case card grid is visible")
def check_card_grid_visible(test_case_dashboard_page: TestCaseDashboardPage) -> None:
    assert test_case_dashboard_page.is_card_grid_visible()


@then("the card grid contains at least 1 card")
def check_card_grid_has_cards(test_case_dashboard_page: TestCaseDashboardPage) -> None:
    assert test_case_dashboard_page.get_card_count() >= 1


@then("each card has a title, a date, a status badge, and a Delete button")
def check_each_card(test_case_dashboard_page: TestCaseDashboardPage) -> None:
    count = test_case_dashboard_page.get_card_count()
    for i in range(count):
        title = test_case_dashboard_page.get_card_title(i)
        date_str = test_case_dashboard_page.get_card_date(i)
        badge = test_case_dashboard_page.get_card_badge_text(i)
        has_delete = test_case_dashboard_page.has_delete_button(i)
        assert title, f"Card {i}: title is empty"
        assert date_str, f"Card {i}: date is empty"
        assert badge, f"Card {i}: status badge is empty"
        assert has_delete, f"Card {i}: no Delete button found"


# ─────────────────────────────────── When ───────────────────────────────────────


@when(parsers.parse('the user enters "{query}" into the search bar'))
def enter_search_query(
    test_case_dashboard_page: TestCaseDashboardPage, query: str
) -> None:
    test_case_dashboard_page.enter_search_query(query)


# ─────────────────────────────────── Then (search) ──────────────────────────────


@then(parsers.parse('only cards containing "{keyword}" in the title are shown'))
def check_search_results(
    test_case_dashboard_page: TestCaseDashboardPage, keyword: str
) -> None:
    titles = test_case_dashboard_page.get_visible_card_titles()
    assert titles, f"No cards visible after searching for '{keyword}'"
    for title in titles:
        assert keyword.lower() in title.lower(), (
            f"Card title '{title}' does not contain '{keyword}'"
        )
