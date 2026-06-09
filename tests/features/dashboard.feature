Feature: Document Management
  As a user of SpecCheck
  I want to manage documents through the Documents view
  So that I can upload, view, and delete project documents

  # After login the app shows the Projects page.
  # The 'the user is logged in' step navigates into the first project's Documents view.

  Background:
    Given the user is logged in
    And the Document Dashboard is open

  # ─── Page Layout ───────────────────────────────────────────────────────────
  @management @smoke
  Scenario: Page shows header and upload section on load
    Then the page header reads "Documents"
    And the sub-header reads "Upload documents for this specific project"
    And the upload section is visible

  @management
  Scenario: Document table shows correct column headers
    Then the document table is visible
    And the table has the correct column headers

  # ─── File Upload ────────────────────────────────────────────────────────────
  # DocumentsView uploads immediately when files are selected (no separate Upload button).

  @upload @smoke
  Scenario Outline: Successful upload of valid document types
    When the user selects the file "<fixture_file>"
    Then an alert appears containing "successfully"
    And the document table contains a row with filename "<fixture_file>"

    Examples:
      | fixture_file      |
      | sample_valid.pdf  |
      | sample_valid.png  |
      | sample_valid.jpg  |

  @upload
  Scenario: Multiple files uploaded in a single selection all appear in the table
    When the user selects files "sample_valid.pdf", "sample_valid.png", "sample_valid.jpg"
    Then an alert appears containing "successfully"
    And the document table contains a row with filename "sample_valid.pdf"
    And the document table contains a row with filename "sample_valid.png"
    And the document table contains a row with filename "sample_valid.jpg"

  # ─── Validation ─────────────────────────────────────────────────────────────
  @validation
  Scenario Outline: Unsupported file format is rejected immediately on selection
    When the user selects the file "<invalid_file>"
    Then an alert appears containing "unsupported format"

    Examples:
      | invalid_file        |
      | sample_invalid.exe  |
      | sample_invalid.mp3  |

  @validation
  Scenario: Oversized file is rejected with a size-limit alert
    When the user selects the file "sample_oversized.pdf"
    Then an alert appears containing "too large"

  @validation
  Scenario: Mixed valid and invalid files — only the invalid file triggers a rejection alert
    When the user selects files "sample_valid.pdf" and "sample_invalid.exe"
    Then an alert appears containing "unsupported format"

  # ─── Document Management ────────────────────────────────────────────────────
  @management @smoke
  Scenario: Deleting a document with confirmation removes it from the table
    Given the document table has at least 1 row
    When the user records the initial row count
    And the user clicks Delete on the first row and confirms with OK
    Then the table has one fewer row than before

  @management
  Scenario: Cancelling the delete dialog keeps the document in the table
    Given the document table has at least 1 row
    When the user records the initial row count
    And the user clicks Delete on the first row and dismisses with Cancel
    Then the table row count is unchanged

  @management
  Scenario: Deleting all documents shows the empty-state message
    Given all documents have been deleted
    Then the text "No documents found for this project." is visible

  # ─── Drag and Drop ──────────────────────────────────────────────────────────
  @drag_drop
  Scenario: Dragging a file over the upload zone adds a dragging CSS class
    When the user drags a file over the upload section
    Then the upload section has CSS class "border-blue-500"

  @drag_drop
  Scenario: Dragging away from the upload zone removes the dragging CSS class
    When the user drags a file over the upload section
    And the user drags the file away from the upload section
    Then the upload section does not have CSS class "border-blue-500"

  @drag_drop @smoke
  Scenario: Dropping a valid file then uploading adds a row to the table
    When the user drops "sample_valid.pdf" onto the upload zone
    Then an alert appears containing "successfully"
    And the document table contains a row with filename "sample_valid.pdf"

  @drag_drop
  Scenario: Dropping an unsupported file shows the format rejection alert
    When the user drops "sample_invalid.exe" onto the upload zone
    Then an alert appears containing "unsupported format"

  @drag_drop
  Scenario: Dropping an oversized file shows the size-limit alert
    When the user drops "sample_oversized.pdf" onto the upload zone
    Then an alert appears containing "too large"
