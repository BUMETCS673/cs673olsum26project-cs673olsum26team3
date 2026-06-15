"""Test entry point for the registration feature.

Links the Gherkin registration.feature file to the pytest-bdd test runner.
"""
from pathlib import Path

from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "registration.feature"))
