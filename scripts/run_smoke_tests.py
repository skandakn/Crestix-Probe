#!/usr/bin/env python3
"""Run repository checks and report absent external ML integrations honestly."""
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
result = subprocess.run(
    [sys.executable, "-m", "pytest", "-q", "backend/tests", "tests"],
    cwd=root,
    check=False,
)
print("XGBoost repository:", os.environ.get("XGBOOST_REPO_PATH", "NOT CONFIGURED"))
print("PINO repository:", os.environ.get("PINO_REPO_PATH", "NOT CONFIGURED"))
print("Model training/checkpoint/inference smoke checks: SKIPPED (repos, data, checkpoints absent)")
sys.exit(result.returncode)
