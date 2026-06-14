Feature: Project Dashboard Search
  As a user of SpecCheck
  I want to filter projects by their name field
  So that I can quickly interact with my automated testing assets

  Background:
    Given the user is authenticated and viewing the Projects dashboard

  @search @smoke
  Scenario: Search input box is visible on dashboard load
    Then the project search box is visible
    And its placeholder reads "Search projects by name..."

  @search @smoke
  Scenario: Typing a keyword filters projects by name matching
    When the user types "Project" into the project search box
    Then only projects containing "Project" are visible in the grid

  @search
  Scenario: Search query filtering operates case-insensitively
    When the user types "project" into the project search box
    Then only projects containing "Project" are visible in the grid

  @search
  Scenario: Invalid query text displays an empty results message
    When the user types "xyz999" into the project search box
    Then the grid is replaced by a message saying "No projects found matching"
    And a "Clear search query" button link is visible