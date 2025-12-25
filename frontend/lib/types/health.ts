export interface Patient {
    id: string
    userId: string
    firstName: string
    lastName: string
    age: number | null
    bloodType: string | null
    gender: string | null
    dateOfBirth: Date | null
    createdAt: Date | null
    updatedAt: Date | null
}

export interface HealthRecord {
    id: string
    patientId: string
    heartRate: number | null
    bloodPressureSystolic: number | null
    bloodPressureDiastolic: number | null
    temperatureCelsius: number | null
    weightKg: number | null
    heightCm: number | null
    recordDate: Date | null
    notes: string | null
    createdAt: Date | null
}

export interface AIInsight {
    id: string
    patientId: string
    patientName?: string
    condition: string
    riskScore: number
    confidence: number
    explanation?: string
    trend?: "improving" | "stable" | "worsening"
    contributingFactors?: string[]
    createdAt: Date | null
}

export enum RiskLevel {
    LOW = "Low",
    MODERATE = "Moderate",
    HIGH = "High"
}

export function getRiskLevel(score: number): RiskLevel {
    if (score > 70) return RiskLevel.HIGH
    if (score > 40) return RiskLevel.MODERATE
    return RiskLevel.LOW
}
