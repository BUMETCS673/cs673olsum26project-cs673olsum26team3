"""Page Object for the TestCase Dashboard (card-based view).

CSS selectors are derived from TestCaseDashboard.jsx / App.css.
Navigation to this view is handled via DashboardPage.navigate_to_test_cases()
after login; this class only encapsulates element interactions.
"""
from __future__ import annotations

from playwright.sync_api import Page


class TestCaseDashboardPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.header_title = page.locator("h2.tc-page-title")
        self.header_subtitle = page.locator("p.tc-page-subtitle")
        self.card_grid = page.locator(".tc-card-grid")
        self.cards = page.locator(".tc-card")
        self.search_input = page.locator("input.tc-search-input")
        self.empty_state = page.locator(".tc-empty")

    # ──────────────────────────────── Header ────────────────────────────────

    def get_header_title(self) -> str:
        return self.header_title.inner_text()

    def get_header_subtitle(self) -> str:
        return self.header_subtitle.inner_text()

    # ──────────────────────────────── Card grid ──────────────────────────────

    def is_card_grid_visible(self) -> bool:
        return self.card_grid.is_visible()

    def get_card_count(self) -> int:
        return self.cards.count()

    def get_card_title(self, card_index: int) -> str:
        return self.cards.nth(card_index).locator("h3.tc-card-title").inner_text()

    def get_card_date(self, card_index: int) -> str:
        return self.cards.nth(card_index).locator("span.tc-card-date").inner_text()

    def get_card_badge_text(self, card_index: int) -> str:
        return self.cards.nth(card_index).locator("span.tc-badge").inner_text()

    def has_delete_button(self, card_index: int) -> bool:
        return self.cards.nth(card_index).locator("button.btn-card--delete").count() > 0

    def get_visible_card_titles(self) -> list[str]:
        return self.cards.locator("h3.tc-card-title").all_inner_texts()

    # ──────────────────────────────── Search ─────────────────────────────────

    def enter_search_query(self, query: str) -> None:
        self.search_input.fill(query)
