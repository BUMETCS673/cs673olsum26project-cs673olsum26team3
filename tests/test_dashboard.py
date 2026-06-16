# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements

"""Test entry point for the Document Dashboard feature.

Links the Gherkin feature file to the pytest-bdd test runner.
All step definitions live in step_definitions/dashboard_steps.py,
registered via conftest.py pytest_plugins.
"""
from pathlib import Path

from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "dashboard.feature"))
