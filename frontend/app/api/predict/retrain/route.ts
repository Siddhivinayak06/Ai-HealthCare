import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("auth_token")?.value

        // Ideally check for admin/doctor role here, but we rely on token + frontend gating for this demo
        if (!token) {
            return Response.json({ error: "Not authenticated" }, { status: 401 })
        }

        const body = await request.json()
        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000"

        const response = await fetch(`${mlServiceUrl}/retrain`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return Response.json(
                { error: "Retraining trigger failed", details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        return Response.json(data)

    } catch (error) {
        return Response.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        )
    }
}
