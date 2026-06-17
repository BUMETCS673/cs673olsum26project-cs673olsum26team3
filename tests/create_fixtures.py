# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements

"""Ensure the fixtures directory exists for manually added test files.

Place your test files in tests/fixtures/ before running the test suite:
  sample_valid.pdf      - a valid PDF (parseable by pdf-parse-fork)
  sample_valid.png      - a valid PNG (processable by Tesseract)
  sample_valid.jpg      - a valid JPEG (processable by Tesseract)
  sample_oversized.pdf  - a file > 20 MB for size-limit rejection tests
  sample_invalid.exe    - a file with an unsupported extension
  sample_invalid.mp3    - a file with an unsupported extension
"""
from pathlib import Path

FIXTURES = Path(__file__).parent / "fixtures"


def main() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    print(f"Fixtures directory ready: {FIXTURES}")
    print("Please add your test files manually before running the test suite.")


if __name__ == "__main__":
    main()
