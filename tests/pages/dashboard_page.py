"""Page Object for the DocumentsView (per-project document management).

# AI-USAGE SUMMARY
# Tools: Claude Code
# Selectors updated to match actual DocumentsView.jsx DOM (Tailwind-only, no semantic classes).
# Key changes from original:
#   - login() now waits for Projects view, then navigates into a project's Documents
#   - upload_section targets the drag-and-drop div (border-dashed)
#   - No upload_button (upload is immediate on file selection)
#   - No preview (files upload immediately; no staged preview)
#   - document_table uses 'main table' (no .document-table class)
#   - delete button targeted via title="Remove asset"
#   - empty state is a <td> inside the table, not p.no-data
#   - drag CSS class is Tailwind 'border-blue-500' (not 'dragging')
"""
from __future__ import annotations

import base64
from pathlib import Path

from playwright.sync_api import Page


class DashboardPage:
    BASE_URL = "http://localhost:5173"

    _MIME_TYPES: dict[str, str] = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }

    def __init__(self, page: Page) -> None:
        self.page = page

        # Header — DocumentsView renders "Documents / {projectName}"
        self.header_title = page.locator("main h1")
        # Subtitle — "Upload documents for this specific project"
        self.header_subtitle = page.locator("main p.text-gray-600").first

        # Upload drag-and-drop zone (div with border-dashed class)
        self.upload_section = page.locator("div.border-dashed")
        # File input inside the zone
        self.file_input = page.locator("input[type='file']")

        # Document table — only table inside main
        self.document_table = page.locator("main table")
        self.table_rows = page.locator("main table tbody tr")

    # ── Navigation ──────────────────────────────────────────────────────────

    def navigate(self, base_url: str = BASE_URL) -> None:
        self.page.goto(base_url)
        # "networkidle" is unreliable with Vite dev server (100+ individual JS module
        # requests on first load never settle within 15 s in Docker). Wait for the
        # login card element instead — appears as soon as React hydrates the page.
        self.page.locator(".login-card").wait_for(state="visible", timeout=30_000)

    def login(self, username: str, password: str) -> None:
        """Log in and navigate into the first available project's Documents view."""
        # Fill login form (Login.jsx uses structural selectors, no ids)
        self.page.locator(".login-card input[type='text']").fill(username)
        self.page.locator(".login-card input[type='password']").fill(password)
        self.page.locator(".login-card button[type='submit']").click()

        # Wait for the Projects page (h1 "Projects" or Logout button appearing)
        self.page.locator("button[title='Logout']").wait_for(state="visible", timeout=20_000)

        # Navigate into the first project's Documents view
        self._open_first_project_documents()

    def _open_first_project_documents(self) -> None:
        """Click 'Documents' on the first project card. Creates a project first if none exist."""
        # Wait until the Projects view has fully loaded: either project cards (Documents button)
        # or the empty state ("Welcome to SpecCheck") must be present before we decide.
        docs_locator = self.page.get_by_role("button", name="Documents")
        empty_locator = self.page.get_by_text("Welcome to SpecCheck")
        docs_locator.or_(empty_locator).first.wait_for(state="visible", timeout=15_000)

        docs_btn = self.page.get_by_role("button", name="Documents").first
        if not docs_btn.is_visible():
            # Empty state — no projects yet; create one via the UI first
            self._create_test_project()

        docs_btn.wait_for(state="visible", timeout=10_000)
        docs_btn.click()
        # Wait for a Documents-specific element (Projects view also has main h1,
        # so waiting on h1 alone would return immediately from the Projects h1).
        self.page.locator("div.border-dashed").wait_for(state="visible", timeout=10_000)

    def _create_test_project(self) -> None:
        """Create a test project via the UI (used when the account has no projects yet)."""
        # Use filter(has_text=) to match by visible text, not ARIA name, so the
        # Plus icon inside the button doesn't affect the match.
        self.page.locator("button").filter(has_text="New Project").first.click()
        self.page.get_by_placeholder("e.g., Mobile App").fill("Test Automation Project")
        self.page.locator("button").filter(has_text="Create Project").click()
        # Wait for the new project card's Documents button to appear (API + re-render).
        # Fixed sleep is unreliable in Docker where MongoDB Atlas can be slow.
        self.page.get_by_role("button", name="Documents").first.wait_for(
            state="visible", timeout=15_000
        )

    # ── Header ───────────────────────────────────────────────────────────────

    def get_header_title(self) -> str:
        return self.header_title.inner_text()

    def get_header_subtitle(self) -> str:
        return self.header_subtitle.inner_text()

    # ── Upload section ───────────────────────────────────────────────────────

    def is_upload_section_visible(self) -> bool:
        return self.upload_section.is_visible()

    def get_upload_section_classes(self) -> str:
        return self.upload_section.get_attribute("class") or ""

    def select_files(self, file_paths: list[str]) -> None:
        self.file_input.set_input_files(file_paths)

    # ── Document table ───────────────────────────────────────────────────────

    def is_document_table_visible(self) -> bool:
        # Table is always rendered; "not visible" means all rows are empty-state td
        return self.document_table.is_visible()

    def get_table_row_count(self) -> int:
        """Count only real document rows (not the empty-state row)."""
        rows = self.table_rows
        count = rows.count()
        if count == 1:
            # Could be the empty-state row; check if it has a delete button
            if rows.nth(0).locator("button[title='Remove asset']").count() == 0:
                return 0
        return count

    def get_table_header_texts(self) -> list[str]:
        return self.page.locator("main table thead th").all_inner_texts()

    def get_row_filename(self, row_index: int) -> str:
        # File name is in first td > div > span (after the FileText icon)
        return (
            self.table_rows.nth(row_index)
            .locator("td:first-child span")
            .inner_text()
        )

    def get_row_date(self, row_index: int) -> str:
        return self.table_rows.nth(row_index).locator("td").nth(1).inner_text()

    def get_row_status(self, row_index: int) -> str:
        """Returns the status text ('Ready' or 'Processing') for a row."""
        return self.table_rows.nth(row_index).locator("td").nth(2).inner_text()

    def has_delete_button(self, row_index: int) -> bool:
        return (
            self.table_rows.nth(row_index)
            .locator("button[title='Remove asset']")
            .count() > 0
        )

    def is_filename_in_table(self, filename: str) -> bool:
        return (
            self.page.locator("main table tbody td:first-child span")
            .filter(has_text=filename)
            .count() > 0
        )

    def click_delete_button(self, row_index: int) -> None:
        """Click the Delete button for the nth row.
        Caller must register a dialog handler BEFORE calling this.
        """
        self.table_rows.nth(row_index).locator("button[title='Remove asset']").click()

    def delete_all_documents(self) -> None:
        """Delete every document, accepting each confirmation dialog."""
        while self.get_table_row_count() > 0:
            self.page.once("dialog", lambda d: d.accept())
            self.table_rows.nth(0).locator("button[title='Remove asset']").click()
            self.page.wait_for_timeout(500)

    # ── Empty state ──────────────────────────────────────────────────────────

    def is_no_data_message_visible(self) -> bool:
        return self.page.get_by_text("No documents found for this project.").is_visible()

    def get_no_data_message(self) -> str:
        return (
            self.page.get_by_text("No documents found for this project.").inner_text()
        )

    # ── Drag and drop ────────────────────────────────────────────────────────

    def drag_file_over_upload_zone(self) -> None:
        """Dispatch dragover on the upload zone div to trigger the dragging state."""
        self.page.evaluate(
            """
            () => {
                const zone = document.querySelector('div.border-dashed');
                zone.dispatchEvent(new DragEvent('dragover', {
                    bubbles: true,
                    cancelable: true
                }));
            }
        """
        )

    def drag_file_away_from_upload_zone(self) -> None:
        """Dispatch dragleave to remove the dragging state."""
        self.page.evaluate(
            """
            () => {
                const zone = document.querySelector('div.border-dashed');
                zone.dispatchEvent(new DragEvent('dragleave', {
                    bubbles: true,
                    cancelable: true
                }));
            }
        """
        )

    def drop_file_onto_upload_zone(self, file_path: str) -> None:
        """Simulate a file drop using a JS DataTransfer object."""
        file_name = Path(file_path).name
        file_mime = self._MIME_TYPES.get(
            Path(file_path).suffix.lower(), "application/octet-stream"
        )
        file_b64 = base64.b64encode(Path(file_path).read_bytes()).decode("ascii")

        self.page.evaluate(
            """
            ([fileName, fileB64, fileMime]) => {
                const binary = atob(fileB64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: fileMime });
                const file = new File([blob], fileName, { type: fileMime });
                const dt = new DataTransfer();
                dt.items.add(file);
                const zone = document.querySelector('div.border-dashed');
                zone.dispatchEvent(new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dt
                }));
            }
        """,
            [file_name, file_b64, file_mime],
        )
