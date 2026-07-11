import logging
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException

from app.chat.chat_engine import chat_engine
from app.chat.prompts import (
    ADVISOR_PROMPT,
    RECOMMENDATION_PROMPT,
    GRADUATION_CHECK_PROMPT,
)
from app.rag.rag_engine import rag_engine

logger = logging.getLogger("ai_engine.api.advisor")
router = APIRouter(prefix="/advisor", tags=["Academic Advisor"])


class StudentProfile(BaseModel):
    student_id: str
    student_name: str
    department: str
    gpa: float
    completed_credits: int
    current_semester: int
    academic_level: str
    enrolled_courses: list[str] = []
    completed_courses: list[str] = []
    interests: list[str] = []
    recent_grades: list[float] = []


class CourseRecommendationRequest(BaseModel):
    student: StudentProfile
    available_courses: list[dict] = []
    include_context: bool = True


class GraduationCheckRequest(BaseModel):
    student: StudentProfile
    min_required_credits: int = 160
    pending_requirements: list[str] = []


class AcademicPlanRequest(BaseModel):
    student: StudentProfile
    target_graduation_semester: Optional[int] = None


@router.post("/recommend-courses")
async def recommend_courses(request: CourseRecommendationRequest):
    student = request.student
    try:
        context = ""
        if request.include_context:
            retrieved = rag_engine.retrieve_with_context(
                query=f"course recommendations for {student.department} department level {student.academic_level}",
                k=4,
            )
            context = retrieved["context"]

        available_courses_str = "\n".join(
            f"{c.get('code', c.get('id', ''))}: {c.get('name', '')} ({c.get('credit_hours', 0)} cr)"
            for c in request.available_courses
        ) if request.available_courses else "No specific courses provided"

        prompt = RECOMMENDATION_PROMPT.format(
            department=student.department,
            gpa=student.gpa,
            completed_credits=student.completed_credits,
            current_semester=student.current_semester,
            completed_courses=", ".join(student.completed_courses),
            interests=", ".join(student.interests) if student.interests else "General",
            available_courses=available_courses_str,
            context=context,
        )

        result = await chat_engine.send_message(
            query=f"Recommend courses for student {student.student_name} in {student.department}",
            session_id=f"advisor_{student.student_id}",
            student_data=student.model_dump(),
            system_prompt_override=prompt,
        )

        return {
            "student_id": student.student_id,
            "recommendations": result["answer"],
            "token_usage": result["token_usage"],
        }
    except Exception as e:
        logger.error(f"Course recommendation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-graduation")
async def check_graduation(request: GraduationCheckRequest):
    student = request.student
    try:
        context = ""
        retrieved = rag_engine.retrieve_with_context(
            query=f"graduation requirements for {student.department} department",
            k=5,
        )
        context = retrieved["context"]

        prompt = GRADUATION_CHECK_PROMPT.format(
            student_name=student.student_name,
            department=student.department,
            gpa=student.gpa,
            completed_credits=student.completed_credits,
            min_required_credits=request.min_required_credits,
            completed_courses=", ".join(student.completed_courses),
            pending_requirements=", ".join(request.pending_requirements) if request.pending_requirements else "None specified",
            context=context,
        )

        result = await chat_engine.send_message(
            query=f"Check graduation eligibility for {student.student_name}",
            session_id=f"grad_{student.student_id}",
            student_data=student.model_dump(),
            system_prompt_override=prompt,
        )

        credits_remaining = max(0, request.min_required_credits - student.completed_credits)
        gpa_eligible = student.gpa >= 2.0

        return {
            "student_id": student.student_id,
            "student_name": student.student_name,
            "department": student.department,
            "current_gpa": student.gpa,
            "completed_credits": student.completed_credits,
            "min_required_credits": request.min_required_credits,
            "credits_remaining": credits_remaining,
            "gpa_eligible": gpa_eligible,
            "analysis": result["answer"],
            "token_usage": result["token_usage"],
        }
    except Exception as e:
        logger.error(f"Graduation check error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/academic-plan")
async def generate_academic_plan(request: AcademicPlanRequest):
    student = request.student
    try:
        context = ""
        retrieved = rag_engine.retrieve_with_context(
            query=f"academic plan for {student.department}",
            k=5,
        )
        context = retrieved["context"]

        prompt = ADVISOR_PROMPT.format(
            student_name=student.student_name,
            department=student.department,
            gpa=student.gpa,
            completed_credits=student.completed_credits,
            current_semester=student.current_semester,
            academic_level=student.academic_level,
            enrolled_courses=", ".join(student.enrolled_courses) if student.enrolled_courses else "None",
            completed_courses=", ".join(student.completed_courses) if student.completed_courses else "None",
            context=context,
        )

        target = request.target_graduation_semester
        plan_instruction = ""
        if target:
            plan_instruction = f"Target graduation semester: {target}. "

        result = await chat_engine.send_message(
            query=f"{plan_instruction}Generate a comprehensive academic plan for {student.student_name}",
            session_id=f"plan_{student.student_id}",
            student_data=student.model_dump(),
            system_prompt_override=prompt,
        )

        return {
            "student_id": student.student_id,
            "academic_plan": result["answer"],
            "token_usage": result["token_usage"],
        }
    except Exception as e:
        logger.error(f"Academic plan error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
