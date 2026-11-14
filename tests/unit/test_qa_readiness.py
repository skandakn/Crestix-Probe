from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))


def test_backend_declares_forecast_and_solver_stubs():
    source = (ROOT / "backend/app/services/adapters.py").read_text(encoding="utf-8")
    assert '"is_operational_model": False' in source
    assert '"is_operational_solver": False' in source


def test_ml_repositories_are_not_declared_as_submodules():
    modules = ROOT / ".gitmodules"
    text = modules.read_text(encoding="utf-8") if modules.exists() else ""
    assert "xgboost" not in text.lower()
    assert "pino" not in text.lower()


def test_no_model_checkpoints_are_present():
    suffixes = {".pt", ".pth", ".onnx", ".pkl", ".joblib", ".ckpt"}
    artifacts = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in suffixes and "node_modules" not in p.parts]
    assert artifacts == []
