// Re-export types from individual files
export type { UserRole, User, AuthState, LoginCredentials, RegisterData, AuthTokens, UserProfile } from './user.types';
export { isBackendRole } from './user.types';

export type { NotificationType, NotificationCategory, Notification, NotificationState } from './notification.types';

export type { DayOfWeek, ScheduleSlot, Schedule, TimeTableDay } from './schedule.types';
export { DAYS_OF_WEEK, DAY_LABELS } from './schedule.types';

export type { GradeReport, GradeFilters, GradeDistribution } from './grade.types';
export type { AttendanceStatus, AttendanceRecord, AttendanceFilters } from './attendance.types';
export type { EnrollmentStatus, Student, StudentFilters, EnrollmentTrend, DepartmentStats } from './student.types';

export type { ApiResponse, PaginatedResponse, ApiError, QueryParams, RequestStatus, PaginationState } from './api.types';

// Grade & Attendance re-exported inline below
import type { Grade } from './grade.types';
export type { Grade } from './grade.types';
export type { Attendance } from './attendance.types';
export type { AttendanceStats } from './attendance.types';

// ==================== STUDENT TYPES ====================

export interface StudentProfile {
  id: string;
  studentId: string;
  nationalId: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phone: string;
  profilePicture?: string;
  department: string;
  program: string;
  level: number;
  semester: number;
  gpa: number;
  cgpa: number;
  totalCredits: number;
  completedCredits: number;
  academicYear: string;
  enrollmentStatus: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  address: string;
}

export interface Course {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  credits: number;
  lectureHours: number;
  labHours: number;
  departmentId: string;
  level?: number;
  semester?: number;
  semesterOffered?: string;
  capacity: number;
  description?: string;
  prerequisites?: CoursePrerequisite[];
  schedule?: CourseSchedule[];
  isActive: boolean;
  isElective?: boolean;
  minGpa?: number;
  maxStudents?: number;
  programId?: string;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePrerequisite {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  isCompleted: boolean;
}

export interface CourseSchedule {
  day: number;
  startTime: string;
  endTime: string;
  room: string;
  building?: string;
}

export interface RegisteredCourse {
  id: string;
  course: Course;
  status: 'active' | 'dropped' | 'completed';
  registeredAt: string;
  approvedAt?: string;
  grade?: Grade;
  credits: number;
}

export interface RegistrationRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  totalCredits: number;
  maxCredits: number;
  courses: Course[];
  note?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GpaRecord {
  semester: string;
  academicYear: string;
  gpa: number;
  cgpa: number;
  totalCredits: number;
}

export interface Exam {
  id: string;
  course?: { id: string; nameAr: string; nameEn: string; code: string };
  courseCode: string;
  courseNameAr: string;
  courseNameEn: string;
  type: 'midterm' | 'final' | 'quiz' | 'practical';
  date: string;
  startTime: string;
  endTime: string;
  hall: string;
  location?: string;
  seatNumber: string;
  notes?: string;
  isPassed?: boolean;
  grade?: number;
}

export interface Lecture {
  id: string;
  courseName: string;
  courseCode: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
  doctorName: string;
}

export interface CompletedCourse {
  courseCode: string;
  courseNameAr: string;
  courseNameEn: string;
  credits: number;
  gradeLetter: string;
  gpaPoints: number;
  semester: string;
  academicYear: string;
  isPassed: boolean;
}

export interface AcademicHistory {
  semesters: AcademicSemester[];
  totalCredits: number;
  completedCredits: number;
  requiredCredits: number;
  cgpa: number;
}

export interface AcademicSemester {
  semester: string;
  academicYear: string;
  gpa: number;
  totalCredits: number;
  courses: CompletedCourse[];
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  type: 'lecture' | 'lab' | 'assignment' | 'reference';
  uploadedAt: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
  doctorId?: string;
}

export interface TimetableSlot {
  day: number;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  room: string;
  doctorName: string;
  color: string;
}

export interface RegistrationSummary {
  totalCredits: number;
  maxCredits: number;
  coursesCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  approvalNote?: string;
}

// ==================== FACULTY (DOCTOR) TYPES ====================

export interface FacultyProfile {
  id: string;
  employeeId: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  profilePicture?: string;
  officeHours?: string;
}

export interface FacultyDashboardStats {
  totalStudents: number;
  totalCourses: number;
  avgAttendance: number;
  pendingGrades: number;
  unreadInquiries: number;
}

export interface TodayLecture {
  id: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  room: string;
  studentCount: number;
}

export interface FacultyCourse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  credits: number;
  studentCount: number;
  scheduleDay: string;
  scheduleTime: string;
  room: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  attendancePercentage: number;
  grade?: number;
  gradeLetter?: string;
}

export interface GradeComponent {
  id: string;
  nameAr: string;
  nameEn: string;
  maxMarks: number;
  weight: number;
}

export interface StudentGrade {
  id: string;
  studentId: string;
  studentName: string;
  marks: number | null;
  componentId: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  courseName: string;
  studentName?: string;
}

// ==================== ADMIN TYPES ====================

export interface Department {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  headId?: string;
  faculty: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemUser {
  id: string;
  email: string;
  fullNameEn: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'TA' | 'ADVISOR' | 'HEAD' | 'STUDENT';
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Program {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  department: Department;
  departmentId: string;
  degree: string;
  duration: number;
  totalCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  isActive: boolean;
  academicYearId: string;
}

export interface Classroom {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: 'LECTURE_HALL' | 'LAB' | 'SEMINAR_ROOM';
  hasProjector: boolean;
  hasComputers: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  courseCode: string;
  courseName: string;
  doctorName: string;
  classroom: string;
  day: number;
  startTime: string;
  endTime: string;
  group?: string;
  type: 'lecture' | 'lab' | 'tutorial';
}

export interface SystemSettings {
  academicYear: string;
  currentSemester: string;
  registrationOpen: boolean;
  gradePublishingEnabled: boolean;
  maxCreditsPerSemester: number;
  attendanceThreshold: number;
  aiAssistantEnabled: boolean;
  notificationEmail: boolean;
  notificationSms: boolean;
}

export interface SystemHealth {
  status: string;
  timestamp?: string;
}

export interface ReportData {
  type: string;
  title: string;
  data: Record<string, unknown>[];
  generated_at: string;
  date_range: { from: string; to: string };
}

// ==================== AI ASSISTANT TYPES ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  feedback?: 'up' | 'down' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseRecommendation {
  courseCode: string;
  courseNameAr: string;
  courseNameEn: string;
  credits: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  prerequisitesMet: boolean;
  conflictCheck: boolean;
}

export interface GraduationPath {
  semester: string;
  academicYear: string;
  courses: string[];
  credits: number;
  isCurrent: boolean;
}

export interface RiskPrediction {
  studentId: string;
  studentName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  recommendations: string[];
  gpaTrend: { semester: string; gpa: number }[];
}

export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface ScheduleGenerationParams {
  semester_id: string;
  constraints: {
    max_lectures_per_day: number;
    prefer_morning: boolean;
    avoid_friday: boolean;
    gap_between_lectures: number;
  };
  preferences: {
    faculty_preferences: boolean;
    room_utilization: boolean;
    student_convenience: boolean;
  };
}
