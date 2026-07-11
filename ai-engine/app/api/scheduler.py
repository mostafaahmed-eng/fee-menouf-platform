import logging
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException

from app.scheduler.models import (
    ScheduleInput,
    ScheduleOutput,
    ExamScheduleInput,
    ExamScheduleOutput,
    LectureSlot,
)
from app.scheduler.lecture_scheduler import lecture_scheduler
from app.scheduler.exam_scheduler import exam_scheduler

logger = logging.getLogger("ai_engine.api.scheduler")
router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


class OptimizeRequest(BaseModel):
    schedule: list  # list of LectureSlot dicts
    input_data: ScheduleInput


@router.post("/generate-lecture", response_model=ScheduleOutput)
async def generate_lecture_schedule(input_data: ScheduleInput):
    try:
        result = lecture_scheduler.solve(input_data)
        logger.info(
            f"Lecture schedule generated: {result.statistics.get('courses_scheduled', 0)} courses scheduled, "
            f"{len(result.conflicts)} conflicts"
        )
        return result
    except Exception as e:
        logger.error(f"Lecture scheduling error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-exam", response_model=ExamScheduleOutput)
async def generate_exam_schedule(input_data: ExamScheduleInput):
    try:
        result = exam_scheduler.solve(input_data)
        conflicts = exam_scheduler.detect_conflicts(result.schedule, input_data.student_registrations)
        result.conflicts.extend(conflicts)
        logger.info(
            f"Exam schedule generated: {result.statistics.get('total_exams', 0)} exams, "
            f"{len(result.conflicts)} conflicts"
        )
        return result
    except Exception as e:
        logger.error(f"Exam scheduling error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize", response_model=ScheduleOutput)
async def optimize_schedule(request: OptimizeRequest):
    try:
        existing_slots = []
        for slot_data in request.schedule:
            if isinstance(slot_data, dict):
                existing_slots.append(LectureSlot(**slot_data))
            else:
                existing_slots.append(slot_data)

        result = lecture_scheduler.optimize(existing_slots, request.input_data)
        logger.info(f"Schedule optimized: {result.statistics.get('courses_scheduled', 0)} courses")
        return result
    except Exception as e:
        logger.error(f"Schedule optimization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
