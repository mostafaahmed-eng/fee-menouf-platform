import logging
import numpy as np
from typing import Optional

from app.analytics.predictor_model import predictor_model

logger = logging.getLogger("ai_engine.risk_predictor")


class RiskPredictor:
    def __init__(self):
        self._model = predictor_model

    def predict_student_risk(self, student_data: dict) -> dict:
        features = self._extract_features(student_data)
        risk_score = self._model.predict_risk_score(features)

        risk_level = self._categorize_risk(risk_score)
        factors = self._identify_risk_factors(features)
        recommendations = self._generate_recommendations(risk_score, factors, features)

        try:
            shap_values = self._compute_shap(features)
        except Exception:
            shap_values = None

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "risk_factors": factors,
            "recommendations": recommendations,
            "feature_importance": self._model.get_feature_importance(),
            "shap_values": shap_values,
            "features_used": features,
        }

    def predict_batch(self, students_data: list[dict]) -> list[dict]:
        results = []
        for student in students_data:
            try:
                result = self.predict_student_risk(student)
                result["student_id"] = student.get("student_id", "unknown")
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to predict for student {student.get('student_id')}: {e}")
                results.append({
                    "student_id": student.get("student_id", "unknown"),
                    "risk_score": -1,
                    "risk_level": "error",
                    "error": str(e),
                })
        return results

    def _extract_features(self, student: dict) -> dict:
        gpa = float(student.get("gpa", 2.0))
        recent_grades = student.get("recent_grades", [])

        gpa_trend = 0.0
        if isinstance(recent_grades, list) and len(recent_grades) >= 2:
            gpa_trend = recent_grades[-1] - recent_grades[0]

        if isinstance(recent_grades, (int, float)):
            gpa_trend = 0.0

        attendance = float(student.get("attendance_rate", 100)) / 100.0
        warnings = int(student.get("academic_warnings", 0))
        failed = int(student.get("failed_credits", 0))
        course_load = int(student.get("current_course_load", student.get("enrolled_courses_count", 15)))
        completed = int(student.get("completed_credits", 0))
        total_required = int(student.get("total_required_credits", 160))
        semester = int(student.get("current_semester", 1))

        avg_grade = float(np.mean(recent_grades)) if isinstance(recent_grades, list) and recent_grades else gpa
        drop_rate = float(student.get("course_drop_rate", 0.0))

        return {
            "gpa": gpa,
            "gpa_trend": gpa_trend,
            "attendance_rate": attendance,
            "academic_warnings": warnings,
            "failed_credits": failed,
            "course_load": course_load,
            "completed_credits_ratio": min(completed / max(total_required, 1), 1.0),
            "current_semester": semester,
            "avg_grade_recent": avg_grade,
            "course_drop_rate": drop_rate,
        }

    def _categorize_risk(self, score: float) -> str:
        if score < 20:
            return "low"
        elif score < 40:
            return "low-moderate"
        elif score < 60:
            return "moderate"
        elif score < 80:
            return "high"
        else:
            return "critical"

    def _identify_risk_factors(self, features: dict) -> list[dict]:
        factors = []

        if features["gpa"] < 2.0:
            factors.append({
                "factor": "low_gpa",
                "severity": "high" if features["gpa"] < 1.5 else "medium",
                "description": f"GPA is {features['gpa']:.2f}, below the minimum 2.0 threshold",
                "value": features["gpa"],
            })

        if features["gpa_trend"] < -0.3:
            factors.append({
                "factor": "declining_gpa_trend",
                "severity": "high",
                "description": f"GPA has declined by {abs(features['gpa_trend']):.2f} over recent semesters",
                "value": features["gpa_trend"],
            })

        if features["attendance_rate"] < 0.7:
            factors.append({
                "factor": "low_attendance",
                "severity": "high" if features["attendance_rate"] < 0.5 else "medium",
                "description": f"Attendance rate is {features['attendance_rate']*100:.0f}%",
                "value": features["attendance_rate"],
            })

        if features["academic_warnings"] > 0:
            factors.append({
                "factor": "academic_warnings",
                "severity": "high" if features["academic_warnings"] >= 2 else "medium",
                "description": f"Has {features['academic_warnings']} academic warning(s)",
                "value": features["academic_warnings"],
            })

        if features["failed_credits"] > 0:
            factors.append({
                "factor": "failed_courses",
                "severity": "high" if features["failed_credits"] >= 10 else "medium",
                "description": f"Failed {features['failed_credits']} credit hours",
                "value": features["failed_credits"],
            })

        if features["course_drop_rate"] > 0.3:
            factors.append({
                "factor": "high_drop_rate",
                "severity": "medium",
                "description": f"Dropped {features['course_drop_rate']*100:.0f}% of enrolled courses",
                "value": features["course_drop_rate"],
            })

        return factors

    def _generate_recommendations(self, score: float, factors: list[dict], features: dict) -> list[str]:
        recommendations = []

        if score >= 60:
            recommendations.append("Schedule an immediate meeting with academic advisor")
            recommendations.append("Consider reducing course load to improve focus")

        if score >= 40:
            recommendations.append("Enroll in academic support and tutoring programs")
            recommendations.append("Develop a structured study schedule")

        if features["attendance_rate"] < 0.7:
            recommendations.append("Improve class attendance - aim for at least 85% attendance rate")

        if features["gpa"] < 2.0:
            recommendations.append("Consider repeating failed courses to improve GPA")
            recommendations.append("Explore course withdrawal options for currently enrolled courses at risk")

        if features["gpa_trend"] < -0.2:
            recommendations.append("Identify specific courses or areas causing GPA decline")
            recommendations.append("Seek peer tutoring and faculty office hours for challenging subjects")

        recommendations.append("Regularly monitor academic progress through the student portal")

        return recommendations[:5]

    def _compute_shap(self, features: dict) -> Optional[dict]:
        """Compute SHAP values for explainability. Falls back gracefully if shap not installed."""
        try:
            import shap
            feature_array = np.array([list(features.values())])
            explainer = shap.TreeExplainer(self._model._model) if hasattr(self._model, '_model') else None
            if explainer is None:
                return None
            shap_values = explainer.shap_values(feature_array)
            feature_names = list(features.keys())
            if isinstance(shap_values, list):
                vals = np.abs(shap_values[0]).tolist()
            else:
                vals = np.abs(shap_values[0]).tolist() if shap_values.ndim > 1 else np.abs(shap_values).tolist()
            if isinstance(vals, list) and len(vals) == 1:
                vals = vals[0]
            return dict(zip(feature_names, vals if isinstance(vals, list) else [vals]))
        except ImportError:
            logger.warning("shap library not available for model explainability")
            return None
        except Exception as e:
            logger.error(f"SHAP computation failed: {e}")
            return None

    def predict_course_demand(self, historical_data: list[dict]) -> dict:
        if not historical_data:
            return {"error": "No historical data provided"}

        df = None
        try:
            import pandas as pd
            df = pd.DataFrame(historical_data)
        except ImportError:
            logger.warning("pandas not available, using fallback risk prediction")
            df = None

        course_counts = {}
        for record in historical_data:
            course_id = record.get("course_id", record.get("course_code", "unknown"))
            enrolled = int(record.get("enrolled_count", record.get("enrollment", 0)))
            if course_id not in course_counts:
                course_counts[course_id] = {"total_enrollment": 0, "semesters": 0}
            course_counts[course_id]["total_enrollment"] += enrolled
            course_counts[course_id]["semesters"] += 1

        predicted_demand = {}
        for course_id, data in course_counts.items():
            avg_enrollment = data["total_enrollment"] / max(data["semesters"], 1)
            growth_factor = 1.05
            predicted = int(avg_enrollment * growth_factor)
            predicted_demand[course_id] = {
                "current_avg_enrollment": avg_enrollment,
                "predicted_enrollment": predicted,
                "confidence": min(0.5 + data["semesters"] * 0.1, 0.95),
            }

        return {
            "predicted_demand": predicted_demand,
            "total_courses": len(predicted_demand),
            "method": "historical_average_with_trend",
        }

    def analyze_faculty_workload(self, faculty_data: list[dict]) -> dict:
        if not faculty_data:
            return {"error": "No faculty data provided"}

        workload_analysis = []
        total_hours = 0
        overloaded = 0
        underloaded = 0

        for faculty in faculty_data:
            name = faculty.get("name", faculty.get("id", "unknown"))
            current_hours = float(faculty.get("current_hours", faculty.get("hours", 0)))
            max_hours = float(faculty.get("max_hours", 18))
            courses_count = int(faculty.get("courses_count", faculty.get("assigned_courses", 0)))
            department = faculty.get("department", "general")

            utilization = (current_hours / max_hours * 100) if max_hours > 0 else 0
            total_hours += current_hours

            status = "underloaded" if utilization < 50 else "normal" if utilization <= 90 else "overloaded"
            if status == "overloaded":
                overloaded += 1
            elif status == "underloaded":
                underloaded += 1

            workload_analysis.append({
                "name": name,
                "department": department,
                "current_hours": current_hours,
                "max_hours": max_hours,
                "utilization_pct": round(utilization, 1),
                "courses_count": courses_count,
                "status": status,
                "available_hours": max_hours - current_hours,
            })

        return {
            "faculty": workload_analysis,
            "statistics": {
                "total_faculty": len(faculty_data),
                "total_hours": total_hours,
                "avg_utilization": round(total_hours / (len(faculty_data) * 18) * 100, 1) if faculty_data else 0,
                "overloaded_count": overloaded,
                "underloaded_count": underloaded,
                "balanced_count": len(faculty_data) - overloaded - underloaded,
            },
            "recommendations": self._generate_workload_recommendations(workload_analysis),
        }

    def _generate_workload_recommendations(self, analysis: list[dict]) -> list[str]:
        recs = []
        overloaded_faculty = [f for f in analysis if f["status"] == "overloaded"]
        underloaded_faculty = [f for f in analysis if f["status"] == "underloaded"]

        if overloaded_faculty:
            names = ", ".join(f["name"] for f in overloaded_faculty[:3])
            recs.append(f"Redistribute workload from overloaded faculty: {names}")
            recs.append("Consider hiring part-time instructors for overloaded departments")

        if underloaded_faculty:
            names = ", ".join(f["name"] for f in underloaded_faculty[:3])
            recs.append(f"Increase course assignments for underloaded faculty: {names}")

        if not overloaded_faculty and not underloaded_faculty:
            recs.append("Faculty workload distribution is currently balanced")

        recs.append("Review faculty preferences for course assignments each semester")
        recs.append("Ensure alignment between faculty expertise and course assignments")

        return recs


risk_predictor = RiskPredictor()
