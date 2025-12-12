import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const patientData = await request.json()

    const prompt = `You are an AI health prediction assistant. Based on the following patient data, provide comprehensive health risk predictions.

Patient Data:
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- BMI: ${(patientData.weight / Math.pow(patientData.height / 100, 2)).toFixed(1)}
- Blood Pressure: ${patientData.bloodPressureSystolic}/${patientData.bloodPressureDiastolic} mmHg
- Heart Rate: ${patientData.heartRate} bpm
- Blood Sugar: ${patientData.bloodSugar} mg/dL
- Total Cholesterol: ${patientData.cholesterolTotal} mg/dL
- HDL Cholesterol: ${patientData.cholesterolHDL} mg/dL
- LDL Cholesterol: ${patientData.cholesterolLDL} mg/dL
- Smoking Status: ${patientData.smokingStatus}
- Alcohol Consumption: ${patientData.alcoholConsumption}
- Exercise Frequency: ${patientData.exerciseFrequency}
- Family History: ${patientData.familyHistory.join(", ") || "None reported"}
- Current Symptoms: ${patientData.currentSymptoms || "None reported"}
- Current Medications: ${patientData.medications || "None reported"}

Provide risk predictions for these conditions in JSON format:
{
  "predictions": [
    {
      "condition": "Cardiovascular Disease",
      "risk": 0-100 (number),
      "severity": "low" | "moderate" | "high" | "critical",
      "factors": ["Factor 1", "Factor 2"],
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    },
    {
      "condition": "Type 2 Diabetes",
      "risk": 0-100 (number),
      "severity": "low" | "moderate" | "high" | "critical",
      "factors": ["Factor 1"],
      "recommendations": ["Recommendation 1"]
    },
    {
      "condition": "Stroke",
      "risk": 0-100 (number),
      "severity": "low" | "moderate" | "high" | "critical",
      "factors": ["Factor 1"],
      "recommendations": ["Recommendation 1"]
    }
  ],
  "overallHealthScore": 0-100 (number, higher is healthier),
  "summary": "Brief overall health assessment"
}

Base risk calculations on established medical guidelines (Framingham, AHA, etc.). Be realistic and medically accurate.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const predictions = JSON.parse(jsonMatch[0])
      return Response.json({
        success: true,
        predictions,
      })
    }

    return Response.json({
      success: false,
      error: "Failed to parse predictions",
    })
  } catch (error) {
    console.error("Health prediction error:", error)
    return Response.json(
      {
        success: false,
        error: "Prediction failed",
      },
      { status: 500 },
    )
  }
}
