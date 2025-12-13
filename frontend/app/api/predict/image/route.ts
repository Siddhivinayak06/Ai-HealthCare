import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        // Get session token for authentication
        const cookieStore = await cookies()
        const token = cookieStore.get("medai_session")?.value || ""

        if (!token) {
            return Response.json({ error: "Not authenticated" }, { status: 401 })
        }

        // Get form data from request
        const incomingFormData = await request.formData()
        const file = incomingFormData.get("file") as File | null
        const scanType = incomingFormData.get("scan_type") as string || "xray"

        if (!file) {
            return Response.json({ error: "No file provided" }, { status: 400 })
        }

        // Convert File to ArrayBuffer then to Blob for proper multipart handling
        const arrayBuffer = await file.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: file.type })

        // Create new FormData for ML service request
        const mlFormData = new FormData()
        mlFormData.append("file", blob, file.name)
        mlFormData.append("scan_type", scanType)

        // Forward directly to ML service
        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000"

        const response = await fetch(`${mlServiceUrl}/predict/image`, {
            method: "POST",
            body: mlFormData,
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("ML Service error:", errorText)
            return Response.json(
                { error: "Analysis failed", details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        return Response.json(data)
    } catch (error) {
        console.error("Image prediction error:", error)
        return Response.json(
            { error: "Failed to analyze image", details: String(error) },
            { status: 500 }
        )
    }
}
