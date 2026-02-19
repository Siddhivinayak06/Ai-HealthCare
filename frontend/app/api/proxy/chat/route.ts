import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const cookieStore = await cookies()
        const token = cookieStore.get("auth_token")?.value

        // Route to ML backend NLP endpoint
        const res = await fetch(`${ML_SERVICE_URL}/nlp/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify({ text: body.message || body.text || "" })
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            return NextResponse.json(
                { message: errorData.detail || "Failed to connect to AI service" },
                { status: res.status }
            )
        }

        const data = await res.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error("Chat Proxy Error:", error)
        return NextResponse.json({ message: "AI service is unavailable. Make sure the ML backend is running." }, { status: 503 })
    }
}
