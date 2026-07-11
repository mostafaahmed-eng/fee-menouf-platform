import { z } from "zod";

export const registrationSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  courses: z.array(z.string()).min(1, "At least one course must be selected"),
  semester: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  notes: z.string().optional().or(z.literal("")),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export const courseRegistrationSchema = z.object({
  courseIds: z.array(z.string()).min(1, "Select at least one course"),
});

export type CourseRegistrationFormData = z.infer<typeof courseRegistrationSchema>;

export const dropCourseSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  reason: z.string().min(10, "Please provide a reason for dropping the course"),
});

export type DropCourseFormData = z.infer<typeof dropCourseSchema>;
