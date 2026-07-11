import logging
from typing import Optional

from app.config import settings
from app.rag.rag_engine import rag_engine
from app.utils.text_processor import detect_language, count_tokens

logger = logging.getLogger("ai_engine.context_builder")


class ContextBuilder:
    def __init__(self):
        self.max_context_tokens = settings.MAX_CONTEXT_LENGTH

    def build_chat_context(
        self,
        query: str,
        student_data: Optional[dict] = None,
        faculty_filter: Optional[dict] = None,
    ) -> dict:
        lang = detect_language(query)
        retrieval_k = settings.TOP_K_RETRIEVAL

        retrieved = rag_engine.retrieve_with_context(
            query=query,
            k=retrieval_k,
            filter_criteria=faculty_filter,
            max_tokens=self.max_context_tokens // 2,
        )

        context_parts = []
        context_parts.append(retrieved["context"])

        if student_data:
            student_context = self._build_student_context(student_data)
            context_parts.append(student_context)

        combined_context = "\n\n".join(filter(None, context_parts))
        combined_tokens = count_tokens(combined_context)

        if combined_tokens > self.max_context_tokens:
            from app.utils.text_processor import truncate_to_tokens
            combined_context = truncate_to_tokens(
                combined_context, self.max_context_tokens
            )

        return {
            "context": combined_context,
            "language": lang,
            "retrieved_docs": retrieved["results"],
            "total_context_tokens": min(combined_tokens, self.max_context_tokens),
        }

    def _build_student_context(self, student: dict) -> str:
        parts = []
        parts.append(f"Student Academic Profile:")
        parts.append(f"- Name: {student.get('name', 'N/A')}")
        parts.append(f"- Department: {student.get('department', 'N/A')}")
        parts.append(f"- Academic Level: {student.get('academic_level', 'N/A')}")
        parts.append(f"- Current GPA: {student.get('gpa', 'N/A')}/4.0")
        parts.append(f"- Completed Credits: {student.get('completed_credits', 'N/A')}")
        parts.append(f"- Current Semester: {student.get('current_semester', 'N/A')}")

        if "enrolled_courses" in student:
            courses = student["enrolled_courses"]
            if isinstance(courses, list):
                parts.append(f"- Currently Enrolled: {', '.join(courses)}")

        if "recent_grades" in student:
            parts.append(f"- Recent Grades: {student['recent_grades']}")

        if "attendance_rate" in student:
            parts.append(f"- Attendance Rate: {student['attendance_rate']}%")

        if "failed_credits" in student and student["failed_credits"] > 0:
            parts.append(f"- Failed Credits: {student['failed_credits']} (⚠ Needs attention)")

        return "\n".join(parts)


context_builder = ContextBuilder()
