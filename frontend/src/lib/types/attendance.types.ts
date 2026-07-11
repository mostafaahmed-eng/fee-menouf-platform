export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface Attendance {
  id: string;
  courseId: string;
  courseName: string;
  lectureTitle: string;
  markedBy: 'qr' | 'manual' | 'face';
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  method: 'qr' | 'manual' | 'face';
}

export interface AttendanceRecord {
  student: {
    id: string;
    name: string;
    studentId: string;
  };
  attendance: Attendance[];
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface AttendanceFilters {
  courseId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  studentId?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}
