"""Test entry point for the TestCase Dashboard feature.

Links the Gherkin feature file to the pytest-bdd test runner.
All step definitions live in step_definitions/testCaseDashboard_steps.py,
registered via conftest.py pytest_plugins.
"""
from pathlib import Path

from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "testCaseDashboard.feature"))
