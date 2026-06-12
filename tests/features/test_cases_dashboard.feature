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
