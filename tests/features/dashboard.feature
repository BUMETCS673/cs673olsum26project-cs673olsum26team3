Feature: Document Dashboard
  As a user of the Document Dashboard
  I want to manage documents through the UI
  So that I can upload, view, and delete system files

  Background:
    Given the Document Dashboard is open

  # ─── Page Layout ──────────────────────────────────────── 
  @management @smoke
  Scenario: Page shows header and upload section on load
    Then the page header reads "Document Dashboard"
    And the sub-header reads "Manage your uploaded documents and system files"
    And the upload section is visible
    And the Upload Files button is visible

  @management
  Scenario: Document table shows pre-loaded documents with correct columns
    Then the document table is visible
    And the table has the correct column headers
    And the table contains at least 1 row
    And each row has a filename, a date, a file size, and a Delete button

  # ─── File Upload ─────────────────────────────────────────
  @upload @smoke
  Scenario Outline: Successful upload of valid document types
    When the user selects the file "<fixture_file>"
    And the user clicks the Upload Files button
    Then an alert appears containing "successfully"
    And the document table contains a row with filename "<fixture_file>"

    Examples:
      | fixture_file      |
      | sample_valid.pdf  |
      | sample_valid.png  |
      | sample_valid.jpg  |

  @upload
  Scenario: Selected files preview appears before upload
    When the user selects the file "sample_valid.pdf"
    Then a preview shows "sample_valid.pdf" and its size in MB

  @upload
  Scenario: Clicking Upload Files with no file selected shows an alert
    When the user clicks the Upload Files button without selecting any files
    Then an alert appears containing "Please select or drop at least one valid file"



  @upload
  Scenario: Multiple files uploaded in a single request all appear in the table
    When the user selects files "sample_valid.pdf", "sample_valid.png", "sample_valid.jpg"
    And the user clicks the Upload Files button
    Then an alert appears containing "successfully"
    And the document table contains a row with filename "sample_valid.pdf"
    And the document table contains a row with filename "sample_valid.png"
    And the document table contains a row with filename "sample_valid.jpg"

  # ─── Validation ────────────────────────────────────────────── 
  @validation
  Scenario: Upload zone shows accepted formats and size hint
    Then the upload zone hint reads "Maximum 10 files, up to 20MB each (.pdf, .png, .jpg, .jpeg)"

  @validation
  Scenario Outline: Unsupported file format is rejected before upload
    When the user selects the file "<invalid_file>"
    Then an alert appears containing "Unsupported file format"
    And no files appear in the selected-files preview

    Examples:
      | invalid_file        |
      | sample_invalid.exe  |
      | sample_invalid.mp3  |

  @validation
  Scenario: Oversized file is rejected with a size-limit alert
    When the user selects the file "sample_oversized.pdf"
    Then an alert appears containing "exceed the 20MB limit"
    And no files appear in the selected-files preview

  @validation
  Scenario: Mixed valid and invalid files — only the valid file is kept in the preview
    When the user selects files "sample_valid.pdf" and "sample_invalid.exe"
    Then an alert appears containing "Unsupported file format"
    And a preview shows "sample_valid.pdf" and its size in MB
    And "sample_invalid.exe" does not appear in the preview

  # ─── Document Management ───────────────────────────────────── 
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
    Then the text "No documents available. Please upload files." is visible
    And the document table is not visible

  # ─── Drag and Drop ───────────────────────────────────────────
  @drag_drop
  Scenario: Dragging a file over the upload zone adds the dragging CSS class
    When the user drags a file over the upload section
    Then the upload section has CSS class "dragging"

  @drag_drop
  Scenario: Dragging away from the upload zone removes the dragging CSS class
    When the user drags a file over the upload section
    And the user drags the file away from the upload section
    Then the upload section does not have CSS class "dragging"

  @drag_drop
  Scenario: Dropping a valid PDF file shows it in the preview
    When the user drops "sample_valid.pdf" onto the upload zone
    Then a preview shows "sample_valid.pdf" and its size in MB

  @drag_drop @smoke
  Scenario: Dropping a valid file then uploading adds a row to the table
    When the user drops "sample_valid.pdf" onto the upload zone
    And the user clicks the Upload Files button
    Then an alert appears containing "successfully"
    And the document table contains a row with filename "sample_valid.pdf"

  @drag_drop
  Scenario: Dropping an unsupported file shows the format rejection alert
    When the user drops "sample_invalid.exe" onto the upload zone
    Then an alert appears containing "Unsupported file format"
    And no files appear in the selected-files preview

  @drag_drop
  Scenario: Dropping an oversized file shows the size-limit alert
    When the user drops "sample_oversized.pdf" onto the upload zone
    Then an alert appears containing "exceed the 20MB limit"
    And no files appear in the selected-files preview
