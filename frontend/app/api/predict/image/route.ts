import { NextRequest, NextResponse } from "next/server";
import { requireAuth, encrypt } from "@/lib/auth";
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

        // ==================== Persistence: Cloudinary Upload ====================
        let cloudinaryUrl = "";
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadResult = await new Promise<any>((resolve, reject) => {
                // @ts-ignore
                import("@/lib/cloudinary").then((mod) => {
                    mod.default.uploader.upload_stream(
                        { folder: "ai-healthcare/scans", resource_type: "auto" },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(buffer);
                });
            });
            cloudinaryUrl = uploadResult.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            // Verify if we should abort or continue with temporary ID
            // For now, we continue but log error
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

            // Mint a short-lived JWT for the ML backend using the shared secret
            const mlToken = await encrypt({ sub: user.id, role: user.role });

            const response = await fetch(`${ML_SERVICE_URL}/predict/${endpoint}`, {
                method: "POST",
                body: mlFormData,
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${mlToken}`,
                },
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

            // ==================== Persistence: Save to DB (Optional) ====================
            let dbIds = {};
            if (patientId && patientId !== "undefined") {
                try {
                    // 1. Save Scan metadata
                    const scanResult = await db.insert(scans).values({
                        patientId: patientId,
                        scanType: scanType,
                        imageUrl: cloudinaryUrl || data.image_url || "pending_upload",
                        uploadedBy: user.id,
                    }).returning();

                    const newScan = scanResult[0];

                    // 2. Save Diagnosis
                    const diagnosisResult = await db.insert(diagnoses).values({
                        scanId: newScan.id,
                        predictedCondition: data.diagnosis || data.prediction || "Unknown",
                        confidenceScore: (data.confidence || 0).toString(),
                        riskLevel: data.severity || "Low",
                        explanation: {
                            findings: data.findings,
                            recommendations: data.recommendations,
                            explanation_text: data.explanation_text,
                            explanation_url: data.explanation_url,
                            confidence_metrics: data.confidence_metrics
                        },
                        modelVersion: data.model_info?.architecture || "DenseNet121",
                    }).returning();

                    const newDiagnosis = diagnosisResult[0];



                    dbIds = {
                        dbScanId: newScan.id,
                        dbDiagnosisId: newDiagnosis.id
                    };
                } catch (dbError) {
                    console.error("Failed to auto-save scan to DB:", dbError);
                    // Don't fail the whole request if DB save fails
                }
            }

            // Return enriched data
            return NextResponse.json({
                ...data,
                ...dbIds,
                file_url: cloudinaryUrl // Explicitly return the CLoudinary URL
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
