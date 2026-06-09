# AI-USAGE SUMMARY
# Tools: GitHub Copilot + Claude Code
# Overall AI Contribution: ~50%
# Modifications:
#   - Removed HTML5-validation scenarios (Login.jsx uses 'required' attr so browser
#     prevents submission before React can show a custom error — untestable via Playwright)
#   - Added 'Login with invalid credentials' scenario testing the API-level error path
#   - 'the Document Dashboard is visible' replaced by 'the app is accessible'
#     (post-login view is Projects, not a Document Dashboard)
#   - 'the login title reads "SpecCheck Login"' corrected to "Login" (actual h1 text)
#   - Uses 'the user logs in with valid credentials' step to read from .env / CI secrets

Feature: SpecCheck Login
  As a SpecCheck user
  I want to sign in and out of the application
  So that I can access the app and secure my session

  Background:
    Given the login page is open

  @smoke
  Scenario: Login with invalid credentials shows an error
    When the user enters username "wrong_user_xyz" and password "wrong_pass_xyz"
    And the user clicks Sign In
    Then the login error reads "Incorrect username or password"

  @smoke
  Scenario: Successful login and logout
    When the user logs in with valid credentials
    And the user clicks Sign In
    Then the app is accessible
    And the logout button is visible
    When the user clicks Logout
    Then the login page is visible
    And the login title reads "Login"
