import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        // Get session token for authentication
        const cookieStore = await cookies()
        const token = cookieStore.get("medai_session")?.value || ""

        if (!token) {
            return Response.json({ error: "Not authenticated" }, { status: 401 })
        }

        // Get JSON data from request
        const data = await request.json()

        // Forward to backend ML service
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

        const response = await fetch(`${apiUrl}/predict/risk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Backend error:", errorText)
            return Response.json(
                { error: "Risk prediction failed" },
                { status: response.status }
            )
        }

        const result = await response.json()
        return Response.json(result)
    } catch (error) {
        console.error("Risk prediction error:", error)
        return Response.json(
            { error: "Failed to predict risk" },
            { status: 500 }
        )
    }
}
