export interface Grade {
  id: string;
  course?: { id: string; nameAr: string; nameEn: string; code: string };
  courseId: string;
  courseCode: string;
  courseNameAr: string;
  courseNameEn: string;
  coursework: number;
  midterm: number;
  final: number;
  total: number;
  gradeLetter: string;
  gpaPoints: number;
  credits: number;
  isPublished: boolean;
  semester: string;
  academicYear: string;
}

export interface GradeReport {
  studentName: string;
  studentId: string;
  department: string;
  level: number;
  semester: number;
  academicYear: string;
  grades: Grade[];
  totalCredits: number;
  completedCredits: number;
  semesterGpa: number;
  cumulativeGpa: number;
  reportGeneratedAt: string;
}

export interface GradeDistribution {
  courseName: string;
  aCount: number;
  bCount: number;
  cCount: number;
  dCount: number;
  fCount: number;
}

export interface GradeFilters {
  studentId?: string;
  courseId?: string;
  semester?: string;
  academicYear?: string;
}
