"use server"

import type { Patient, HealthRecord } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper to get raw token for Authorization header
import { cookies } from "next/headers"
async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get("medai_session")?.value || ""
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const res = await fetch(`${API_URL}/patients`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting patients:", error)
    return []
  }
}

export async function getPatient(id: string): Promise<Patient | null> {
  try {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("Error getting patient:", error)
    return null
  }
}

export async function createPatient(data: {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender?: string
  email?: string
  phone?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bloodType?: string
  allergies?: string[]
  medicalConditions?: string[]
}): Promise<{ success: boolean; error?: string; patient?: Patient }> {
  try {
    console.log("Server Action createPatient received:", JSON.stringify(data, null, 2))
    const res = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    if (!res.ok) {
      return { success: false, error: result.message || "Failed to create patient" }
    }

    await logActivity("New patient record created", "data", {
      patientId: result.id,
      patientName: `${data.firstName} ${data.lastName}`,
    })

    revalidatePath("/patients")
    return { success: true, patient: result }
  } catch (error) {
    console.error("Error creating patient:", error)
    return { success: false, error: "Network error" }
  }
}

export async function updatePatient(
  id: string,
  data: Partial<{
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    email: string
    phone: string
    address: string
    emergencyContactName: string
    emergencyContactPhone: string
    bloodType: string
    allergies: string[]
    medicalConditions: string[]
  }>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const result = await res.json()
      return { success: false, error: result.message || "Failed to update patient" }
    }

    await logActivity("Patient record updated", "data", { patientId: id })
    revalidatePath("/patients")
    return { success: true }
  } catch (error) {
    console.error("Error updating patient:", error)
    return { success: false, error: "Network error" }
  }
}

export async function deletePatient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
    })

    if (!res.ok) {
      return { success: false, error: "Failed to delete patient" }
    }

    await logActivity("Patient record deleted", "data", { patientId: id })
    revalidatePath("/patients")
    return { success: true }
  } catch (error) {
    console.error("Error deleting patient:", error)
    return { success: false, error: "Network error" }
  }
}

export async function addHealthRecord(
  patientId: string,
  data: {
    weightKg?: number
    heightCm?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    heartRate?: number
    temperatureCelsius?: number
    oxygenSaturation?: number
    bloodSugar?: number
    cholesterolTotal?: number
    cholesterolHdl?: number
    cholesterolLdl?: number
    smokingStatus?: string
    alcoholConsumption?: string
    exerciseFrequency?: string
    notes?: string
  },
): Promise<{ success: boolean; error?: string; record?: HealthRecord }> {
  try {
    const res = await fetch(`${API_URL}/patients/${patientId}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    if (!res.ok) {
      return { success: false, error: result.message || "Failed to add health record" }
    }

    await logActivity("Health record added", "data", { patientId, recordId: result.id })
    revalidatePath("/patients")
    return { success: true, record: result }
  } catch (error) {
    console.error("Error adding health record:", error)
    return { success: false, error: "Network error" }
  }
}

export async function getPatientHealthRecords(patientId: string): Promise<HealthRecord[]> {
  try {
    const res = await fetch(`${API_URL}/patients/${patientId}/records`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error getting health records:", error)
    return []
  }
}

export async function searchPatients(query: string): Promise<Patient[]> {
  try {
    const res = await fetch(`${API_URL}/patients?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${await getSessionToken()}`,
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Error searching patients:", error)
    return []
  }
}

