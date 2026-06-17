# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements

"""Test entry point for the login feature.

Links the Gherkin login.feature file to the pytest-bdd test runner.
All step definitions live in step_definitions/login_steps.py,
registered via conftest.py.

# AI-USAGE SUMMARY
# Tools: GitHub Copilot
# Overall AI Contribution: ~100%
# AI-Assisted Areas: Test runner scaffolding and pytest-bdd integration setup
# Human Contributions: Feature file location configuration
# Notes: AI generated the minimal pytest-bdd runner pattern. No modifications needed.
# Verification: Manual integration test - confirmed feature file loads and scenarios execute
"""
from pathlib import Path

from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "login.feature"))
