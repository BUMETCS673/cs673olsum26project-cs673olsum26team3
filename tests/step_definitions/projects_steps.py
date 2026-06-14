from __future__ import annotations

from pytest_bdd import given, parsers, then, when
from pages.projects_page import ProjectsPage
from pages.login_page import LoginPage


# given
@given("the user is authenticated and viewing the Projects dashboard")
def user_authenticated_on_projects(login_page: LoginPage, projects_page: ProjectsPage, test_credentials: dict) -> None:
    """Logs in via the login page and waits for the Projects dashboard heading to appear."""
    login_page.login(test_credentials["username"], test_credentials["password"])
    projects_page.wait_for_projects_load()
    


# when

@when(parsers.parse('the user types "{search_query}" into the project search box'))
def perform_project_search_query(projects_page: ProjectsPage, search_query: str) -> None:
    """Fills out the input filter query."""
    projects_page.search_for_project(search_query)

# then

@then("the project search box is visible")
def check_search_box_visible(projects_page: ProjectsPage) -> None:
    assert projects_page.search_input.is_visible(), "The filter search bar was not found in the DOM"

@then(parsers.parse('its placeholder reads "{expected_text}"'))
def verify_search_placeholder_attribute(projects_page: ProjectsPage, expected_text: str) -> None:
    actual = projects_page.search_input.get_attribute("placeholder")
    assert actual == expected_text, f"Expected placeholder text '{expected_text}', got '{actual}'"

@then(parsers.parse('only projects containing "{expected_match}" are visible in the grid'))
def assert_filtered_grid_cards(projects_page: ProjectsPage, expected_match: str) -> None:
    """Ensures that every project card left visible on the grid respects the search query."""
    visible_names = projects_page.get_visible_project_names()
    
    assert len(visible_names) > 0, f"Expected grid hits for query keyword '{expected_match}', but 0 cards rendered."
    for name in visible_names:
        assert expected_match.lower() in name.lower(), (
            f"Search validation error: Card title '{name}' does not contain expected substring '{expected_match}'"
        )

@then(parsers.parse('the grid is replaced by a message saying "{empty_msg}"'))
def check_empty_search_state_message(projects_page: ProjectsPage, empty_msg: str) -> None:
    """Asserts that our dashed error indicator text message triggers when a query fails."""
    assert projects_page.empty_search_state.is_visible(), "Dashed zero-results container did not trigger"
    actual_text = projects_page.empty_search_state.text_content()
    assert empty_msg in actual_text, f"Expected target string matching '{empty_msg}', got: '{actual_text}'"

@then('a "Clear search query" button link is visible')
def check_clear_search_button_visible(projects_page: ProjectsPage) -> None:
    """Verifies that the emergency reset button helper is interactable within the zero-state component."""
    assert projects_page.clear_search_button.is_visible(), "Reset button element missing inside fallback banner"