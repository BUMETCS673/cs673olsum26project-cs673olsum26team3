


Feature: TestCase Dashboard
  As a user of the TestCase Dashboard
  I want to manage test cases through the UI
  So that I can upload, view, and delete test case files

  Background:
    Given the user is logged in
    And the TestCase Dashboard is open

  @management @smoke
  Scenario: Page shows header and upload section on load
    Then the page header reads "Test Cases"
    And the sub-header reads "Upload and manage your test case files"
    And the upload section is visible
    And the Upload Files button is visible

  @management
  Scenario: Test case table shows pre-loaded test cases with correct columns
    Then the test case table is visible
    And the table has the correct column headers
    And the table contains at least 1 row
    And each row has a filename, a date, a file size, and a Delete button

    Scenario: User can search for test cases by test case keyword
    When the user enters "invalid" into the search bar
    Then the test case table shows only rows with "invalid" in the test scenario name column