# AI-USAGE SUMMARY
# Tools: GitHub Copilot
# Overall AI Contribution: ~45%
# AI-Assisted Areas:  Refined Gherkin step wording, assisted in setting up feature files
# Human Contributions: Designed feature structure and test scenarios, login validation logic
# Areas of AI Influence:
#   - Given/When/Then step patterns
#   - Feature and Background setup
# Modifications:
#   - Simplified scenario wording
#   - Removed redundant phrasing 
# Verification: Feature file binds to login_steps.py definitions; test execution validates scenarios
# Confidence: High - aligned with Gherkin pattern and actively tested

Feature: SpecCheck Login
  As a SpecCheck user
  I want to sign in and out of the application
  So that I can access the Document Dashboard and secure my session

  Background:
    Given the login page is open

  Scenario: Missing password shows login error
    When the user enters username "admin"
    And the user clicks Sign In
    Then the login error reads "Password is required."

  Scenario: Missing username shows login error
    When the user enters password "pass"
    And the user clicks Sign In
    Then the login error reads "Username is required."

  Scenario: Successful login and logout
    When the user enters username "admin" and password "pass"
    And the user clicks Sign In
    Then the Document Dashboard is visible
    And the logout button is visible
    When the user clicks Logout
    Then the login page is visible
    And the login title reads "SpecCheck Login"
