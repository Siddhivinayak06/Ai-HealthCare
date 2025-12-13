import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const cookieStore = await cookies()
        const token = cookieStore.get("medai_session")?.value

        const res = await fetch(`${API_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            return NextResponse.json({ message: "Failed to connect to AI service" }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error("Chat Proxy Error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
