import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date,
  locale: string = "en",
  formatStr: string = "PPP"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr, {
    locale: locale === "ar" ? ar : enUS,
  });
}

export function formatRelativeTime(
  date: string | Date,
  locale: string = "en"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: locale === "ar" ? ar : enUS });
}

export function formatGPA(gpa: number | null | undefined): string {
  if (gpa == null || isNaN(gpa)) return '0.00';
  return gpa.toFixed(2);
}

export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    enrolled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    graduated: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return colors[status] || colors.pending;
}

export function getGradeColor(grade: string): string {
  const gradeNum = parseFloat(grade);
  if (gradeNum >= 90) return "text-green-600 dark:text-green-400";
  if (gradeNum >= 80) return "text-blue-600 dark:text-blue-400";
  if (gradeNum >= 70) return "text-yellow-600 dark:text-yellow-400";
  if (gradeNum >= 60) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function getLetterGrade(percentage: number): string {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

export function getGradePoints(letterGrade: string): number {
  const points: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0,
  };
  return points[letterGrade] || 0;
}

export function calculateGPA(grades: { grade: string; creditHours: number }[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const { grade, creditHours } of grades) {
    totalPoints += getGradePoints(grade) * creditHours;
    totalCredits += creditHours;
  }
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}
