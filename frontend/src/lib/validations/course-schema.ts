import { z } from "zod";

export const courseSchema = z.object({
  code: z.string().min(2, "Course code must be at least 2 characters"),
  name: z.string().min(3, "Course name must be at least 3 characters"),
  nameAr: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  department: z.string().min(1, "Department is required"),
  level: z.number().min(1).max(5),
  semester: z.number().min(1).max(10),
  creditHours: z.number().min(1).max(6),
  type: z.enum(["lecture", "tutorial", "lab", "project"], {
    required_error: "Course type is required",
  }),
  maxStudents: z.number().min(1).max(500),
  instructorId: z.string().optional().or(z.literal("")),
  prerequisites: z.array(z.string()).optional(),
  syllabus: z.string().optional().or(z.literal("")),
});

export type CourseFormData = z.infer<typeof courseSchema>;

export const courseUpdateSchema = courseSchema.partial();
export type CourseUpdateFormData = z.infer<typeof courseUpdateSchema>;

export const courseSearchSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  level: z.coerce.number().optional(),
  semester: z.coerce.number().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  type: z.enum(["lecture", "tutorial", "lab", "project"]).optional(),
});

export type CourseSearchFormData = z.infer<typeof courseSearchSchema>;
