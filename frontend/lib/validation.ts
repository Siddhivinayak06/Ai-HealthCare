import { z } from "zod";

/**
 * Input validation schemas for healthcare application.
 * Use Zod for runtime validation of user input.
 */

// ==================== Auth Schemas ====================
export const emailSchema = z
    .string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[0-9]/, "Password must contain a number");

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password required"),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(1, "Name required").max(100, "Name too long"),
});

// ==================== Patient Schemas ====================
export const patientSchema = z.object({
    firstName: z.string().min(1, "First name required").max(100),
    lastName: z.string().min(1, "Last name required").max(100),
    email: emailSchema.optional(),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
    address: z.string().max(500).optional(),
    emergencyContactName: z.string().max(100).optional(),
    emergencyContactPhone: z.string().max(20).optional(),
    allergies: z.string().max(1000).optional(),
    medicalConditions: z.string().max(1000).optional(),
});

// ==================== Health Record Schemas ====================
export const healthRecordSchema = z.object({
    weightKg: z.number().positive().max(500).optional(),
    heightCm: z.number().positive().max(300).optional(),
    bloodPressureSystolic: z.number().int().positive().max(300).optional(),
    bloodPressureDiastolic: z.number().int().positive().max(200).optional(),
    heartRate: z.number().int().positive().max(300).optional(),
    temperatureCelsius: z.number().min(30).max(45).optional(),
    oxygenSaturation: z.number().int().min(0).max(100).optional(),
    bloodSugar: z.number().int().positive().max(1000).optional(),
    notes: z.string().max(2000).optional(),
});

// ==================== File Upload Schemas ====================
export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/dicom",
    "application/octet-stream",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, DICOM`,
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`,
        };
    }

    return { valid: true };
}

// ==================== Helper ====================
/**
 * Parse and validate input, returning formatted errors
 */
export function parseOrError<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "root";
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
    }

    return { success: false, errors };
}
