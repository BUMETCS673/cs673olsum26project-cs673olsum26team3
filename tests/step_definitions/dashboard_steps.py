"""Step definitions for features/dashboard.feature.

One step file per feature file, following the Page Object Model pattern:
  DashboardPage  →  dashboard.feature  →  dashboard_steps.py

Dialog handling pattern
-----------------------
window.alert() and window.confirm() must be handled by registering
page.once("dialog", handler) BEFORE the action that triggers the dialog.
For multi-step scenarios (When … Then …), we capture the message in the
When step using page.expect_dialog() so the Then step can assert on it.
"""
from __future__ import annotations

import re

import pytest
from pytest_bdd import given, parsers, then, when

from pages.dashboard_page import DashboardPage

# ─────────────────────────────────── Given ──────────────────────────────────────


@given("the Document Dashboard is open")
def dashboard_is_open(dashboard_page: DashboardPage) -> None:
    """Navigation is handled by the dashboard_page fixture."""


@given("the document table has at least 1 row")
def table_has_rows(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.get_table_row_count() >= 1, (
        "Expected at least 1 row in the document table"
    )


@given("all documents have been deleted")
def all_documents_deleted(dashboard_page: DashboardPage) -> None:
    dashboard_page.delete_all_documents()


# ─────────────────────────────────── When ───────────────────────────────────────


@when(parsers.parse('the user selects the file "{fixture_file}"'))
def select_single_file(
    dashboard_page: DashboardPage,
    page,
    fixture_path,
    fixture_file: str,
    dialog_messages: list,
) -> None:
    """Select a file via the file input. Captures any synchronous alert that fires."""
    def _handle(dialog):
        dialog_messages.append(dialog.message)
        dialog.accept()

    page.on("dialog", _handle)
    try:
        dashboard_page.select_files([fixture_path(fixture_file)])
        # Brief pause so synchronous dialogs are processed before we remove the listener
        page.wait_for_timeout(150)
    finally:
        page.remove_listener("dialog", _handle)


@when(parsers.parse('the user selects files "{f1}", "{f2}", "{f3}"'))
def select_three_files(
    dashboard_page: DashboardPage,
    fixture_path,
    f1: str,
    f2: str,
    f3: str,
) -> None:
    dashboard_page.select_files([fixture_path(f1), fixture_path(f2), fixture_path(f3)])


@when(parsers.parse('the user selects files "{f1}" and "{f2}"'))
def select_two_files(
    dashboard_page: DashboardPage,
    page,
    fixture_path,
    f1: str,
    f2: str,
    dialog_messages: list,
) -> None:
    """Select two files; captures any validation alert that fires."""
    def _handle(dialog):
        dialog_messages.append(dialog.message)
        dialog.accept()

    page.on("dialog", _handle)
    try:
        dashboard_page.select_files([fixture_path(f1), fixture_path(f2)])
        page.wait_for_timeout(150)
    finally:
        page.remove_listener("dialog", _handle)


@when("the user clicks the Upload Files button")
def click_upload(
    dashboard_page: DashboardPage,
    page,
    dialog_messages: list,
) -> None:
    """Click Upload Files and wait for the dialog (may require backend round-trip)."""
    with page.expect_dialog(timeout=30_000) as dialog_info:
        dashboard_page.click_upload_button()
    dialog = dialog_info.value
    dialog_messages.append(dialog.message)
    dialog.accept()


@when("the user clicks the Upload Files button without selecting any files")
def click_upload_no_files(
    dashboard_page: DashboardPage,
    page,
    dialog_messages: list,
) -> None:
    """Click Upload Files when no file is selected — fires alert synchronously."""
    with page.expect_dialog(timeout=5_000) as dialog_info:
        dashboard_page.click_upload_button()
    dialog = dialog_info.value
    dialog_messages.append(dialog.message)
    dialog.accept()


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
    with page.expect_dialog(timeout=5_000) as dialog_info:
        dashboard_page.click_delete_button(0)
    dialog = dialog_info.value
    dialog_messages.append(dialog.message)
    dialog.accept()
    page.wait_for_timeout(300)  # let React re-render


@when("the user clicks Delete on the first row and dismisses with Cancel")
def delete_first_row_cancel(
    dashboard_page: DashboardPage,
    page,
    dialog_messages: list,
) -> None:
    with page.expect_dialog(timeout=5_000) as dialog_info:
        dashboard_page.click_delete_button(0)
    dialog = dialog_info.value
    dialog_messages.append(dialog.message)
    dialog.dismiss()


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
    """Drop a file onto the upload zone; capture any synchronous validation alert."""
    def _handle(dialog):
        dialog_messages.append(dialog.message)
        dialog.accept()

    page.on("dialog", _handle)
    try:
        dashboard_page.drop_file_onto_upload_zone(fixture_path(fixture_file))
        page.wait_for_timeout(200)
    finally:
        page.remove_listener("dialog", _handle)


# ─────────────────────────────────── Then ───────────────────────────────────────

# ── Page layout ──

@then(parsers.parse('the page header reads "{expected_text}"'))
def check_header(dashboard_page: DashboardPage, expected_text: str) -> None:
    assert dashboard_page.get_header_title() == expected_text


@then(parsers.parse('the sub-header reads "{expected_text}"'))
def check_subheader(dashboard_page: DashboardPage, expected_text: str) -> None:
    assert dashboard_page.get_header_subtitle() == expected_text


@then("the upload section is visible")
def check_upload_section(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.is_upload_section_visible()


@then("the Upload Files button is visible")
def check_upload_button(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.is_upload_button_visible()


# ── Table structure ──

@then("the document table is visible")
def check_table_visible(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.is_document_table_visible()


@then("the table has the correct column headers")
def check_table_headers(dashboard_page: DashboardPage) -> None:
    expected = ["Document Name", "Upload Date", "File Size", "Action"]
    assert dashboard_page.get_table_header_texts() == expected


@then("the table contains at least 1 row")
def check_table_has_rows(dashboard_page: DashboardPage) -> None:
    assert dashboard_page.get_table_row_count() >= 1


@then("each row has a filename, a date, a file size, and a Delete button")
def check_each_row(dashboard_page: DashboardPage) -> None:
    count = dashboard_page.get_table_row_count()
    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    for i in range(count):
        filename = dashboard_page.get_row_filename(i)
        date_str = dashboard_page.get_row_date(i)
        size_str = dashboard_page.get_row_size(i)
        has_delete = dashboard_page.has_delete_button(i)
        assert filename, f"Row {i}: filename is empty"
        assert date_pattern.match(date_str), f"Row {i}: date '{date_str}' is not YYYY-MM-DD"
        assert "MB" in size_str, f"Row {i}: size '{size_str}' does not contain 'MB'"
        assert has_delete, f"Row {i}: no Delete button found"


# ── Alerts ──

@then(parsers.parse('an alert appears containing "{expected_text}"'))
def check_alert(dialog_messages: list, expected_text: str) -> None:
    assert dialog_messages, "No dialog was captured"
    assert any(expected_text in msg for msg in dialog_messages), (
        f"Expected alert containing '{expected_text}'. Captured messages: {dialog_messages}"
    )


# ── Upload / preview ──

@then(parsers.parse('the document table contains a row with filename "{fixture_file}"'))
def check_filename_in_table(
    dashboard_page: DashboardPage,
    page,
    fixture_file: str,
) -> None:
    # Wait up to 5 s for the new row to appear (backend processing time)
    page.wait_for_timeout(500)
    assert dashboard_page.is_filename_in_table(fixture_file), (
        f"Filename '{fixture_file}' not found in the document table"
    )


@then(parsers.parse('a preview shows "{fixture_file}" and its size in MB'))
def check_preview(dashboard_page: DashboardPage, fixture_file: str) -> None:
    assert dashboard_page.is_preview_visible(), "Preview section is not visible"
    filenames = dashboard_page.get_preview_filenames()
    assert fixture_file in filenames, (
        f"'{fixture_file}' not found in preview. Preview filenames: {filenames}"
    )
    sizes = dashboard_page.get_preview_sizes()
    assert sizes, "Preview sizes list is empty"
    assert any("MB" in s for s in sizes), (
        f"No size with 'MB' found in preview. Sizes: {sizes}"
    )


@then("no files appear in the selected-files preview")
def check_no_preview(dashboard_page: DashboardPage) -> None:
    assert not dashboard_page.is_preview_visible(), (
        "Preview section is visible but should be empty/hidden"
    )


@then(parsers.parse('the upload zone hint reads "{expected_text}"'))
def check_hint_text(dashboard_page: DashboardPage, expected_text: str) -> None:
    hint = dashboard_page.get_upload_hint_text()
    assert expected_text in hint, (
        f"Expected hint '{expected_text}', got: '{hint}'"
    )


@then(parsers.parse('"{filename}" does not appear in the preview'))
def check_filename_not_in_preview(dashboard_page: DashboardPage, filename: str) -> None:
    if dashboard_page.is_preview_visible():
        filenames = dashboard_page.get_preview_filenames()
        assert filename not in filenames, (
            f"'{filename}' unexpectedly found in preview: {filenames}"
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
def check_text_visible(dashboard_page: DashboardPage, expected_text: str) -> None:
    msg = dashboard_page.get_no_data_message()
    assert expected_text in msg, (
        f"Expected text '{expected_text}', got '{msg}'"
    )


@then("the document table is not visible")
def check_table_not_visible(dashboard_page: DashboardPage) -> None:
    assert not dashboard_page.is_document_table_visible(), (
        "Document table is visible but should be hidden after all docs deleted"
    )


# ── Drag and drop ──

@then(parsers.parse('the upload section has CSS class "{css_class}"'))
def check_has_class(dashboard_page: DashboardPage, css_class: str) -> None:
    classes = dashboard_page.get_upload_section_classes()
    assert css_class in classes, (
        f"Expected CSS class '{css_class}' on upload-section. Classes: '{classes}'"
    )


@then(parsers.parse('the upload section does not have CSS class "{css_class}"'))
def check_not_has_class(dashboard_page: DashboardPage, css_class: str) -> None:
    classes = dashboard_page.get_upload_section_classes()
    assert css_class not in classes, (
        f"CSS class '{css_class}' should not be on upload-section. Classes: '{classes}'"
    )
