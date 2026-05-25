"""Page Object for the Document Dashboard (single-page React app)."""
from __future__ import annotations

from pathlib import Path

from playwright.sync_api import Page


class DashboardPage:
    """Encapsulates all interactions with the Document Dashboard page.

    Selectors are based on CSS class names in App.jsx / App.css.
    Dialog handlers (alert/confirm) are intentionally NOT registered here —
    callers register page.once("dialog", ...) before triggering actions so
    they retain full control over accept vs. dismiss.
    """

    BASE_URL = "http://localhost:5173"

    # --- MIME type map for drag-and-drop simulation ---
    _MIME_TYPES: dict[str, str] = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }

    def __init__(self, page: Page) -> None:
        self.page = page

        # Locators (lazy — resolved on first use)
        self.header_title = page.locator("h1")
        self.header_subtitle = page.locator(".dashboard-header p")
        self.upload_section = page.locator(".upload-section")
        self.upload_form = page.locator(".upload-form")
        self.file_input = page.locator("input.file-input-field")
        self.upload_button = page.locator("button.btn-upload")
        self.upload_hint = page.locator("span.upload-hint")
        self.preview_section = page.locator(".selected-files-preview")
        self.document_table = page.locator(".document-table")
        self.table_rows = page.locator(".document-table tbody tr")
        self.no_data_message = page.locator("p.no-data")

    # ──────────────────────────────── Navigation ────────────────────────────

    def navigate(self, base_url: str = BASE_URL) -> None:
        self.page.goto(base_url)
        self.header_title.wait_for(state="visible")

    # ──────────────────────────────── Header ────────────────────────────────

    def get_header_title(self) -> str:
        return self.header_title.inner_text()

    def get_header_subtitle(self) -> str:
        return self.header_subtitle.inner_text()

    # ──────────────────────────────── Upload section ─────────────────────────

    def is_upload_section_visible(self) -> bool:
        return self.upload_section.is_visible()

    def get_upload_section_classes(self) -> str:
        return self.upload_section.get_attribute("class") or ""

    def get_upload_hint_text(self) -> str:
        return self.upload_hint.inner_text()

    def is_upload_button_visible(self) -> bool:
        return self.upload_button.is_visible()

    def select_files(self, file_paths: list[str]) -> None:
        self.file_input.set_input_files(file_paths)

    def click_upload_button(self) -> None:
        self.upload_button.click()

    # ──────────────────────────────── Preview ────────────────────────────────

    def is_preview_visible(self) -> bool:
        return self.preview_section.is_visible()

    def get_preview_filenames(self) -> list[str]:
        """Return filenames shown in the pre-upload preview list."""
        # DOM: li.preview-item > div > span (filename)
        return self.page.locator(".preview-item div span").all_inner_texts()

    def get_preview_sizes(self) -> list[str]:
        """Return size strings shown in the pre-upload preview list."""
        # DOM: li.preview-item > span (size, direct child)
        return self.page.locator(".preview-item > span").all_inner_texts()

    # ──────────────────────────────── Document table ─────────────────────────

    def is_document_table_visible(self) -> bool:
        return self.document_table.is_visible()

    def get_table_row_count(self) -> int:
        return self.table_rows.count()

    def get_table_header_texts(self) -> list[str]:
        return self.page.locator(".document-table thead th").all_inner_texts()

    def get_row_filename(self, row_index: int) -> str:
        return (
            self.table_rows.nth(row_index)
            .locator(".file-name-wrapper span")
            .inner_text()
        )

    def get_row_date(self, row_index: int) -> str:
        return self.table_rows.nth(row_index).locator("td").nth(1).inner_text()

    def get_row_size(self, row_index: int) -> str:
        return self.table_rows.nth(row_index).locator("td").nth(2).inner_text()

    def has_delete_button(self, row_index: int) -> bool:
        return (
            self.table_rows.nth(row_index).locator("button.btn-delete").count() > 0
        )

    def is_filename_in_table(self, filename: str) -> bool:
        return (
            self.page.locator(".file-name-wrapper span")
            .filter(has_text=filename)
            .count()
            > 0
        )

    def click_delete_button(self, row_index: int) -> None:
        """Click the Delete button for the nth row.
        Caller must register a dialog handler BEFORE calling this method.
        """
        self.table_rows.nth(row_index).locator("button.btn-delete").click()

    def delete_all_documents(self) -> None:
        """Delete every document, accepting each confirmation dialog."""
        while self.table_rows.count() > 0:
            self.page.once("dialog", lambda d: d.accept())
            self.table_rows.nth(0).locator("button.btn-delete").click()
            # Wait for React to re-render after state update
            self.page.wait_for_timeout(400)

    # ──────────────────────────────── Empty state ────────────────────────────

    def is_no_data_message_visible(self) -> bool:
        return self.no_data_message.is_visible()

    def get_no_data_message(self) -> str:
        return self.no_data_message.inner_text()

    # ──────────────────────────────── Drag and drop ──────────────────────────

    def drag_file_over_upload_zone(self) -> None:
        """Simulate a dragover event on the upload form to trigger the dragging CSS class."""
        self.page.evaluate(
            """
            () => {
                const form = document.querySelector('.upload-form');
                form.dispatchEvent(new DragEvent('dragover', {
                    bubbles: true,
                    cancelable: true
                }));
            }
        """
        )

    def drag_file_away_from_upload_zone(self) -> None:
        """Simulate a dragleave event to remove the dragging CSS class."""
        self.page.evaluate(
            """
            () => {
                const form = document.querySelector('.upload-form');
                form.dispatchEvent(new DragEvent('dragleave', {
                    bubbles: true,
                    cancelable: true
                }));
            }
        """
        )

    def drop_file_onto_upload_zone(self, file_path: str) -> None:
        """Simulate a file drop using a JS DataTransfer object.

        Creates a File of the correct name and size in the browser and dispatches
        a synthetic 'drop' event on the upload form. This triggers React's
        handleDrop handler and the validateAndFilterFiles logic.
        """
        file_name = Path(file_path).name
        file_size = Path(file_path).stat().st_size
        file_mime = self._MIME_TYPES.get(Path(file_path).suffix.lower(), "application/octet-stream")

        self.page.evaluate(
            """
            ([fileName, fileSize, fileMime]) => {
                const arr = new Uint8Array(fileSize);
                const blob = new Blob([arr], { type: fileMime });
                const file = new File([blob], fileName, { type: fileMime });
                const dt = new DataTransfer();
                dt.items.add(file);
                const form = document.querySelector('.upload-form');
                form.dispatchEvent(new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dt
                }));
            }
        """,
            [file_name, file_size, file_mime],
        )
