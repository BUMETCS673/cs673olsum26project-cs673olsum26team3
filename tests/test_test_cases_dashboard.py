"""Test entry point for the Test Case Dashboard feature.

Links the Gherkin feature file to the pytest-bdd test runner.
All step definitions live in step_definitions/test_cases_steps.py,
registered via conftest.py pytest_plugins.
"""
from pathlib import Path

from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "test_cases_dashboard.feature"))
