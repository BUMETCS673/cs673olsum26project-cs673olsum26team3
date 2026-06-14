"""Step definitions for features/dashboard.feature.

# AI-USAGE SUMMARY
# Tools: Claude Code
# Key changes aligned with current DocumentsView.jsx:
#   - Upload is immediate on file selection (no separate Upload button)
#   - No preview staging — files upload and appear in table directly
#   - Drag zone CSS class is Tailwind 'border-blue-500' (isDragging state), not 'dragging'
#   - Empty state text: "No documents found for this project."
#   - Row status column is 'Ready'/'Processing', not file size
#   - 'click upload without selecting' step removed (no such button in current UI)
"""
from __future__ import annotations

import re

from pytest_bdd import given, parsers, then, when

from pages.dashboard_page import DashboardPage


# ─────────────────────────────── Given ──────────────────────────────────────


@given("the user is logged in")
def user_is_logged_in(dashboard_page: DashboardPage, test_credentials: dict, seed_api_data: dict) -> None:
    dashboard_page.login(
        test_credentials["username"],
        test_credentials["password"],
        project_name=seed_api_data.get("project_name"),
    )


@given("the Document Dashboard is open")
def dashboard_is_open(dashboard_page: DashboardPage) -> None:
    """Navigation to Documents view is handled inside dashboard_page.login()."""


@given("the document table has at least 1 row")
def table_has_rows(dashboard_page: DashboardPage) -> None:
    count = dashboard_page.get_table_row_count()
    assert count >= 1, (
        f"Expected at least 1 document in the table but found {count}. "
        "Upload scenarios must run before delete scenarios."
    )


@given("all documents have been deleted")
def all_docs_deleted(dashboard_page: DashboardPage, page) -> None:
    dashboard_page.delete_all_documents()
    page.wait_for_timeout(300)


# ─────────────────────────────── When ───────────────────────────────────────


def _wait_for_dialog(page, dialog_messages: list, action_fn) -> None:
    """Register a one-shot dialog handler and run action_fn.

    Polls for 3 s to capture synchronous alerts (validation errors fire during
    action_fn itself).  Async upload-success alerts arrive later — check_alert
    handles those with a longer wait so we don't block the When step.
    Using page.once() instead of expect_event() avoids a deadlock where Python
    blocks inside set_input_files() / evaluate() while a synchronous alert() is
    waiting for a handler.
    """
    def _handle(dialog):
        dialog_messages.append(dialog.message)
        dialog.accept()

    page.once("dialog", _handle)
    action_fn()

    # Brief poll — enough for synchronous alerts; async alerts are awaited in check_alert.
    for _ in range(15):  # up to 3 s
        if dialog_messages:
            break
        page.wait_for_timeout(200)


@when(parsers.parse('the user selects the file "{fixture_file}"'))
def select_single_file(
    dashboard_page: DashboardPage,
    page,
    fixture_path,
    fixture_file: str,
    dialog_messages: list,
) -> None:
    _wait_for_dialog(
        page, dialog_messages,
        lambda: dashboard_page.select_files([fixture_path(fixture_file)]),
    )


@when(parsers.parse('the user selects files "{f1}", "{f2}", "{f3}"'))
def select_three_files(
    dashboard_page: DashboardPage,
    page,
    fixture_path,
    f1: str,
    f2: str,
    f3: str,
    dialog_messages: list,
) -> None:
    _wait_for_dialog(
        page, dialog_messages,
        lambda: dashboard_page.select_files([fixture_path(f1), fixture_path(f2), fixture_path(f3)]),
    )


@when(parsers.parse('the user selects files "{f1}" and "{f2}"'))
def select_two_files(
    dashboard_page: DashboardPage,
    page,
    fixture_path,
    f1: str,
    f2: str,
    dialog_messages: list,
) -> None:
    _wait_for_dialog(
        page, dialog_messages,
        lambda: dashboard_page.select_files([fixture_path(f1), fixture_path(f2)]),
    )


@when("the user records the initial row count")
def record_row_count(
    dashboard_page: DashboardPage,
    row_count_store: dict,
) -> None:
    row_count_store["initial"] = dashboard_page.get_table_row_count()


@when("the user clicks Delete on the first row and confirms with OK")
def delete_first_row_ok(
    dashboard_page: DashboardPage,
    page,
    dialog_messages: list,
) -> None:
    def _handle(dialog):
        dialog_messages.append(dialog.message)
        dialog.accept()

    page.once("dialog", _handle)
    dashboard_page.click_delete_button(0)
    page.wait_for_timeout(500)


@when("the user clicks Delete on the first row and dismisses with Cancel")
def delete_first_row_cancel(
    dashboard_page: DashboardPage,
    page,
    dialog_messages: list,
) -> None:
    def _handle(dialog):
        dialog_messages.append(dialog.message)
        dialog.dismiss()

    page.once("dialog", _handle)
    dashboard_page.click_delete_button(0)
    page.wait_for_timeout(300)


@when("the user drags a file over the upload section")
def drag_over(dashboard_page: DashboardPage) -> None:
    dashboard_page.drag_file_over_upload_zone()


@when("the user drags the file away from the upload section")
def drag_away(dashboard_page: DashboardPage) -> None:
    dashboard_page.drag_file_away_from_upload_zone()


