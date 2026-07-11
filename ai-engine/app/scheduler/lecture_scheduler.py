import logging
import itertools
from typing import Optional
from datetime import datetime

from app.scheduler.models import (
    ScheduleInput,
    ScheduleOutput,
    LectureSlot,
    DayOfWeek,
)

logger = logging.getLogger("ai_engine.lecture_scheduler")

TIME_SLOTS_MAP = {
    "08:00": "09:30",
    "09:30": "11:00",
    "11:00": "12:30",
    "12:30": "14:00",
    "14:00": "15:30",
    "15:30": "17:00",
}

DAYS_ORDER = [
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
]


class LectureScheduler:
    def solve(self, input_data: ScheduleInput) -> ScheduleOutput:
        logger.info(f"Starting lecture scheduling with {len(input_data.courses)} courses, {len(input_data.rooms)} rooms")

        try:
            return self._solve_with_constraint(input_data)
        except ImportError:
            logger.warning("python-constraint not available, using greedy algorithm")
            return self._solve_greedy(input_data)
        except Exception as e:
            logger.error(f"CSP solver failed: {e}, using greedy fallback")
            return self._solve_greedy(input_data)

    def _solve_with_constraint(self, input_data: ScheduleInput) -> ScheduleOutput:
        from constraint import Problem, Domain

        problem = Problem()
        time_slot_pairs = []
        for day in DAYS_ORDER:
            for start, end in TIME_SLOTS_MAP.items():
                time_slot_pairs.append((day, start, end))

        for course in input_data.courses:
            valid_assignments = []
            for room in input_data.rooms:
                if room.capacity < course.expected_enrollment:
                    continue
                if course.requires_lab and room.room_type != "lab":
                    continue
                if course.requires_projector and not room.has_projector:
                    continue
                for day, start_time, end_time in time_slot_pairs:
                    instructor = next(
                        (f for f in input_data.faculty if f.id == course.instructor_id),
                        None,
                    )
                    if instructor:
                        if instructor.unavailable_slots:
                            for us in instructor.unavailable_slots:
                                if us.day == day and us.start_time <= start_time < us.end_time:
                                    continue
                    valid_assignments.append((room.id, room.name, room.building, day, start_time, end_time))

            if valid_assignments:
                problem.addVariable(course.code, valid_assignments)

        schedule_slots = []
        conflicts = []
        warnings = []

        solution = problem.getSolution() if problem.getConstraints() else None

        if solution:
            for course in input_data.courses:
                if course.code in solution:
                    room_id, room_name, building, day, start_time, end_time = solution[course.code]
                    instructor_name = ""
                    if course.instructor_id:
                        inst = next((f for f in input_data.faculty if f.id == course.instructor_id), None)
                        instructor_name = inst.name if inst else ""

                    schedule_slots.append(LectureSlot(
                        course_code=course.code,
                        course_name=course.name,
                        instructor=instructor_name,
                        day=day,
                        start_time=start_time,
                        end_time=end_time,
                        room=room_name,
                        building=building,
                    ))

        if not schedule_slots:
            return self._solve_greedy(input_data)

        stats = self._compute_statistics(schedule_slots, input_data)
        return ScheduleOutput(schedule=schedule_slots, statistics=stats, conflicts=conflicts, warnings=warnings)

    def _solve_greedy(self, input_data: ScheduleInput) -> ScheduleOutput:
        schedule_slots = []
        conflicts = []
        warnings = []

        faculty_schedule: dict[str, list[tuple]] = {}
        room_schedule: dict[str, list[tuple]] = {}

        for instructor in input_data.faculty:
            faculty_schedule[instructor.id] = []

        for room in input_data.rooms:
            room_schedule[room.id] = []

        sorted_courses = sorted(
            input_data.courses,
            key=lambda c: (-c.expected_enrollment, -c.credit_hours),
        )

        for course in sorted_courses:
            assigned = False
            instructor = next(
                (f for f in input_data.faculty if f.id == course.instructor_id),
                None,
            )

            for day in DAYS_ORDER:
                if instructor and instructor.preferred_days and day not in instructor.preferred_days:
                    continue
                if instructor:
                    for us in instructor.unavailable_slots:
                        if us.day == day:
                            continue

                for start_time, end_time in sorted(TIME_SLOTS_MAP.items()):
                    if instructor:
                        inst_conflict = False
                        for (s, e, d) in faculty_schedule.get(course.instructor_id, []):
                            if d == day and s == start_time:
                                inst_conflict = True
                                break
                        if inst_conflict:
                            continue

                        instructor_hours = sum(2 for _ in faculty_schedule.get(course.instructor_id, []))
                        if instructor and instructor.max_hours_per_week and instructor_hours >= instructor.max_hours_per_week:
                            continue

                    for room in input_data.rooms:
                        if room.capacity < course.expected_enrollment:
                            continue
                        if course.requires_lab and room.room_type != "lab":
                            continue
                        if course.requires_projector and not room.has_projector:
                            continue

                        room_conflict = False
                        for (s, e, d) in room_schedule.get(room.id, []):
                            if d == day and s == start_time:
                                room_conflict = True
                                break
                        if room_conflict:
                            continue

                        schedule_slots.append(LectureSlot(
                            course_code=course.code,
                            course_name=course.name,
                            instructor=instructor.name if instructor else "",
                            day=day,
                            start_time=start_time,
                            end_time=end_time,
                            room=room.name,
                            building=room.building,
                        ))

                        faculty_schedule.setdefault(course.instructor_id, []).append((start_time, end_time, day))
                        room_schedule[room.id].append((start_time, end_time, day))

                        assigned = True
                        break
                    if assigned:
                        break
                if assigned:
                    break

            if not assigned:
                conflicts.append(f"Could not schedule {course.code} ({course.name})")

        stats = self._compute_statistics(schedule_slots, input_data)
        return ScheduleOutput(schedule=schedule_slots, statistics=stats, conflicts=conflicts, warnings=warnings)

    def _compute_statistics(self, schedule: list[LectureSlot], input_data: ScheduleInput) -> dict:
        if not schedule:
            return {
                "total_slots": 0,
                "courses_scheduled": 0,
                "courses_unscheduled": len(input_data.courses),
                "room_utilization": {},
                "daily_distribution": {},
                "gaps_avg": 0,
            }

        courses_scheduled = len(set(s.course_code for s in schedule))
        unscheduled = len(input_data.courses) - courses_scheduled

        day_counts = {}
        for slot in schedule:
            day_counts[slot.day] = day_counts.get(slot.day, 0) + 1

        room_util = {}
        for slot in schedule:
            if slot.room not in room_util:
                room_util[slot.room] = {"used_slots": 0, "total_slots": len(TIME_SLOTS_MAP) * len(DAYS_ORDER)}
            room_util[slot.room]["used_slots"] += 1

        for room_id in room_util:
            u = room_util[room_id]
            u["utilization_pct"] = round((u["used_slots"] / u["total_slots"]) * 100, 1)

        total_gaps = 0
        scheduled_by_course = {}
        for slot in schedule:
            scheduled_by_course.setdefault(slot.course_code, []).append(slot)

        for course_code, slots in scheduled_by_course.items():
            if len(slots) > 1:
                sorted_slots = sorted(slots, key=lambda s: (DAYS_ORDER.index(s.day) if s.day in DAYS_ORDER else 0, s.start_time))
                for i in range(len(sorted_slots) - 1):
                    current_end = sorted_slots[i].end_time
                    next_start = sorted_slots[i + 1].start_time
                    gap = self._time_diff_minutes(current_end, next_start)
                    total_gaps += gap

        avg_gap = total_gaps / max(len(scheduled_by_course), 1)

        return {
            "total_slots": len(schedule),
            "courses_scheduled": courses_scheduled,
            "courses_unscheduled": unscheduled,
            "schedule_rate": round(courses_scheduled / max(len(input_data.courses), 1) * 100, 1),
            "daily_distribution": day_counts,
            "room_utilization": room_util,
            "avg_gaps_minutes": round(avg_gap, 1),
        }

    def _time_diff_minutes(self, t1: str, t2: str) -> int:
        try:
            fmt = "%H:%M"
            dt1 = datetime.strptime(t1, fmt)
            dt2 = datetime.strptime(t2, fmt)
            diff = (dt2 - dt1).total_seconds() / 60
            return max(0, int(diff))
        except Exception:
            return 0

    def optimize(self, existing_schedule: list[LectureSlot], input_data: ScheduleInput) -> ScheduleOutput:
        output = self.solve(input_data)
        output.statistics["optimization_applied"] = True
        output.warnings.append("Schedule was re-optimized from existing data")
        return output


lecture_scheduler = LectureScheduler()
