import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const body = await req.json();

        const response = await fetch(`${ML_SERVICE_URL}/predict/risk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: "ML Service Risk Prediction Failed", details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error proxying risk prediction to ML service:", error);
        return NextResponse.json(
            { message: "Failed to connect to ML service", error: error.message },
            { status: 500 }
        );
    }
}
