// Direct DB connection removed in favor of Backend API
// import { neon } from "@neondatabase/serverless"
// export const sql = neon(process.env.DATABASE_URL!)

export type User = {
  id: string
  email: string
  password_hash: string
  name: string | null
  role: string
  created_at: Date
  updated_at: Date
}

export type Session = {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

export type Patient = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  date_of_birth: Date
  gender: string | null
  email: string | null
  phone: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  blood_type: string | null
  allergies: string[] | null
  medical_conditions: string[] | null
  created_at: Date
  updated_at: Date
}

export type HealthRecord = {
  id: string
  patient_id: string
  recorded_by: string
  record_date: Date
  weight_kg: number | null
  height_cm: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  heart_rate: number | null
  temperature_celsius: number | null
  oxygen_saturation: number | null
  blood_sugar: number | null
  cholesterol_total: number | null
  cholesterol_hdl: number | null
  cholesterol_ldl: number | null
  smoking_status: string | null
  alcohol_consumption: string | null
  exercise_frequency: string | null
  notes: string | null
  created_at: Date
}

export type ImageAnalysis = {
  id: string
  patient_id: string | null
  user_id: string
  scan_type: string
  image_url: string | null
  diagnosis: string | null
  confidence: number | null
  severity: string | null
  findings: object | null
  recommendations: string[] | null
  processing_time: number | null
  model_version: string | null
  status: string
  created_at: Date
}

export type RiskPrediction = {
  id: string
  patient_id: string
  user_id: string
  health_record_id: string | null
  condition: string
  risk_score: number
  severity: string | null
  contributing_factors: string[] | null
  recommendations: string[] | null
  model_version: string | null
  created_at: Date
}

export type Report = {
  id: string
  user_id: string
  patient_id: string | null
  title: string
  report_type: string
  content: object | null
  status: string
  file_size: string | null
  created_at: Date
}

export type ActivityLog = {
  id: string
  user_id: string
  action: string
  action_type: string
  details: object | null
  ip_address: string | null
  created_at: Date
}

export type UserSettings = {
  id: string
  user_id: string
  notifications_enabled: boolean
  email_alerts: boolean
  dark_mode: boolean
  language: string
  timezone: string
  default_scan_type: string | null
  created_at: Date
  updated_at: Date
}