@when(parsers.parse('the user drops "{fixture_file}" onto the upload zone'))
def drop_file(
    dashboard_page: DashboardPage,
    page,
    fixture_path,
    fixture_file: str,
    dialog_messages: list,
) -> None:
    """Drop a file; capture any validation or upload-success dialog."""
    _wait_for_dialog(
        page, dialog_messages,
        lambda: dashboard_page.drop_file_onto_upload_zone(fixture_path(fixture_file)),
    )


# ─────────────────────────────── Then ───────────────────────────────────────

# ── Page layout ──

@then(parsers.parse('the page header reads "{expected_text}"'))
def check_header(dashboard_page: DashboardPage, expected_text: str) -> None:
    actual = dashboard_page.get_header_title()
    assert expected_text in actual, f"Expected header containing '{expected_text}', got '{actual}'"


@then(parsers.parse('the sub-header reads "{expected_text}"'))
def check_subheader(dashboard_page: DashboardPage, expected_text: str) -> None:
    actual = dashboard_page.get_header_subtitle()
    assert expected_text in actual, f"Expected sub-header containing '{expected_text}', got '{actual}'"


@then("the upload section is visible")
def check_upload_section(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.is_upload_section_visible()


# ── Table structure ──

@then("the document table is visible")
def check_table_visible(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.is_document_table_visible()


@then("the table has the correct column headers")
def check_table_headers(dashboard_page: DashboardPage) -> None:
    expected = ["Document", "Uploaded", "Status", "Actions"]
    actual = dashboard_page.get_table_header_texts()
    assert actual == expected, f"Expected headers {expected}, got {actual}"


@then("the table contains at least 1 row")
def check_table_has_rows(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.get_table_row_count() >= 1


@then("each row has a filename, a date, a status, and a Delete button")
def check_each_row(dashboard_page: DashboardPage) -> None:
    count = dashboard_page.get_table_row_count()
    for i in range(count):
        filename = dashboard_page.get_row_filename(i)
        date_str = dashboard_page.get_row_date(i)
        status_str = dashboard_page.get_row_status(i)
        has_delete = dashboard_page.has_delete_button(i)
        assert filename, f"Row {i}: filename is empty"
        assert date_str, f"Row {i}: date is empty"
        assert status_str in ("Ready", "Processing"), (
            f"Row {i}: status '{status_str}' is not 'Ready' or 'Processing'"
        )
        assert has_delete, f"Row {i}: no Delete button found"


# ── Alerts ──

@then(parsers.parse('an alert appears containing "{expected_text}"'))
def check_alert(page, dialog_messages: list, expected_text: str) -> None:
    # Sync alerts (validation) are already in dialog_messages; async upload-success
    # alerts may need up to 3 minutes on the real backend (OCR + embedding calls).
    for _ in range(900):  # up to 180 s
        if dialog_messages:
            break
        page.wait_for_timeout(200)
    assert dialog_messages, "No dialog was captured"
    assert any(expected_text in msg for msg in dialog_messages), (
        f"Expected alert containing '{expected_text}'. Captured: {dialog_messages}"
    )


# ── Upload ──

@then(parsers.parse('the document table contains a row with filename "{fixture_file}"'))
def check_filename_in_table(
    dashboard_page: DashboardPage,
    page,
    fixture_file: str,
) -> None:
    page.locator("main table tbody td:first-child span").filter(
        has_text=fixture_file
    ).wait_for(state="visible", timeout=10_000)
    assert dashboard_page.is_filename_in_table(fixture_file), (
        f"'{fixture_file}' not found in document table"
    )


# ── Delete outcomes ──

@then("the table has one fewer row than before")
def check_row_decreased(
    dashboard_page: DashboardPage,
    row_count_store: dict,
) -> None:
    expected = row_count_store["initial"] - 1
    actual = dashboard_page.get_table_row_count()
    assert actual == expected, (
        f"Expected {expected} rows after deletion, got {actual}"
    )


@then("the table row count is unchanged")
def check_row_count_unchanged(
    dashboard_page: DashboardPage,
    row_count_store: dict,
) -> None:
    expected = row_count_store["initial"]
    actual = dashboard_page.get_table_row_count()
    assert actual == expected, (
        f"Expected {expected} rows (unchanged), got {actual}"
    )


@then(parsers.parse('the text "{expected_text}" is visible'))
def check_text_visible(page, expected_text: str) -> None:
    locator = page.get_by_text(expected_text, exact=False)
    assert locator.is_visible(), f"Expected text '{expected_text}' to be visible"


@then("the document table is not visible")
def check_table_not_visible(dashboard_page: DashboardPage) -> None:
    # When all docs are deleted, empty-state td shows; real data rows = 0
    assert dashboard_page.get_table_row_count() == 0, (
        "Document table still has rows after all documents were deleted"
    )


# ── Drag and drop ──

@then(parsers.parse('the upload section has CSS class "{css_class}"'))
def check_has_class(dashboard_page: DashboardPage, css_class: str) -> None:
    classes = dashboard_page.get_upload_section_classes()
    assert css_class in classes, (
        f"Expected CSS class '{css_class}' on upload zone. Classes: '{classes}'"
    )


@then(parsers.parse('the upload section does not have CSS class "{css_class}"'))
def check_not_has_class(dashboard_page: DashboardPage, css_class: str) -> None:
    classes = dashboard_page.get_upload_section_classes()
    assert css_class not in classes, (
        f"CSS class '{css_class}' should not be present. Classes: '{classes}'"
    )

