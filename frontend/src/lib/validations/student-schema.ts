import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  nationalId: z
    .string()
    .length(14, "National ID must be exactly 14 digits")
    .regex(/^\d+$/, "National ID must contain only numbers"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], { required_error: "Gender is required" }),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  department: z.string().min(1, "Department is required"),
  level: z.number().min(1).max(5),
  semester: z.number().min(1).max(10),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export const studentUpdateSchema = studentSchema.partial();
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;

export const studentSearchSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  level: z.coerce.number().optional(),
  enrollmentStatus: z.enum(["enrolled", "suspended", "graduated", "withdrawn"]).optional(),
  academicYear: z.string().optional(),
});

export type StudentSearchFormData = z.infer<typeof studentSearchSchema>;
