import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

interface PaginationQueryOptions {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
  [key: string]: unknown;
}

export function generateUUID(): string {
  return uuidv4();
}

export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateStudentId(year: number, sequence: number): string {
  return `${year}${String(sequence).padStart(4, '0')}`;
}

export function generateEmployeeId(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateGPA(gradePoints: number, totalCredits: number): number {
  if (totalCredits === 0) return 0;
  return Math.round((gradePoints / totalCredits) * 100) / 100;
}

export function letterGradeToPoints(grade: string): number {
  const gradeMap: Record<string, number> = {
    'A+': 4.0, 'A': 3.7, 'A-': 3.3,
    'B+': 3.0, 'B': 2.7, 'B-': 2.3,
    'C+': 2.0, 'C': 1.7, 'C-': 1.3,
    'D+': 1.0, 'D': 0.7, 'F': 0.0,
  };
  return gradeMap[grade?.toUpperCase()] || 0;
}

export function getAcademicYearRange(): string {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export function parsePaginationOptions(query: PaginationQueryOptions) {
  return {
    page: parseInt(String(query.page), 10) || 1,
    limit: Math.min(parseInt(String(query.limit), 10) || 10, 100),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: (query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
  };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export function isValidEgyptianNationalId(id: string): boolean {
  return /^[2-3]\d{13}$/.test(id);
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
