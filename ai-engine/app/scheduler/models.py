from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DayOfWeek(str, Enum):
    SATURDAY = "saturday"
    SUNDAY = "sunday"
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"


class TimeSlot(BaseModel):
    day: DayOfWeek
    start_time: str
    end_time: str


class Room(BaseModel):
    id: str
    name: str
    capacity: int
    building: str
    has_projector: bool = True
    has_air_conditioning: bool = True
    room_type: str = "lecture"


class Faculty(BaseModel):
    id: str
    name: str
    department: str
    preferred_days: list[DayOfWeek] = []
    max_hours_per_week: int = 18
    unavailable_slots: list[TimeSlot] = []


class Course(BaseModel):
    id: str
    code: str
    name: str
    name_ar: str = ""
    department: str
    level: int
    credit_hours: int
    lecture_hours: int = 0
    section_hours: int = 0
    lab_hours: int = 0
    expected_enrollment: int
    requires_projector: bool = True
    requires_lab: bool = False
    instructor_id: str = ""


class StudentRegistration(BaseModel):
    student_id: str
    course_ids: list[str]
    department: str
    academic_level: int


class LectureSlot(BaseModel):
    course_code: str
    course_name: str
    instructor: str
    day: DayOfWeek
    start_time: str
    end_time: str
    room: str
    building: str
    type: str = "lecture"
    group: str = ""


class ExamSlot(BaseModel):
    course_code: str
    course_name: str
    day: DayOfWeek
    date: str
    start_time: str
    end_time: str
    hall: str
    capacity: int
    enrolled_count: int


class ScheduleConstraint(BaseModel):
    type: str
    weight: float = 1.0
    description: str = ""


class ScheduleInput(BaseModel):
    courses: list[Course]
    rooms: list[Room]
    faculty: list[Faculty]
    time_slots: list[TimeSlot]
    constraints: list[ScheduleConstraint] = []


class ExamScheduleInput(BaseModel):
    courses: list[Course]
    halls: list[Room]
    time_slots: list[TimeSlot]
    student_registrations: list[StudentRegistration]
    exam_dates: list[str]


class ScheduleOutput(BaseModel):
    schedule: list[LectureSlot]
    statistics: dict
    conflicts: list[str] = []
    warnings: list[str] = []


class ExamScheduleOutput(BaseModel):
    schedule: list[ExamSlot]
    statistics: dict
    conflicts: list[str] = []
    warnings: list[str] = []
