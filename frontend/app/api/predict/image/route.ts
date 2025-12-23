import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// ==================== File Validation Config ====================
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/dicom",
    "application/octet-stream", // Some DICOM files use this
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ML_TIMEOUT_MS = 30000; // 30 seconds

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: { message: "Not authorized" } },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: { message: "No image file uploaded" } },
                { status: 400 }
            );
        }

        // ==================== Security: File Validation ====================
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: "Invalid file type",
                        allowed: ["JPEG", "PNG", "WebP", "DICOM"],
                    },
                },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: "File too large",
                        maxSize: "10MB",
                    },
                },
                { status: 400 }
            );
        }

        const mlFormData = new FormData();
        mlFormData.append("file", file);

        // Forward other fields like scan_type, explain
        for (const [key, value] of formData.entries()) {
            if (key !== "file") {
                mlFormData.append(key, value);
            }
        }

        // ==================== Performance: Request Timeout ====================
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

        try {
            const response = await fetch(`${ML_SERVICE_URL}/predict/image`, {
                method: "POST",
                body: mlFormData,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            message: "ML Service Image Analysis Failed",
                            details: errorData,
                        },
                    },
                    { status: response.status }
                );
            }

            const data = await response.json();
            // Return data directly to match frontend expectations
            return NextResponse.json(data);
        } catch (fetchError) {
            clearTimeout(timeout);
            const error = fetchError as Error;

            if (error.name === "AbortError") {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            message: "ML Service Timeout",
                            details: "Analysis took too long. Please try again.",
                        },
                    },
                    { status: 504 }
                );
            }

            throw fetchError;
        }
    } catch (error) {
        console.error("Error proxying image to ML service:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: "Failed to connect to ML service",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
            },
            { status: 500 }
        );
    }
}
