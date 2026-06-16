"""Page Object for the ProjectsView dashboard interface."""
from __future__ import annotations

from playwright.sync_api import Page


class ProjectsPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.header_title = page.locator("main h1:has-text('Projects')")
        self.search_input = page.locator("input[placeholder='Search projects by name...']")
        self.empty_search_state = page.locator("text=No projects found matching")
        self.clear_search_button = page.locator("button:has-text('Clear search query')")
        self.project_cards = page.locator("main h3").locator("..")

    def wait_for_projects_load(self) -> None:
        """Blocks execution until the 'Projects' dashboard heading renders on screen."""
        self.header_title.wait_for(state="visible", timeout=10_000)

    def has_projects(self) -> bool:
        """Return True if at least one project card is visible in the grid."""
        return self.page.get_by_role("button", name="Documents").first.is_visible()

    def create_test_project(self) -> None:
        """Create 'Test Automation Project' so search tests have a project to filter."""
        self.page.locator("button").filter(has_text="New Project").first.click()
        self.page.get_by_placeholder("e.g., Mobile App").fill("Test Automation Project")
        self.page.locator("button").filter(has_text="Create Project").click()
        self.page.wait_for_timeout(2_000)

    def search_for_project(self, text: str) -> None:
        """Fills out the search input and applies a brief timeout for React state changes."""
        self.search_input.fill(text)
        self.page.wait_for_timeout(400)

    def get_visible_project_names(self) -> list[str]:
        """Iterates through active project cards and compiles visible headings."""
        names = []
        count = self.project_cards.count()
        for i in range(count):
            card = self.project_cards.nth(i)
            if card.is_visible():
                title_text = card.locator("h3").first.text_content()
                if title_text:
                    names.append(title_text.strip())
        return names