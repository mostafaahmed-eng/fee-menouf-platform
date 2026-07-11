import logging
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException

from app.analytics.risk_predictor import risk_predictor

logger = logging.getLogger("ai_engine.api.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics"])


class StudentRiskRequest(BaseModel):
    student_data: dict


class BatchRiskRequest(BaseModel):
    students_data: list[dict]


class CourseDemandRequest(BaseModel):
    historical_data: list[dict]


class FacultyWorkloadRequest(BaseModel):
    faculty_data: list[dict]


@router.post("/predict-risk")
async def predict_risk(request: StudentRiskRequest):
    try:
        result = risk_predictor.predict_student_risk(request.student_data)
        logger.info(
            f"Risk prediction: score={result['risk_score']:.1f}, "
            f"level={result['risk_level']}"
        )
        return result
    except Exception as e:
        logger.error(f"Risk prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-risk/batch")
async def predict_risk_batch(request: BatchRiskRequest):
    try:
        results = risk_predictor.predict_batch(request.students_data)
        return {
            "total_students": len(results),
            "results": results,
            "high_risk_count": sum(1 for r in results if r.get("risk_level") in ("high", "critical")),
        }
    except Exception as e:
        logger.error(f"Batch risk prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/course-demand")
async def predict_course_demand(request: CourseDemandRequest):
    try:
        result = risk_predictor.predict_course_demand(request.historical_data)
        return result
    except Exception as e:
        logger.error(f"Course demand prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faculty-workload")
async def analyze_faculty_workload(request: FacultyWorkloadRequest):
    try:
        result = risk_predictor.analyze_faculty_workload(request.faculty_data)
        return result
    except Exception as e:
        logger.error(f"Faculty workload analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
