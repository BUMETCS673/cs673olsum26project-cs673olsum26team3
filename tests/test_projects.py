# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements

from pathlib import Path
from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "projects.feature"))