"use server"

import { db } from "@/lib/db"
import { patients, healthRecords } from "@/lib/schema"
import { eq, or, ilike, and, desc } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "./activity"
import type { Patient, HealthRecord } from "@/lib/db"

/**
 * Require a valid session and return the user.
 * Throws an error if not authenticated.
 */
async function requireUser() {
  const { user } = await getSession()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const user = await requireUser()

    let query = db.select().from(patients).$dynamic()

    // RBAC: Doctors see all patients, Patients only see themselves
    if (user.role === "patient") {
      query = query.where(eq(patients.userId, user.id))
    }

    const result = await query.orderBy(desc(patients.createdAt))

    console.log(`getPatients: found ${result.length} patients for user ${user.id} (role: ${user.role})`)
    return result as Patient[]
  } catch (error) {
    console.error("Error getting patients:", error)
    return []
  }
}

export async function getPatient(id: string): Promise<Patient | null> {
  try {
    const user = await requireUser()

    let query = db.select().from(patients).where(eq(patients.id, id)).$dynamic()

    // RBAC: Patients only see themselves
    if (user.role === "patient") {
      query = query.where(and(eq(patients.id, id), eq(patients.userId, user.id)))
    }

    const result = await query.limit(1)
    return (result[0] as Patient) || null
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
  allergies?: string[] | string
  medicalConditions?: string[] | string
  age?: number
  medicalHistory?: any
}): Promise<{ success: boolean; error?: string; patient?: Patient }> {
  try {
    const user = await requireUser()
    console.log("createPatient: user", user.id, "data", data)

    // Check if patient already exists for this user (if role is patient)
    if (user.role === "patient") {
      const existing = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, user.id));

      if (existing.length > 0) {
        return { success: false, error: "Patient profile already exists" }
      }
    }

    // Standardize array fields to strings for DB storage
    const allergiesStr = Array.isArray(data.allergies) ? data.allergies.join(", ") : data.allergies || ""
    const conditionsStr = Array.isArray(data.medicalConditions) ? data.medicalConditions.join(", ") : data.medicalConditions || ""

    const result = await db
      .insert(patients)
      .values({
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        bloodType: data.bloodType,
        allergies: allergiesStr,
        medicalConditions: conditionsStr,
        age: data.age,
        medicalHistory: data.medicalHistory,
      })
      .returning()

    const newPatient = result[0] as Patient

    await logActivity("New patient record created", "data", {
      patientId: newPatient.id,
      patientName: `${data.firstName} ${data.lastName}`,
    })

    revalidatePath("/dashboard")
    revalidatePath("/patients")
    return { success: true, patient: newPatient }
  } catch (error) {
    console.error("Error creating patient:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create patient" }
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
    allergies: string[] | string
    medicalConditions: string[] | string
    age: number
    medicalHistory: any
  }>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser()

    // Standardize array fields if present
    const updateData: any = { ...data }
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth)
    if (Array.isArray(data.allergies)) updateData.allergies = data.allergies.join(", ")
    if (Array.isArray(data.medicalConditions)) updateData.medicalConditions = data.medicalConditions.join(", ")

    await db
      .update(patients)
      .set(updateData)
      .where(and(eq(patients.id, id), eq(patients.userId, user.id)))

    await logActivity("Patient record updated", "data", { patientId: id })
    revalidatePath("/dashboard")
    revalidatePath("/patients")
    return { success: true }
  } catch (error) {
    console.error("Error updating patient:", error)
    return { success: false, error: "Failed to update patient" }
  }
}

export async function deletePatient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser()
    await db
      .delete(patients)
      .where(and(eq(patients.id, id), eq(patients.userId, user.id)))

    await logActivity("Patient record deleted", "data", { patientId: id })
    revalidatePath("/dashboard")
    revalidatePath("/patients")
    return { success: true }
  } catch (error) {
    console.error("Error deleting patient:", error)
    return { success: false, error: "Failed to delete patient" }
  }
}

export async function addHealthRecord(
  patientId: string,
  data: any
): Promise<{ success: boolean; error?: string; record?: HealthRecord }> {
  try {
    const user = await requireUser()

    const result = await db
      .insert(healthRecords)
      .values({
        patientId,
        recordedBy: user.id,
        ...data,
      })
      .returning()

    const newRecord = result[0] as HealthRecord

    await logActivity("Health record added", "data", { patientId, recordId: newRecord.id })
    revalidatePath("/dashboard")
    revalidatePath("/patients")
    return { success: true, record: newRecord }
  } catch (error) {
    console.error("Error adding health record:", error)
    return { success: false, error: "Failed to add health record" }
  }
}

export async function getPatientHealthRecords(patientId: string): Promise<HealthRecord[]> {
  try {
    const user = await requireUser()

    // RBAC: Verify patients can only access their own records
    if (user.role === "patient") {
      const patientRecord = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.userId, user.id)))
        .limit(1)

      if (patientRecord.length === 0) {
        console.log(`RBAC: Patient ${user.id} denied access to health records for patient ${patientId}`)
        return []
      }
    }

    const result = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.patientId, patientId))
      .orderBy(desc(healthRecords.recordDate))

    return result as HealthRecord[]
  } catch (error) {
    console.error("Error getting health records:", error)
    return []
  }
}

export async function searchPatients(query: string): Promise<Patient[]> {
  try {
    const user = await requireUser()

    let baseQuery = db
      .select()
      .from(patients)
      .$dynamic()

    // Build search condition
    const searchCondition = or(
      ilike(patients.firstName, `%${query}%`),
      ilike(patients.lastName, `%${query}%`),
      ilike(patients.email, `%${query}%`)
    )

    // RBAC: Patients only see themselves, doctors see all
    if (user.role === "patient") {
      baseQuery = baseQuery.where(and(eq(patients.userId, user.id), searchCondition))
    } else {
      baseQuery = baseQuery.where(searchCondition)
    }

    const result = await baseQuery
      .orderBy(desc(patients.createdAt))
      .limit(20)

    return result as Patient[]
  } catch (error) {
    console.error("Error searching patients:", error)
    return []
  }
}
