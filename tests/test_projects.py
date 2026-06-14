from pathlib import Path
from pytest_bdd import scenarios

scenarios(str(Path(__file__).parent / "features" / "projects.feature"))