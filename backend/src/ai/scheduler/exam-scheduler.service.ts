import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../../database/entities/classroom.entity';
import { Course } from '../../database/entities/course.entity';
import { Exam, ExamType } from '../../database/entities/exam.entity';
import { ExamSchedule } from '../../database/entities/exam-schedule.entity';
import { Semester, SemesterType } from '../../database/entities/semester.entity';
import { CourseRegistration, RegistrationStatus } from '../../database/entities/course-registration.entity';
import { Schedule, ScheduleType, ScheduleStatus } from '../../database/entities/schedule.entity';

interface ExamSlot {
  date: string;
  startTime: string;
  endTime: string;
}

@Injectable()
export class ExamSchedulerService {
  private readonly logger = new Logger(ExamSchedulerService.name);

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamSchedule)
    private readonly examScheduleRepo: Repository<ExamSchedule>,
    @InjectRepository(Semester)
    private readonly semesterRepo: Repository<Semester>,
    @InjectRepository(CourseRegistration)
    private readonly registrationRepo: Repository<CourseRegistration>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async generateSchedule(semesterId: string): Promise<{ schedule: Schedule; examSchedules: ExamSchedule[]; conflicts: number }> {
    const semester = await this.semesterRepo.findOne({ where: { id: semesterId } });
    if (!semester) throw new Error('Semester not found');

    const courses = await this.courseRepo.find({ where: { isActive: true } });
    const halls = await this.classroomRepo.find({ where: { isActive: true } });

    const examSlots = this.generateExamSlots(semester);
    const occupiedHalls = new Map<string, string[]>();
    const studentExamDays = new Map<string, Set<string>>();

    for (const slot of examSlots) {
      occupiedHalls.set(`${slot.date}_${slot.startTime}`, []);
    }

    for (const course of courses) {
      if (!course.credits || course.credits <= 0) continue;

      const registrations = await this.registrationRepo.find({
        where: { courseId: course.id, status: RegistrationStatus.APPROVED },
      });
      const enrolledCount = registrations.length;
      const studentIds = registrations.map((r) => r.studentId);

      const existing = await this.examRepo.findOne({ where: { courseId: course.id, type: ExamType.FINAL } });
      const exam = existing || this.examRepo.create({
        courseId: course.id,
        type: ExamType.FINAL,
        date: new Date(),
        startTime: '09:00',
        endTime: '11:00',
        duration: 120,
        totalMarks: 100,
        semesterId,
      });

      let scheduled = false;
      for (const slot of examSlots) {
        if (scheduled) break;

        const hallKey = `${slot.date}_${slot.startTime}`;
        const hallOccupants = occupiedHalls.get(hallKey) || [];

        const suitableHall = halls.find((h) => {
          if (h.capacity < enrolledCount) return false;
          const currentOccupants = hallOccupants.length;
          return currentOccupants + 1 <= halls.length;
        });

        if (!suitableHall) continue;

        let hasConflict = false;
        for (const sid of studentIds) {
          const studentDays = studentExamDays.get(sid);
          if (studentDays && studentDays.has(slot.date)) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) continue;

        exam.date = new Date(slot.date);
        exam.startTime = slot.startTime;
        exam.endTime = slot.endTime;

        const savedExam = await this.examRepo.save(exam);

        const examSchedule = this.examScheduleRepo.create({
          examId: savedExam.id,
          classroomId: suitableHall.id,
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          group: 'A',
        });
        await this.examScheduleRepo.save(examSchedule);

        for (const sid of studentIds) {
          if (!studentExamDays.has(sid)) {
            studentExamDays.set(sid, new Set());
          }
          studentExamDays.get(sid)!.add(slot.date);
        }

        const hallList = occupiedHalls.get(hallKey) || [];
        hallList.push(course.id);
        occupiedHalls.set(hallKey, hallList);
        scheduled = true;
      }

      if (!scheduled) {
        this.logger.warn(`Could not schedule exam for course ${course.code || course.nameEn}`);
      }
    }

    const allExamSchedules = await this.examScheduleRepo.find({
      where: {},
      relations: ['exam', 'exam.course', 'classroom'],
    });

    const scheduleData = this.scheduleRepo.create({
      type: ScheduleType.EXAM,
      title: `Exam Schedule - ${semester.nameEn}`,
      data: { schedules: allExamSchedules.map((es) => es.id), semesterId, generatedAt: new Date() },
      status: ScheduleStatus.DRAFT,
      semesterId,
    });
    const schedule = await this.scheduleRepo.save(scheduleData);

    this.logger.log(`Generated ${allExamSchedules.length} exam schedules`);
    return { schedule, examSchedules: allExamSchedules, conflicts: 0 };
  }

  private generateExamSlots(semester: Semester): ExamSlot[] {
    const slots: ExamSlot[] = [];
    const startDate = semester.startDate || new Date();
    const endDate = semester.endDate || new Date(startDate.getTime() + 20 * 24 * 60 * 60 * 1000);
    const examTimes = [
      { start: '09:00', end: '11:00' },
      { start: '11:30', end: '13:30' },
      { start: '14:00', end: '16:00' },
    ];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 5) continue;

      for (const time of examTimes) {
        slots.push({
          date: d.toISOString().split('T')[0],
          startTime: time.start,
          endTime: time.end,
        });
      }
    }

    return slots;
  }
}
