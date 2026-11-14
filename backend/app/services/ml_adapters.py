"""Model adapters bridging Crestix Probe FastAPI to real XGBoost and PINO submodules.

IMPORTANT INTEGRATION RULE:
These adapters NEVER fabricate random predictions, hardcoded heatmaps, or synthetic values.
If a submodule repository has not been initialized or its trained checkpoint weights have
not been downloaded, the adapter raises `ModelNotInstalledError` (HTTP 503).
"""

from __future__ import annotations

import hashlib
import importlib
import importlib.util
import json
import subprocess
import sys
import threading
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from app.core.errors import ModelInferenceError, ModelNotInstalledError
from app.schemas.ml import (
    ModelProvenance,
    PINOFrameOutput,
    PINOPredictRequest,
    PredictionUnits,
    XGBoostForecastPoint,
    XGBoostPredictRequest,
)


def _compute_file_sha256(path: Path) -> Optional[str]:
    if not path.is_file():
        return None
    hasher = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _resolve_git_head(submodule_dir: Path) -> Optional[str]:
    if not submodule_dir.exists():
        return None
    try:
        proc = subprocess.run(
            ["git", "-C", str(submodule_dir), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=2,
            check=False,
        )
        if proc.returncode == 0:
            sha = proc.stdout.strip()
            return sha or None
    except Exception:
        return None
    return None


def _has_python_files(directory: Path) -> bool:
    if not directory.is_dir():
        return False
    return any(directory.rglob("*.py"))


@dataclass
class AdapterInspection:
    installed: bool
    submodule_present: bool
    weights_present: bool
    missing_components: list[str]
    pinned_commit: Optional[str]
    weights_sha256: Optional[str]


class BaseMLAdapter(ABC):
    """Base contract for cached real-model inference adapters."""

    model_id: str
    model_name: str
    architecture: str
    repository_url: str
    default_dataset: str

    def __init__(
        self,
        submodule_dir: Path,
        weights_path: Path,
        version: str,
        device: str = "cpu",
    ) -> None:
        self.submodule_dir = submodule_dir
        self.weights_path = weights_path
        self.version = version
        self.device = device
        self._lock = threading.Lock()
        self._cached_model: Any = None
        self._cached_module: Any = None
        self._load_count: int = 0
        self._training_metrics_cache: Optional[dict[str, Any]] = None

    @property
    def is_loaded(self) -> bool:
        return self._cached_model is not None

    @property
    def load_count(self) -> int:
        return self._load_count

    def inspect(self) -> AdapterInspection:
        submodule_present = _has_python_files(self.submodule_dir)
        weights_present = self.weights_path.is_file()
        missing: list[str] = []
        if not submodule_present:
            missing.append(f"submodule_code ({self.submodule_dir})")
        if not weights_present:
            missing.append(f"checkpoint_weights ({self.weights_path})")
        return AdapterInspection(
            installed=submodule_present and weights_present,
            submodule_present=submodule_present,
            weights_present=weights_present,
            missing_components=missing,
            pinned_commit=_resolve_git_head(self.submodule_dir),
            weights_sha256=_compute_file_sha256(self.weights_path),
        )

    def build_provenance(self) -> ModelProvenance:
        inspection = self.inspect()
        return ModelProvenance(
            repository_url=self.repository_url,
            submodule_path=str(self.submodule_dir),
            pinned_commit=inspection.pinned_commit,
            dataset=self.default_dataset,
            checkpoint_path=str(self.weights_path),
            weights_sha256=inspection.weights_sha256,
        )

    def get_training_metrics(self) -> Optional[dict[str, Any]]:
        if self._training_metrics_cache is not None:
            return self._training_metrics_cache
        metrics_candidates = [
            self.weights_path.parent / "metrics.json",
            self.submodule_dir / "metrics.json",
            self.submodule_dir / "artifacts" / "metrics.json",
        ]
        for candidate in metrics_candidates:
            if candidate.is_file():
                try:
                    data = json.loads(candidate.read_text(encoding="utf-8"))
                    if isinstance(data, dict):
                        self._training_metrics_cache = data
                        return data
                except Exception:
                    continue
        return None

    def ensure_loaded(self) -> tuple[Any, bool]:
        """Load and cache the model weights once. Returns `(model_handle, was_cached)`."""
        if self._cached_model is not None:
            return self._cached_model, True

        with self._lock:
            if self._cached_model is not None:
                return self._cached_model, True

            inspection = self.inspect()
            if not inspection.installed:
                raise ModelNotInstalledError(
                    model_id=self.model_id,
                    message=(
                        f"{self.model_name} is not installed on this server. "
                        f"Missing: {', '.join(inspection.missing_components)}. "
                        "Initialize the git submodule and download the trained checkpoint weights "
                        "(see docs/ml_integration.md)."
                    ),
                    details={
                        "repository_url": self.repository_url,
                        "submodule_path": str(self.submodule_dir),
                        "expected_weights_path": str(self.weights_path),
                        "missing_components": inspection.missing_components,
                        "install_instructions": (
                            f"git submodule update --init --recursive && "
                            f"place trained checkpoint at {self.weights_path}"
                        ),
                    },
                )

            self._cached_model = self._load_model_artifact()
            self._load_count += 1
            return self._cached_model, False

    def clear_cache(self) -> None:
        with self._lock:
            self._cached_model = None
            self._cached_module = None

    def _import_submodule_entrypoint(self, candidate_modules: tuple[str, ...]) -> Optional[Any]:
        resolved_dir = self.submodule_dir.resolve()
        sub_str = str(resolved_dir)
        if sub_str not in sys.path:
            sys.path.insert(0, sub_str)

        for mod_name in candidate_modules:
            rel_path = Path(*mod_name.split(".")).with_suffix(".py")
            file_path = resolved_dir / rel_path
            if not file_path.is_file():
                continue

            unique_name = f"crestix_ml_{self.model_id}_{mod_name.replace('.', '_')}"
            spec = importlib.util.spec_from_file_location(unique_name, file_path)
            if spec is not None and spec.loader is not None:
                module = importlib.util.module_from_spec(spec)
                sys.modules[unique_name] = module
                spec.loader.exec_module(module)
                return module
        return None

    @abstractmethod
    def units(self) -> PredictionUnits:
        """Return explicit physical units for this model's outputs."""

    @abstractmethod
    def _load_model_artifact(self) -> Any:
        """Load the model weights/module from disk into memory."""


class XGBoostModelAdapter(BaseMLAdapter):
    """Adapter for `skandakn/XGBoost-Crestix-Probe` tabular/point-station flood forecasting."""

    model_id = "xgboost"
    model_name = "Crestix XGBoost Flood Forecaster"
    architecture = "Gradient Boosted Decision Trees (XGBoost)"
    repository_url = "https://github.com/skandakn/XGBoost-Crestix-Probe.git"
    default_dataset = "Crestix Physical Flood Prototype + Hydrograph Tabular Dataset"

    def units(self) -> PredictionUnits:
        return PredictionUnits(
            depth="cm",
            rainfall_intensity="mm/hr",
            velocity=None,
            time_step="minutes",
        )

    def _load_model_artifact(self) -> Any:
        # 1. Prefer the submodule's own loader/inference module if provided
        module = self._import_submodule_entrypoint(
            ("inference", "src.inference", "predict", "src.predict", "model", "src.model")
        )
        if module is not None:
            self._cached_module = module
            if hasattr(module, "load_model"):
                return module.load_model(str(self.weights_path))
            if hasattr(module, "XGBoostFloodModel"):
                return module.XGBoostFloodModel(str(self.weights_path))

        # 2. Fall back to native xgboost library loading the checkpoint directly
        try:
            import xgboost as xgb  # type: ignore[import-not-found]
        except ImportError as exc:
            raise ModelNotInstalledError(
                model_id=self.model_id,
                message=(
                    "The 'xgboost' Python package is not installed in the backend environment."
                ),
                details={"missing_components": ["python_package (xgboost)"]},
            ) from exc

        booster = xgb.Booster()
        booster.load_model(str(self.weights_path))
        return booster

    def predict(
        self, request: XGBoostPredictRequest
    ) -> tuple[list[XGBoostForecastPoint], Optional[dict[str, float]], bool]:
        model_handle, was_cached = self.ensure_loaded()

        try:
            # If the submodule exports a high-level predict function, invoke it directly
            if self._cached_module is not None and hasattr(self._cached_module, "predict"):
                raw_result = self._cached_module.predict(model_handle, request.model_dump(mode="json"))
                return self._normalize_module_output(raw_result, request), None, was_cached

            # Otherwise execute native XGBoost DMatrix prediction per position & horizon step
            import numpy as np  # type: ignore[import-not-found]
            import xgboost as xgb  # type: ignore[import-not-found]

            total_minutes = int(round(request.forecast_horizon_hours * 60))
            steps = max(1, total_minutes // request.step_minutes)
            points: list[XGBoostForecastPoint] = []

            latest_by_pos = {
                obs.position: obs.water_depth_cm for obs in request.recent_observations
            }

            feature_rows: list[list[float]] = []
            row_keys: list[tuple[str, int]] = []
            for step in range(1, steps + 1):
                lead_min = step * request.step_minutes
                for pos_idx, pos in enumerate(request.positions):
                    anchor = latest_by_pos.get(pos, request.initial_water_depth_cm)
                    feature_rows.append(
                        [
                            float(lead_min),
                            float(request.rainfall_intensity_mm_hr),
                            float(request.soil_moisture_pct),
                            float(anchor),
                            float(request.terrain_slope_deg),
                            float(request.inflow_rate_l_min),
                            float(pos_idx),
                        ]
                    )
                    row_keys.append((pos, lead_min))

            dmatrix = xgb.DMatrix(np.asarray(feature_rows, dtype=np.float32))
            preds = model_handle.predict(dmatrix)

            for (pos, lead_min), pred_val in zip(row_keys, preds):
                points.append(
                    XGBoostForecastPoint(
                        position=pos,
                        lead_time_minutes=lead_min,
                        predicted_water_depth_cm=round(max(0.0, float(pred_val)), 4),
                    )
                )

            importance = None
            if hasattr(model_handle, "get_score"):
                raw_imp = model_handle.get_score(importance_type="gain")
                if raw_imp:
                    importance = {str(k): round(float(v), 4) for k, v in raw_imp.items()}

            return points, importance, was_cached
        except ModelNotInstalledError:
            raise
        except Exception as exc:
            raise ModelInferenceError(
                model_id=self.model_id,
                message=f"XGBoost inference failed: {exc}",
            ) from exc

    @staticmethod
    def _normalize_module_output(
        raw_result: Any, request: XGBoostPredictRequest
    ) -> list[XGBoostForecastPoint]:
        if isinstance(raw_result, dict) and "predictions" in raw_result:
            items = raw_result["predictions"]
        elif isinstance(raw_result, list):
            items = raw_result
        else:
            raise ValueError("XGBoost submodule predict() returned an unexpected output format.")

        normalized: list[XGBoostForecastPoint] = []
        for idx, item in enumerate(items):
            if isinstance(item, XGBoostForecastPoint):
                normalized.append(item)
            elif isinstance(item, dict):
                normalized.append(XGBoostForecastPoint(**item))
            else:
                pos = request.positions[idx % len(request.positions)]
                lead = ((idx // len(request.positions)) + 1) * request.step_minutes
                normalized.append(
                    XGBoostForecastPoint(
                        position=pos,
                        lead_time_minutes=lead,
                        predicted_water_depth_cm=round(max(0.0, float(item)), 4),
                    )
                )
        return normalized


class PINOModelAdapter(BaseMLAdapter):
    """Adapter for `skandakn/PINO-Crestix-Probe` Physics-Informed Neural Operator forecasting."""

    model_id = "pino"
    model_name = "Crestix PINO-SWE Spatial Forecaster"
    architecture = "Physics-Informed Neural Operator (2D Shallow-Water Equations)"
    repository_url = "https://github.com/skandakn/PINO-Crestix-Probe.git"
    default_dataset = "2D Shallow-Water Hydrodynamic Terrain Simulation + Crestix Probe Dataset"

    def units(self) -> PredictionUnits:
        return PredictionUnits(
            depth="cm",
            rainfall_intensity="mm/hr",
            velocity="m/s",
            time_step="minutes",
        )

    def _load_model_artifact(self) -> Any:
        module = self._import_submodule_entrypoint(
            ("inference", "src.inference", "predict", "src.predict", "model", "src.model")
        )
        if module is None:
            raise ModelNotInstalledError(
                model_id=self.model_id,
                message=(
                    "PINO submodule does not expose a recognized Python inference entrypoint "
                    "(expected inference.py, predict.py, or model.py)."
                ),
                details={"submodule_path": str(self.submodule_dir)},
            )
        self._cached_module = module

        if hasattr(module, "load_model"):
            return module.load_model(str(self.weights_path), device=self.device)

        try:
            import torch  # type: ignore[import-not-found]
        except ImportError as exc:
            raise ModelNotInstalledError(
                model_id=self.model_id,
                message="PyTorch ('torch') is not installed in the backend environment for PINO.",
                details={"missing_components": ["python_package (torch)"]},
            ) from exc

        checkpoint = torch.load(str(self.weights_path), map_location=self.device)
        if hasattr(module, "build_model"):
            model = module.build_model(checkpoint)
            if hasattr(model, "eval"):
                model.eval()
            return model
        return checkpoint

    def predict(self, request: PINOPredictRequest) -> tuple[list[PINOFrameOutput], bool]:
        model_handle, was_cached = self.ensure_loaded()

        try:
            if self._cached_module is not None and hasattr(self._cached_module, "predict"):
                raw_output = self._cached_module.predict(
                    model_handle,
                    request.model_dump(mode="json"),
                    device=self.device,
                )
                return self._normalize_frames(raw_output, request), was_cached

            if callable(model_handle):
                import torch  # type: ignore[import-not-found]

                dem_tensor = torch.tensor(request.dem_grid, dtype=torch.float32, device=self.device)
                init_grid = (
                    request.initial_depth_grid
                    if request.initial_depth_grid is not None
                    else [[0.0] * request.spatial_dimensions.cols for _ in range(request.spatial_dimensions.rows)]
                )
                depth_tensor = torch.tensor(init_grid, dtype=torch.float32, device=self.device)
                stacked = torch.stack([dem_tensor, depth_tensor], dim=0).unsqueeze(0)

                with torch.no_grad():
                    out_tensor = model_handle(stacked)

                return self._tensor_to_frames(out_tensor, request), was_cached

            raise ModelInferenceError(
                model_id=self.model_id,
                message="Loaded PINO artifact is neither callable nor provides predict().",
            )
        except (ModelNotInstalledError, ModelInferenceError):
            raise
        except Exception as exc:
            raise ModelInferenceError(
                model_id=self.model_id,
                message=f"PINO inference failed: {exc}",
            ) from exc

    @staticmethod
    def _normalize_frames(raw_output: Any, request: PINOPredictRequest) -> list[PINOFrameOutput]:
        items = raw_output["frames"] if isinstance(raw_output, dict) and "frames" in raw_output else raw_output
        if not isinstance(items, list):
            raise ValueError("PINO submodule predict() must return a list of frames or {'frames': [...]}.")
        frames: list[PINOFrameOutput] = []
        for idx, item in enumerate(items):
            if isinstance(item, PINOFrameOutput):
                frames.append(item)
            elif isinstance(item, dict):
                frames.append(PINOFrameOutput(**item))
            else:
                raise ValueError(f"Unsupported PINO frame type at index {idx}.")
        return frames

    @staticmethod
    def _tensor_to_frames(out_tensor: Any, request: PINOPredictRequest) -> list[PINOFrameOutput]:
        arr = out_tensor.detach().cpu().tolist()
        # Handle [batch, steps, rows, cols] or [batch, rows, cols]
        if isinstance(arr, list) and arr and isinstance(arr[0], list):
            if arr[0] and isinstance(arr[0][0], list) and isinstance(arr[0][0][0], list):
                seq = arr[0]
            else:
                seq = [arr[0]]
        else:
            raise ValueError("Unexpected tensor output shape from PINO model.")

        frames: list[PINOFrameOutput] = []
        for idx, grid in enumerate(seq):
            clamped_grid = [[round(max(0.0, float(v)), 4) for v in row] for row in grid]
            max_d = max((max(row) for row in clamped_grid if row), default=0.0)
            frames.append(
                PINOFrameOutput(
                    step_index=idx,
                    lead_time_minutes=(idx + 1) * request.step_minutes,
                    depth_grid_cm=clamped_grid,
                    max_depth_cm=max_d,
                )
            )
        return frames
