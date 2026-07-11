import { z } from "zod";

export const markAttendanceSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  date: z.string().min(1, "Date is required"),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["present", "absent", "late", "excused"]),
      notes: z.string().optional().or(z.literal("")),
    })
  ),
});

export type MarkAttendanceFormData = z.infer<typeof markAttendanceSchema>;

export const singleAttendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  courseId: z.string().min(1, "Course is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "late", "excused"], {
    required_error: "Status is required",
  }),
  notes: z.string().optional().or(z.literal("")),
});

export type SingleAttendanceFormData = z.infer<typeof singleAttendanceSchema>;

export const attendanceFilterSchema = z.object({
  courseId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["present", "absent", "late", "excused"]).optional(),
  studentId: z.string().optional(),
});

export type AttendanceFilterFormData = z.infer<typeof attendanceFilterSchema>;
