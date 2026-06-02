# AI-USAGE SUMMARY
# Tools: Claude COde
# Overall AI Contribution: ~10%
# AI-Assisted Areas:  Refined Gherkin step wording, tags
# Human Contributions: Designed feature structure and test scenarios, added steps
#   - Given/When/Then step patterns
#   - Feature and Background setup
# Modifications:
#   - Simplified scenario wording
#   - Removed redundant phrasing 
# Verification: Test passed successfully in the test suite, confirming the accuracy of the Gherkin steps and overall feature structure.
# Confidence: High - aligned with Gherkin pattern and actively tested

Feature: TestCase Dashboard
  As a user of the TestCase Dashboard
  I want to manage test cases through the UI
  So that I can view, search, and delete test cases

  Background:
    Given the user is logged in
    And the TestCase Dashboard is open

  @management @smoke
  Scenario: Page shows header and card grid on load
    Then the test case page header reads "Test Cases"
    And the test case page sub-header reads "Monitor and manage your generated test cases"
    And the test case card grid is visible

  @management
  Scenario: Test case cards show pre-loaded test cases with correct elements
    Then the test case card grid is visible
    And the card grid contains at least 1 card
    And each card has a title, a date, a status badge, and a Delete button

  Scenario: User can search for test cases by keyword
    When the user enters "invalid" into the search bar
    Then only cards containing "invalid" in the title are shown
