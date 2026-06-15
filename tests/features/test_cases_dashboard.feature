Feature: Test Case Dashboard
  As a user of SpecCheck
  I want to view a dashboard of all my generated test cases
  So that I can easily monitor, manage, and access my test cases in one central place

  Background:
    Given a user is logged in
    And the test case dashboard is open

  # Acceptance Test 1
  @test_case_dashboard @smoke
  Scenario: Dashboard displays test cases with title, creation date, and status
    Then the test case table is visible
    And each test case row displays a title
    And each test case row displays a creation date
    And each test case row displays a status

  # Acceptance Test 2
  @test_case_dashboard
  Scenario: Search bar filters test cases by keyword
    Given there are multiple test cases in the dashboard
    When the user types "login" into the search bar
    Then only test cases matching "login" are displayed in the results

  # Acceptance Test 3
  @test_case_dashboard
  Scenario: Each test case row displays a valid test case ID
    Then each test case row displays a valid test case ID

  # Acceptance Test 4
  @test_case_dashboard
  Scenario: Each test case row displays a priority value
    Then each test case row displays a priority value

  # Acceptance Test 5
  @test_case_dashboard
  Scenario: Dashboard loads the expected number of test cases
    Then the dashboard displays 3 test cases

  # Acceptance Test 6
  @test_case_dashboard
  Scenario: Clicking the Type column header activates the type filter
    When the user clicks the Type column header
    Then the Type column header shows an active filter label

  # Acceptance Test 7
  @test_case_dashboard
  Scenario: Clicking the Priority column header activates the priority filter
    When the user clicks the Priority column header
    Then the Priority column header shows an active filter label

  # Acceptance Test 8
  @test_case_dashboard @smoke
  Scenario: The Export button is visible on the test cases page
    Then the Export As button is visible

  # Acceptance Test 9
  @test_case_dashboard
  Scenario: Hovering the Export button reveals CSV and JSON download options
    When the user hovers over the Export button
    Then the export dropdown shows an Export CSV option
    And the export dropdown shows an Export JSON option

  # Acceptance Test 10
  @test_case_dashboard
  Scenario: The Create button opens the manual test case modal
    When the user clicks the Create button
    Then the Create Manual Test Case modal is visible

  # Acceptance Test 11
  @test_case_dashboard
  Scenario: The create modal contains all required form fields
    When the user clicks the Create button
    Then the modal title input field is visible
    And the modal Type label is visible
    And the modal Steps label is visible

  # Acceptance Test 12
  @test_case_dashboard
  Scenario: Canceling the create modal closes it
    Given the create modal is open
    When the user cancels the modal
    Then the create modal is no longer visible

  # Acceptance Test 13
  @test_case_dashboard
  Scenario: Clicking a test case row expands it to reveal test steps
    When the user clicks the first test case row
    Then the expanded row panel with test steps is visible

  # Acceptance Test 14
  @test_case_dashboard
  Scenario: Searching for a non-existent keyword shows an empty-state message
    When the user types "xyznonexistentkeyword" into the search bar
    Then the table shows a no-results message

  # Acceptance Test 15
  @test_case_dashboard
  Scenario: Clearing the search bar restores all test cases
    Given there are multiple test cases in the dashboard
    When the user types "login" into the search bar
    And the user clears the search bar
    Then the dashboard displays 3 test cases

  # Acceptance Test 16
  @test_case_dashboard @smoke
  Scenario: The Back to Projects button is visible on the test cases page
    Then the Back to Projects button is visible

  # Acceptance Test 17
  @test_case_dashboard
  Scenario: The page heading contains the project name
    Then the page heading contains "Mock Test Project"
