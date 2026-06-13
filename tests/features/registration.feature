"""Feature: SpecCheck Registration

# AI-USAGE SUMMARY
# Tools: GitHub Copilot + Claude Code
# Overall AI Contribution: ~60%
# Human Contributions: authored Gherkin scenarios REG-001..REG-010 and applied tags (@smoke, @validation, @registration)
# Modifications:
#   - Background: opens login page
#   - Scenarios: empty fields, mismatch, length/complexity, duplicate username, success cases, edge cases
# Verification: Scenarios executed via pytest-bdd + Playwright using in-browser API mocks
"""

Feature: SpecCheck Registration
  As a SpecCheck user
  I want to create an account
  So that I can access SpecCheck with my own login

  Background:
    Given the login page is open

  @smoke @validation
  Scenario: REG-001 - Empty form shows required field errors
    When the user switches to Create Account
    And the user leaves username empty
    And the user leaves password empty
    And the user leaves confirm password empty
    And the user clicks Register
    Then the browser shows required field validation errors

  @smoke
  Scenario: REG-002 - Mismatched passwords shows error
    When the user switches to Create Account
    And the user enters username "new_user_xyz"
    And the user enters password "Password123!"
    And the user enters confirm password "Password123"
    And the user clicks Register
    Then the login error reads "Passwords do not match. Please re-type them."

  @validation
  Scenario: REG-003 - Password too short shows error
    When the user switches to Create Account
    And the user enters username "valid_user_123"
    And the user enters password "Pass1!"
    And the user enters confirm password "Pass1!"
    And the user clicks Register
    Then the login error contains "password"

  @validation
  Scenario: REG-004 - Duplicate username shows already exists error
    When the user switches to Create Account
    And the user enters username "admin"
    And the user enters password "NewPassword123!"
    And the user enters confirm password "NewPassword123!"
    And the user clicks Register
    Then the login error reads "This username is already taken"

  @smoke
  Scenario: REG-005 - Successful registration shows confirmation message
    When the user switches to Create Account
    And the user enters username "brand_new_user_001"
    And the user enters password "SecurePass123!"
    And the user enters confirm password "SecurePass123!"
    And the user clicks Register
    Then the registration success message reads "Account created successfully!"
    And the login title reads "Login"

  @validation
  Scenario: REG-006 - Empty username field shows error on submit
    When the user switches to Create Account
    And the user leaves username empty
    And the user enters password "Password123!"
    And the user enters confirm password "Password123!"
    And the user clicks Register
    Then the browser shows required field validation errors

  @validation
  Scenario: REG-007 - Empty password field shows error on submit
    When the user switches to Create Account
    And the user enters username "new_valid_user"
    And the user leaves password empty
    And the user enters confirm password "Password123!"
    And the user clicks Register
    Then the browser shows required field validation errors

  @validation
  Scenario: REG-008 - Empty confirm password field shows error on submit
    When the user switches to Create Account
    And the user enters username "another_new_user"
    And the user enters password "Password123!"
    And the user leaves confirm password empty
    And the user clicks Register
    Then the browser shows required field validation errors

  @registration
  Scenario: REG-009 - Username with spaces is accepted
    When the user switches to Create Account
    And the user enters username "user with spaces"
    And the user enters password "StrongPass123!"
    And the user enters confirm password "StrongPass123!"
    And the user clicks Register
    Then the registration success message reads "Account created successfully!"

  @registration
  Scenario: REG-010 - Special characters in password are accepted
    When the user switches to Create Account
    And the user enters username "special_char_user"
    And the user enters password "P@ssw0rd!#$%"
    And the user enters confirm password "P@ssw0rd!#$%"
    And the user clicks Register
    Then the registration success message reads "Account created successfully!"
