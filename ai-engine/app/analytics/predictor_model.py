import logging
import numpy as np
from typing import Optional
from pathlib import Path

from app.config import settings

logger = logging.getLogger("ai_engine.predictor_model")


class RiskPredictorModel:
    def __init__(self):
        self._model = None
        self._feature_names = [
            "gpa",
            "gpa_trend",
            "attendance_rate",
            "academic_warnings",
            "failed_credits",
            "course_load",
            "completed_credits_ratio",
            "current_semester",
            "avg_grade_recent",
            "course_drop_rate",
        ]
        self._is_trained = False

    def _build_model(self):
        try:
            from sklearn.ensemble import GradientBoostingClassifier
            self._model = GradientBoostingClassifier(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
            )
            logger.info("GradientBoosting model initialized")
        except Exception as e:
            logger.error(f"Failed to build model: {e}")
            raise

    def train(self, X: np.ndarray, y: np.ndarray):
        if self._model is None:
            self._build_model()
        self._model.fit(X, y)
        self._is_trained = True
        logger.info(f"Model trained on {len(X)} samples")

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self._is_trained or self._model is None:
            return self._rule_based_predict(X)
        try:
            return self._model.predict_proba(X)[:, 1]
        except Exception as e:
            logger.warning(f"Model prediction failed: {e}, using rule-based")
            return self._rule_based_predict(X)

    def predict_risk_score(self, features: dict) -> float:
        X = self._features_to_array(features)
        proba = self.predict(X.reshape(1, -1))
        return float(proba[0] * 100)

    def predict_batch(self, features_list: list[dict]) -> list[float]:
        X = np.array([self._features_to_array(f) for f in features_list])
        probas = self.predict(X)
        return [float(p * 100) for p in probas]

    def _rule_based_predict(self, X: np.ndarray) -> np.ndarray:
        scores = np.zeros(X.shape[0])

        for i in range(X.shape[0]):
            score = 0.0
            gpa = X[i, 0]
            gpa_trend = X[i, 1]
            attendance = X[i, 2]
            warnings = X[i, 3]
            failed = X[i, 4]

            if gpa < 1.5:
                score += 0.35
            elif gpa < 2.0:
                score += 0.20
            elif gpa < 2.5:
                score += 0.10

            if gpa_trend < 0:
                score += 0.15 * abs(gpa_trend)

            if attendance < 0.5:
                score += 0.30
            elif attendance < 0.7:
                score += 0.15
            elif attendance < 0.85:
                score += 0.05

            score += min(warnings * 0.15, 0.45)
            score += min(failed * 0.10, 0.40)

            scores[i] = min(score, 1.0)

        return scores

    def _features_to_array(self, features: dict) -> np.ndarray:
        return np.array([
            features.get("gpa", 2.0),
            features.get("gpa_trend", 0.0),
            features.get("attendance_rate", 1.0),
            features.get("academic_warnings", 0),
            features.get("failed_credits", 0),
            features.get("course_load", 15),
            features.get("completed_credits_ratio", 0.5),
            features.get("current_semester", 1),
            features.get("avg_grade_recent", 2.0),
            features.get("course_drop_rate", 0.0),
        ], dtype=np.float32)

    def get_feature_importance(self) -> dict:
        if self._model and hasattr(self._model, "feature_importances_"):
            importances = self._model.feature_importances_
            return dict(zip(self._feature_names, [round(float(i), 4) for i in importances]))
        return {name: 0.0 for name in self._feature_names}

    def save_model(self, path: Optional[str] = None):
        save_path = path or str(Path(settings.MODEL_CACHE_DIR) / "risk_model.joblib")
        try:
            import joblib
            joblib.dump({
                "model": self._model,
                "feature_names": self._feature_names,
                "is_trained": self._is_trained,
            }, save_path)
            logger.info(f"Model saved to {save_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")

    def load_model(self, path: Optional[str] = None):
        load_path = path or str(Path(settings.MODEL_CACHE_DIR) / "risk_model.joblib")
        try:
            import joblib
            data = joblib.load(load_path)
            self._model = data["model"]
            self._feature_names = data["feature_names"]
            self._is_trained = data["is_trained"]
            logger.info(f"Model loaded from {load_path}")
        except Exception as e:
            logger.warning(f"Failed to load model: {e}")


predictor_model = RiskPredictorModel()
