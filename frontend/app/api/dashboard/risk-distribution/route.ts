import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        // Returning mocked monthly risk distribution data
        // Ideally this would aggregate `riskPredictions` by month and severity
        const data = [
            { month: "Jan", low: 10, moderate: 5, high: 2, critical: 1 },
            { month: "Feb", low: 12, moderate: 4, high: 3, critical: 0 },
            { month: "Mar", low: 15, moderate: 6, high: 2, critical: 1 },
            { month: "Apr", low: 8, moderate: 7, high: 4, critical: 2 },
            { month: "May", low: 14, moderate: 5, high: 1, critical: 0 },
            { month: "Jun", low: 11, moderate: 4, high: 2, critical: 1 },
        ];

        return NextResponse.json(data);
    } catch (error) {
        return authErrorResponse(error);
    }
}
