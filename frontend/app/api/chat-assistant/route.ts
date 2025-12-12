import { streamText } from "ai"

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: `You are MedAI Assistant, a helpful AI assistant for healthcare professionals using the MedAI Diagnostics platform. 

Your capabilities include:
- Explaining medical imaging analysis results
- Interpreting health risk predictions
- Providing general medical information
- Suggesting follow-up actions based on diagnostic results
- Answering questions about the platform's features

Important guidelines:
- Always clarify that AI predictions should be verified by qualified healthcare professionals
- Do not provide specific medical diagnoses or treatment recommendations
- Encourage users to consult with specialists for complex cases
- Be empathetic and professional in your responses
- Keep responses concise and actionable`,
      messages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Chat assistant error:", error)
    return Response.json({ error: "Assistant unavailable" }, { status: 500 })
  }
}
