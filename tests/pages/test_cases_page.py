"""Page Object for the TestCasesView (test case dashboard).

# AI-USAGE SUMMARY
# Tools: Claude Code
# Selectors target the TestCasesView.jsx DOM:
#   - Table columns (after 'Created' column addition): ID(0), Description(1),
#     Created(2), Type/Status(3), Priority(4), Actions(5)
#   - Search input targeted by placeholder text
#   - Navigation via the 'View Tests' button on project cards
"""
from __future__ import annotations

from playwright.sync_api import Page


class TestCasesPage:
    BASE_URL = "http://localhost:5173"

    def __init__(self, page: Page) -> None:
        self.page = page
        self.table = page.locator("main table")
        self.search_input = page.get_by_placeholder("Search test cases...")

    def navigate(self, base_url: str = BASE_URL) -> None:
        self.page.goto(base_url)
        self.page.wait_for_load_state("networkidle", timeout=15_000)

    def login(self, username: str, password: str) -> None:
        self.page.locator(".login-card input[type='text']").fill(username)
        self.page.locator(".login-card input[type='password']").fill(password)
        self.page.locator(".login-card button[type='submit']").click()
        self.page.locator("button[title='Logout']").wait_for(state="visible", timeout=10_000)

    def navigate_to_test_cases(self) -> None:
        """Click 'View Tests' on the first project card and wait for the table."""
        btn = self.page.get_by_role("button", name="View Tests").first
        btn.wait_for(state="visible", timeout=15_000)
        btn.click()
        self.table.wait_for(state="visible", timeout=10_000)
        # Allow React to finish the async fetch and render rows
        self.page.wait_for_timeout(800)

    # ── Table inspection ─────────────────────────────────────────────────────

    def is_table_visible(self) -> bool:
        return self.table.is_visible()

    def _all_rows(self):
        return self.page.locator("main table tbody tr")

    def get_table_row_count(self) -> int:
        rows = self._all_rows()
        count = rows.count()
        if count == 1:
            text = rows.first.inner_text().strip()
            if "No test cases match" in text or "Loading test cases" in text:
                return 0
        return count

    def get_row_title(self, row_index: int) -> str:
        """Title is in td[1] > div > span.font-medium."""
        return (
            self._all_rows()
            .nth(row_index)
            .locator("td")
            .nth(1)
            .locator("span.font-medium")
            .first.inner_text()
        )

    def get_row_creation_date(self, row_index: int) -> str:
        """Creation date is in td[2]."""
        return (
            self._all_rows()
            .nth(row_index)
            .locator("td")
            .nth(2)
            .inner_text()
            .strip()
        )

    def get_row_status(self, row_index: int) -> str:
        """Type/status badge is in td[3]."""
        return (
            self._all_rows()
            .nth(row_index)
            .locator("td")
            .nth(3)
            .inner_text()
            .strip()
        )

    def get_all_visible_row_titles(self) -> list[str]:
        return [self.get_row_title(i) for i in range(self.get_table_row_count())]

    # ── Search ───────────────────────────────────────────────────────────────

    def type_search_query(self, query: str) -> None:
        self.search_input.fill(query)
        self.page.wait_for_timeout(300)
