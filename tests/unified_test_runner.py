# AI-USAGE SUMMARY 
# Tools: ChatGPT, Gemini
# Overall AI Contribution: ~35% 
# AI-Assisted Areas: Test scaffolding, BDD steps
# Human Contributions: Test logic, assertions, custom fixtures
# Notes: AI-generated code was reviewed and validated against requirements
import subprocess
import sys
import os
import json
from pathlib import Path

def run_command(command, cwd=None, description=""):
    print(f"\n[INFO] {description}...")
    print(f"Executing: {' '.join(command)}")
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
        shell=True if os.name == 'nt' else False,
        encoding='utf-8'
    )
    
    output = []
    for line in process.stdout:
        print(f"  {line}", end="")
        output.append(line)
    
    process.wait()
    return process.returncode, "".join(output)

def main():
    root_dir = Path(__file__).parent.parent
    backend_dir = root_dir / "test-case-generator" / "backend"
    frontend_dir = root_dir / "test-case-generator" / "frontend"
    tests_dir = root_dir / "tests"

    print("="*60)
    print("      SpecCheck Unified Test Suite Runner")
    print("="*60)

    # 1. Run Backend Unit Tests
    backend_code, backend_out = run_command(
        ["npm", "test", "--", "--json", "--outputFile=jest-results.json"],
        cwd=backend_dir,
        description="Running Backend Unit Tests (Jest)"
    )

    # 2. Run Frontend Unit Tests
    frontend_code, frontend_out = run_command(
        ["npm", "run", "test:run", "--", "--reporter=json", "--outputFile=vitest-results.json"],
        cwd=frontend_dir,
        description="Running Frontend Unit Tests (Vitest)"
    )

    # 3. Run E2E Tests
    print("\n[INFO] Running E2E Tests (Pytest-BDD)...")
    pytest_command = [
        "pytest",
        "--tb=short",
        "-v",
        "--html=reports/report.html",
        "--self-contained-html",
        f"--metadata", "Suite", "Unified Test Suite",
        f"--metadata", "Backend Tests", "Passed" if backend_code == 0 else "Failed",
        f"--metadata", "Frontend Tests", "Passed" if frontend_code == 0 else "Failed"
    ]
    
    pytest_code, pytest_out = run_command(
        pytest_command,
        cwd=tests_dir,
        description="Running E2E BDD Tests"
    )

    print("\n" + "="*60)
    print("      Unified Test Summary")
    print("="*60)
    print(f"Backend Unit Tests:  {'[PASS]' if backend_code == 0 else '[FAIL]'}")
    print(f"Frontend Unit Tests: {'[PASS]' if frontend_code == 0 else '[FAIL]'}")
    print(f"E2E BDD Tests:       {'[PASS]' if pytest_code == 0 else '[FAIL]'}")
    print("="*60)
    print(f"Final Report: {tests_dir}/reports/report.html")
    
    if backend_code != 0 or frontend_code != 0 or pytest_code != 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
