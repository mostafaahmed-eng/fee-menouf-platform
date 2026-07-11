export type DayOfWeek = "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export interface ScheduleSlot {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructorName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
  type: "lecture" | "tutorial" | "lab";
  group?: string;
  color?: string;
}

export interface Schedule {
  id: string;
  studentId?: string;
  instructorId?: string;
  semester: string;
  academicYear: string;
  slots: ScheduleSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface TimeTableDay {
  day: DayOfWeek;
  label: string;
  labelAr: string;
  slots: ScheduleSlot[];
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
];

export const DAY_LABELS: Record<DayOfWeek, { en: string; ar: string }> = {
  saturday: { en: "Saturday", ar: "السبت" },
  sunday: { en: "Sunday", ar: "الأحد" },
  monday: { en: "Monday", ar: "الإثنين" },
  tuesday: { en: "Tuesday", ar: "الثلاثاء" },
  wednesday: { en: "Wednesday", ar: "الأربعاء" },
  thursday: { en: "Thursday", ar: "الخميس" },
  friday: { en: "Friday", ar: "الجمعة" },
};
