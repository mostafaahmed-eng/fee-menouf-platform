import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Course, Lecture, LectureType, Classroom,
  ExamSchedule, Exam, ExamType, Schedule, ScheduleType, ScheduleStatus,
} from '../database/entities';
import { GenerateLectureScheduleDto } from './dto/generate-lecture-schedule.dto';
import { GenerateExamScheduleDto } from './dto/generate-exam-schedule.dto';
import { AdjustScheduleDto } from './dto/adjust-schedule.dto';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Lecture)
    private readonly lectureRepo: Repository<Lecture>,
    @InjectRepository(ExamSchedule)
    private readonly examScheduleRepo: Repository<ExamSchedule>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async generateLectureSchedule(dto: GenerateLectureScheduleDto) {
    const courses = await this.courseRepo.find({
      where: { id: In(dto.courseIds), isActive: true },
    });
    if (courses.length === 0) throw new BadRequestException('No active courses found');

    const classrooms = await this.classroomRepo.find({ where: { isActive: true } });
    if (classrooms.length === 0) throw new BadRequestException('No available classrooms');

    const existingLectures = await this.lectureRepo.find({ relations: ['course'] });
    const occupiedMap = new Map<string, boolean>();
    for (const lec of existingLectures) {
      occupiedMap.set(`${lec.dayOfWeek}-${lec.startTime}-${lec.room}`, true);
    }

    const timeSlots = [
      { start: '08:00', end: '09:30' },
      { start: '09:45', end: '11:15' },
      { start: '11:30', end: '13:00' },
      { start: '13:15', end: '14:45' },
      { start: '15:00', end: '16:30' },
      { start: '16:45', end: '18:15' },
    ];

    const generated: Lecture[] = [];

    for (const course of courses) {
      const neededSlots = Math.max(1, course.lectureHours > 0 ? Math.ceil(course.lectureHours / 1.5) : 1);
      let assigned = 0;

      for (let day = 0; day < 6 && assigned < neededSlots; day++) {
        for (const slot of timeSlots) {
          if (assigned >= neededSlots) break;

          for (const room of classrooms) {
            const key = `${day}-${slot.start}-${room.code}`;
            if (occupiedMap.has(key)) continue;
            if (course.maxStudents > 0 && room.capacity < course.maxStudents) continue;

            occupiedMap.set(key, true);
            const lecture = this.lectureRepo.create({
              courseId: course.id,
              dayOfWeek: day,
              startTime: slot.start,
              endTime: slot.end,
              type: LectureType.LECTURE,
              room: room.code,
              title: course.nameEn,
            });
            generated.push(lecture);
            assigned++;
            break;
          }
        }
      }

      if (assigned < neededSlots) {
        this.logger.warn(`Course ${course.code}: only assigned ${assigned}/${neededSlots} slots`);
      }
    }

    const saved = await this.lectureRepo.save(generated);

    await this.scheduleRepo.save({
      type: ScheduleType.LECTURE,
      title: `Lecture Schedule - ${new Date().toISOString()}`,
      data: { generatedCount: saved.length, courses: dto.courseIds },
      status: ScheduleStatus.DRAFT,
      semesterId: dto.semesterId,
    });

    return {
      message: `Generated ${saved.length} lecture slots`,
      lectures: saved.map((l) => ({
        id: l.id, courseId: l.courseId, dayOfWeek: l.dayOfWeek,
        startTime: l.startTime, endTime: l.endTime, room: l.room, type: l.type,
      })),
    };
  }

  async generateExamSchedule(dto: GenerateExamScheduleDto) {
    const courses = await this.courseRepo.find({
      where: { id: In(dto.courseIds), isActive: true },
    });
    if (courses.length === 0) throw new BadRequestException('No active courses found');

    const classrooms = await this.classroomRepo.find({ where: { isActive: true } });
    if (classrooms.length === 0) throw new BadRequestException('No available classrooms');

    const existing = await this.examScheduleRepo.find({ relations: ['exam'] });
    const occupiedMap = new Map<string, boolean>();
    for (const es of existing) {
      occupiedMap.set(`${es.date}-${es.startTime}-${es.classroomId}`, true);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14);
    const examDays = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dow = d.getDay();
      const egyptDay = (dow + 1) % 7;
      if (egyptDay >= 0 && egyptDay <= 4) {
        examDays.push(d.toISOString().split('T')[0]);
      }
    }

    const generated: ExamSchedule[] = [];
    const slots = [
      { start: '09:00', end: '11:00' },
      { start: '11:30', end: '13:30' },
      { start: '14:00', end: '16:00' },
    ];

    let ci = 0;
    for (const day of examDays) {
      if (ci >= courses.length) break;
      for (const slot of slots) {
        if (ci >= courses.length) break;
        const course = courses[ci];

        for (const room of classrooms) {
          const key = `${day}-${slot.start}-${room.id}`;
          if (occupiedMap.has(key)) continue;
          if (course.maxStudents > 0 && room.capacity < course.maxStudents) continue;

          const exam = await this.examRepo.save({
            courseId: course.id,
            type: dto.examType,
            date: new Date(day),
            startTime: slot.start,
            endTime: slot.end,
            duration: 120,
            totalMarks: 100,
          });

          occupiedMap.set(key, true);
          generated.push(this.examScheduleRepo.create({
            examId: exam.id,
            date: new Date(day),
            startTime: slot.start,
            endTime: slot.end,
            classroomId: room.id,
          }));
          ci++;
          break;
        }
      }
    }

    const saved = await this.examScheduleRepo.save(generated);

    await this.scheduleRepo.save({
      type: ScheduleType.EXAM,
      title: `Exam Schedule - ${dto.examType} - ${new Date().toISOString()}`,
      data: { generatedCount: saved.length, courses: dto.courseIds },
      status: ScheduleStatus.DRAFT,
      semesterId: dto.semesterId,
    });

    return {
      message: `Generated ${saved.length} exam slots`,
      schedules: saved.map((s) => ({
        id: s.id, examId: s.examId, date: s.date,
        startTime: s.startTime, endTime: s.endTime, classroomId: s.classroomId,
      })),
    };
  }

  async getLectureSchedule() {
    const lectures = await this.lectureRepo.find({
      relations: ['course', 'course.doctor', 'course.doctor.user'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    return lectures.map((l) => ({
      id: l.id,
      course: { id: l.course?.id, code: l.course?.code, name: l.course?.nameEn },
      doctor: l.course?.doctor ? `${l.course.doctor.user.fullNameEn}` : 'N/A',
      dayOfWeek: l.dayOfWeek,
      startTime: l.startTime,
      endTime: l.endTime,
      type: l.type,
      room: l.room,
      group: l.group,
    }));
  }

  async getExamSchedule() {
    return this.examScheduleRepo.find({
      relations: ['exam', 'exam.course', 'classroom'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async checkClassroomAvailability(id: string) {
    const classroom = await this.classroomRepo.findOne({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const lectures = await this.lectureRepo.find({ where: { room: classroom.code }, relations: ['course'] });

    const weekSchedule: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const l of lectures) {
      weekSchedule[l.dayOfWeek]?.push({
        startTime: l.startTime, endTime: l.endTime,
        courseCode: l.course?.code, courseName: l.course?.nameEn,
      });
    }

    for (const day of Object.keys(weekSchedule)) {
      weekSchedule[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return {
      classroom: { id: classroom.id, code: classroom.code, name: classroom.name, capacity: classroom.capacity },
      weekSchedule,
    };
  }

  async adjustSchedule(id: string, dto: AdjustScheduleDto) {
    const lecture = await this.lectureRepo.findOne({ where: { id } });
    if (!lecture) throw new NotFoundException('Lecture schedule not found');

    if (dto.dayOfWeek !== undefined) lecture.dayOfWeek = dto.dayOfWeek;
    if (dto.startTime) lecture.startTime = dto.startTime;
    if (dto.endTime) lecture.endTime = dto.endTime;
    if (dto.room) lecture.room = dto.room;

    return this.lectureRepo.save(lecture);
  }
}
