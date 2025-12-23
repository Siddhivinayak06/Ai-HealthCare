import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        // Returning mocked model accuracy data
        // In real system, this comes from validation sets or user feedback logs
        const data = [
            { model: "X-Ray Analysis", accuracy: 94.2, color: "#10b981" },
            { model: "CT Scan", accuracy: 89.5, color: "#3b82f6" },
            { model: "MRI Scan", accuracy: 91.8, color: "#8b5cf6" },
            { model: "Risk Prediction", accuracy: 87.4, color: "#f59e0b" },
            { model: "NLP Report", accuracy: 96.0, color: "#ec4899" },
        ];

        return NextResponse.json(data);
    } catch (error) {
        return authErrorResponse(error);
    }
}
