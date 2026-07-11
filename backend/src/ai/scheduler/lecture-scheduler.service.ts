import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom, ClassroomType } from '../../database/entities/classroom.entity';
import { Course } from '../../database/entities/course.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { Semester } from '../../database/entities/semester.entity';
import { Schedule, ScheduleType, ScheduleStatus } from '../../database/entities/schedule.entity';
import { Lecture, LectureType } from '../../database/entities/lecture.entity';

@Injectable()
export class LectureSchedulerService {
  private readonly logger = new Logger(LectureSchedulerService.name);

  private readonly timeSlots = [
    { day: 0, startTime: '08:00', endTime: '09:30' },
    { day: 0, startTime: '09:45', endTime: '11:15' },
    { day: 0, startTime: '11:30', endTime: '13:00' },
    { day: 0, startTime: '13:15', endTime: '14:45' },
    { day: 1, startTime: '08:00', endTime: '09:30' },
    { day: 1, startTime: '09:45', endTime: '11:15' },
    { day: 1, startTime: '11:30', endTime: '13:00' },
    { day: 1, startTime: '13:15', endTime: '14:45' },
    { day: 2, startTime: '08:00', endTime: '09:30' },
    { day: 2, startTime: '09:45', endTime: '11:15' },
    { day: 2, startTime: '11:30', endTime: '13:00' },
    { day: 2, startTime: '13:15', endTime: '14:45' },
    { day: 3, startTime: '08:00', endTime: '09:30' },
    { day: 3, startTime: '09:45', endTime: '11:15' },
    { day: 3, startTime: '11:30', endTime: '13:00' },
    { day: 3, startTime: '13:15', endTime: '14:45' },
    { day: 4, startTime: '08:00', endTime: '09:30' },
    { day: 4, startTime: '09:45', endTime: '11:15' },
    { day: 4, startTime: '11:30', endTime: '13:00' },
    { day: 4, startTime: '13:15', endTime: '14:45' },
  ];

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Semester)
    private readonly semesterRepo: Repository<Semester>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(Lecture)
    private readonly lectureRepo: Repository<Lecture>,
  ) {}

  async generateSchedule(
    semesterId: string,
    constraints?: {
      maxLecturesPerDay?: number;
      noBackToBack?: boolean;
      respectCapacity?: boolean;
    },
  ): Promise<{ schedule: Schedule; lectures: Lecture[]; conflicts: number }> {
    const semester = await this.semesterRepo.findOne({ where: { id: semesterId } });
    if (!semester) {
      throw new Error('Semester not found');
    }

    const courses = await this.courseRepo.find({ where: { isActive: true } });
    const classrooms = await this.classroomRepo.find({ where: { isActive: true } });
    const doctors = await this.doctorRepo.find({ relations: ['user'] });

    const existingLectures = await this.lectureRepo.find({ relations: ['course'] });
    const occupiedSlots = new Set<string>();

    for (const lec of existingLectures) {
      occupiedSlots.add(`${lec.dayOfWeek}_${lec.startTime}_${lec.room}`);
    }

    const lectures: Lecture[] = [];
    const occupiedDoctors = new Map<string, Set<string>>();

    for (const course of courses) {
      const creditHours = course.lectureHours || course.credits || 3;
      const neededSlots = Math.ceil(creditHours / 1.5);

      for (let s = 0; s < neededSlots; s++) {
        const slot = this.findAvailableSlot(classrooms, occupiedSlots, doctors.length > 0 ? doctors[0].id : '');
        if (!slot) continue;

        const lec = this.lectureRepo.create({
          dayOfWeek: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: LectureType.LECTURE,
          title: `${course.nameEn} Lecture ${s + 1}`,
          room: slot.roomCode,
          courseId: course.id,
          group: 'A',
        });

        const saved = await this.lectureRepo.save(lec);
        lectures.push(saved);
        occupiedSlots.add(`${slot.day}_${slot.startTime}_${slot.roomCode}`);
      }
    }

    const scheduleData = this.scheduleRepo.create({
      type: ScheduleType.LECTURE,
      title: `Lecture Schedule - ${semester.nameEn}`,
      data: { lectures: lectures.map((l) => l.id), semesterId, generatedAt: new Date() },
      status: ScheduleStatus.DRAFT,
      semesterId,
    });
    const schedule = await this.scheduleRepo.save(scheduleData);

    this.logger.log(`Generated ${lectures.length} lecture sessions`);
    return { schedule, lectures, conflicts: 0 };
  }

  private findAvailableSlot(
    classrooms: Classroom[],
    occupiedSlots: Set<string>,
    doctorId: string,
  ): { day: number; startTime: string; endTime: string; roomCode: string } | null {
    for (const slot of this.timeSlots) {
      for (const room of classrooms) {
        const key = `${slot.day}_${slot.startTime}_${room.code}`;
        if (!occupiedSlots.has(key)) {
          return { ...slot, roomCode: room.code };
        }
      }
    }
    return null;
  }
}
