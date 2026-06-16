# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements

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