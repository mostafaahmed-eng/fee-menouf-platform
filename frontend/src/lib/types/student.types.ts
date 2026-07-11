export type EnrollmentStatus = "enrolled" | "suspended" | "graduated" | "withdrawn";

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  nameAr?: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  gender: "male" | "female";
  phone: string;
  address: string;
  department: string;
  level: number;
  semester: number;
  academicYear: string;
  enrollmentStatus: EnrollmentStatus;
  gpa: number;
  totalCredits: number;
  completedCredits: number;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFilters {
  search?: string;
  department?: string;
  level?: number;
  enrollmentStatus?: EnrollmentStatus;
  academicYear?: string;
}

export interface EnrollmentTrend {
  month: string;
  count: number;
}

export interface DepartmentStats {
  department: string;
  studentCount: number;
  averageGpa: number;
}
