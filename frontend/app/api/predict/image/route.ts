import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scans, diagnoses } from "@/lib/schema";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// ==================== File Validation Config ====================
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/dicom",
    "application/octet-stream", // Some DICOM files use this
    "application/zip",
    "application/x-zip-compressed"
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ML_TIMEOUT_MS = 30000; // 30 seconds

export async function POST(req: NextRequest) {
    try {
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json(
                { success: false, error: { message: "Not authorized" } },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const patientId = formData.get("patientId") as string | null;
        const scanType = (formData.get("scan_type") as string) || "xray";

        if (!file) {
            return NextResponse.json(
                { success: false, error: { message: "No image file uploaded" } },
                { status: 400 }
            );
        }

        if (!patientId) {
            return NextResponse.json(
                { success: false, error: { message: "Patient ID is required" } },
                { status: 400 }
            );
        }

        // ==================== Security: File Validation ====================
        if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.endsWith(".zip")) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: "Invalid file type",
                        allowed: ["JPEG", "PNG", "WebP", "DICOM", "ZIP"],
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

        const isBatch = formData.get("is_batch") === "true" || file.name.endsWith(".zip");

        try {
            const endpoint = isBatch ? "batch" : "image";
            const response = await fetch(`${ML_SERVICE_URL}/predict/${endpoint}`, {
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

            // ==================== Persistence: Save to DB ====================
            // 1. Save Scan metadata
            const scanResult = await db.insert(scans).values({
                patientId: patientId,
                scanType: scanType,
                imageUrl: data.image_url || data.id, // ML service might return a relative path or ID
                uploadedBy: user.id,
            }).returning();

            const newScan = scanResult[0];

            // 2. Save Diagnosis
            const diagnosisResult = await db.insert(diagnoses).values({
                scanId: newScan.id,
                predictedCondition: data.diagnosis || "Unknown",
                confidenceScore: data.confidence?.toString() || "0",
                riskLevel: data.severity || "Low",
                explanation: {
                    findings: data.findings,
                    recommendations: data.recommendations,
                    explanation_text: data.explanation_text,
                    explanation_url: data.explanation_url,
                    confidence_metrics: data.confidence_metrics
                },
                modelVersion: data.modelVersion || "3.0.0",
            }).returning();

            const newDiagnosis = diagnosisResult[0];

            // Return enriched data
            return NextResponse.json({
                ...data,
                dbScanId: newScan.id,
                dbDiagnosisId: newDiagnosis.id
            });
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
