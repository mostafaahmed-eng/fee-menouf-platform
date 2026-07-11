import logging
from collections import defaultdict

from app.scheduler.models import (
    ExamScheduleInput,
    ExamScheduleOutput,
    ExamSlot,
    DayOfWeek,
)

logger = logging.getLogger("ai_engine.exam_scheduler")

TIME_SLOTS_MAP = {
    "09:00": "11:00",
    "11:00": "13:00",
    "13:00": "15:00",
    "15:00": "17:00",
}

DAYS = [
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
]


class ExamScheduler:
    def solve(self, input_data: ExamScheduleInput) -> ExamScheduleOutput:
        logger.info(f"Starting exam scheduling with {len(input_data.courses)} courses, {len(input_data.halls)} halls")

        student_courses: dict[str, set[str]] = defaultdict(set)
        for reg in input_data.student_registrations:
            for cid in reg.course_ids:
                student_courses[reg.student_id].add(cid)

        conflict_graph: dict[str, set[str]] = defaultdict(set)
        for student_id, courses in student_courses.items():
            course_list = list(courses)
            for i in range(len(course_list)):
                for j in range(i + 1, len(course_list)):
                    conflict_graph[course_list[i]].add(course_list[j])
                    conflict_graph[course_list[j]].add(course_list[i])

        sorted_courses = sorted(
            input_data.courses,
            key=lambda c: (-len(conflict_graph.get(c.id, set())), -c.expected_enrollment),
        )

        exam_schedule = []
        conflicts = []
        warnings = []

        time_slot_usage: dict[str, set[str]] = {}
        hall_usage: dict[str, dict] = {}

        for date in input_data.exam_dates:
            for day_idx, day in enumerate(DAYS):
                if day_idx >= len(input_data.exam_dates):
                    continue
                course_idx = input_data.exam_dates.index(date)
                if course_idx != day_idx:
                    continue

                for start_time, end_time in TIME_SLOTS_MAP.items():
                    slot_key = f"{date}_{start_time}"
                    for hall in sorted(input_data.halls, key=lambda h: h.capacity, reverse=True):
                        if hall.id not in hall_usage:
                            hall_usage[hall.id] = {}

                        if hall_usage[hall.id].get(slot_key):
                            continue

                        for course in sorted_courses:
                            if course.id in time_slot_usage.get(slot_key, set()):
                                continue

                            if hall.capacity < course.expected_enrollment:
                                continue

                            assigned_students = set()
                            for sid, cids in student_courses.items():
                                if course.id in cids:
                                    assigned_students.add(sid)

                            if hall.capacity < len(assigned_students):
                                for bigger_hall in sorted(input_data.halls, key=lambda h: h.capacity):
                                    if bigger_hall.capacity >= len(assigned_students) and not hall_usage[bigger_hall.id].get(slot_key):
                                        hall = bigger_hall
                                        break
                                else:
                                    continue

                            if slot_key not in time_slot_usage:
                                time_slot_usage[slot_key] = set()
                            time_slot_usage[slot_key].add(course.id)
                            hall_usage[hall.id][slot_key] = course.id

                            exam_schedule.append(ExamSlot(
                                course_code=course.code,
                                course_name=course.name,
                                day=day,
                                date=date,
                                start_time=start_time,
                                end_time=end_time,
                                hall=hall.name,
                                capacity=hall.capacity,
                                enrolled_count=len(assigned_students),
                            ))
                            break
                        else:
                            continue
                        break

        scheduled_courses = set(s.course_code for s in exam_schedule)
        for course in input_data.courses:
            if course.code not in scheduled_courses:
                conflicts.append(f"Could not schedule exam for {course.code} ({course.name})")

        stats = self._compute_statistics(exam_schedule, input_data, conflicts)
        return ExamScheduleOutput(schedule=exam_schedule, statistics=stats, conflicts=conflicts, warnings=warnings)

    def _compute_statistics(self, schedule: list[ExamSlot], input_data: ExamScheduleInput, conflicts: list) -> dict:
        total_students = len(set(
            sid for reg in input_data.student_registrations for sid in [reg.student_id]
        ))

        courses_scheduled = len(set(s.course_code for s in schedule))

        day_dist = defaultdict(int)
        for slot in schedule:
            day_dist[slot.date] += 1

        consecutive_exams = 0
        student_exam_count = defaultdict(list)
        for slot in schedule:
            for reg in input_data.student_registrations:
                for cid in reg.course_ids:
                    if cid == slot.course_code:
                        student_exam_count[reg.student_id].append((slot.date, slot.start_time))

        for sid, exams in student_exam_count.items():
            sorted_exams = sorted(exams, key=lambda x: (x[0], x[1]))
            for i in range(len(sorted_exams) - 1):
                if sorted_exams[i][0] == sorted_exams[i + 1][0]:
                    consecutive_exams += 1

        hall_usage = defaultdict(int)
        for slot in schedule:
            hall_usage[slot.hall] += 1

        return {
            "total_exams": len(schedule),
            "courses_scheduled": courses_scheduled,
            "courses_unscheduled": len(input_data.courses) - courses_scheduled,
            "total_students": total_students,
            "daily_distribution": dict(day_dist),
            "consecutive_exam_instances": consecutive_exams,
            "hall_usage": dict(hall_usage),
            "conflict_count": len(conflicts),
        }

    def detect_conflicts(self, schedule: list[ExamSlot], student_registrations: list) -> list[str]:
        conflicts_found = []

        student_exams = defaultdict(list)
        for slot in schedule:
            for reg in student_registrations:
                for cid in reg.course_ids:
                    if cid == slot.course_code:
                        student_exams[reg.student_id].append(slot)

        for sid, exams in student_exams.items():
            for i in range(len(exams)):
                for j in range(i + 1, len(exams)):
                    if exams[i].date == exams[j].date:
                        if not (exams[i].end_time <= exams[j].start_time or exams[j].end_time <= exams[i].start_time):
                            conflicts_found.append(
                                f"Student {sid} has overlapping exams: {exams[i].course_code} and {exams[j].course_code} on {exams[i].date}"
                            )

        return list(set(conflicts_found))


exam_scheduler = ExamScheduler()
