"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon, LoaderIcon, XIcon } from "@/components/icons"
import { PlusIcon } from "lucide-react"
import type { Patient } from "@/lib/db"
import { createPatient } from "@/app/actions/patients"

export interface PatientData {
  firstName?: string // Optional for analysis, required for create in UI
  lastName?: string
  age: number
  gender: string
  weight: number
  height: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  bloodSugar: number
  cholesterolTotal: number
  cholesterolHDL: number
  cholesterolLDL: number
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
  familyHistory: string[]
  currentSymptoms: string
  medications: string
}

interface PatientFormProps {
  onAnalyze?: (data: PatientData) => void
  isAnalyzing?: boolean
  selectedPatient?: Patient | null
  onClearPatient?: () => void
  mode?: "analyze" | "create"
  onSuccess?: (id?: string) => void
}

export function PatientForm({
  onAnalyze,
  isAnalyzing = false,
  selectedPatient,
  onClearPatient,
  mode = "analyze",
  onSuccess
}: PatientFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    age: 45,
    gender: "",
    weight: 70,
    height: 170,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    bloodSugar: 100,
    cholesterolTotal: 200,
    cholesterolHDL: 50,
    cholesterolLDL: 130,
    smokingStatus: "",
    alcoholConsumption: "",
    exerciseFrequency: "",
    familyHistory: [],
    currentSymptoms: "",
    medications: "",
  })

  useEffect(() => {
    if (selectedPatient) {
      const birthDate = new Date(selectedPatient.dateOfBirth || new Date())
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      setFormData((prev) => ({
        ...prev,
        age,
        gender: selectedPatient.gender || "",
      }))
    }
  }, [selectedPatient])

  const handleInputChange = (field: keyof PatientData, value: any) => {
    // If it's a numeric field and the value is empty, treat as undefined or null to show 0 or empty in UI
    // but the state Expects a number. We'll handle the parsing here to be safe.
    const numericFields: (keyof PatientData)[] = [
      "age", "weight", "height", "bloodPressureSystolic", "bloodPressureDiastolic",
      "heartRate", "bloodSugar", "cholesterolTotal", "cholesterolHDL", "cholesterolLDL"
    ]

    let finalValue = value
    if (numericFields.includes(field)) {
      if (value === "" || value === null || value === undefined) {
        finalValue = 0 // Default to 0 instead of NaN
      } else if (typeof value === "string") {
        finalValue = Number.parseInt(value) || 0
      }
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleFamilyHistoryChange = (condition: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      familyHistory: checked ? [...prev.familyHistory, condition] : prev.familyHistory.filter((c) => c !== condition),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "create") {
      setIsSaving(true)
      try {
        // Use dummy data for required fields not in this form
        // In a real app, we'd have a full registration form
        const birthYear = new Date().getFullYear() - formData.age

        const result = await createPatient({
          firstName: formData.firstName || "New",
          lastName: formData.lastName || "Patient",
          dateOfBirth: `${birthYear}-01-01`,
          gender: formData.gender,
          email: `patient-${Date.now()}@example.com`,
          phone: "",
          address: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          bloodType: "Unknown",
          allergies: [],
          medicalConditions: formData.familyHistory.length > 0 ? formData.familyHistory : [],
        })

        if (result.success && result.patient) {
          if (onSuccess) onSuccess(result.patient.id)
        } else {
          console.error(result.error)
        }
      } catch (err) {
        console.error("Failed to create patient:", err)
      } finally {
        setIsSaving(false)
      }
    } else {
      if (onAnalyze) onAnalyze(formData)
    }
  }

  const familyConditions = ["Heart Disease", "Diabetes", "Hypertension", "Cancer", "Stroke", "Alzheimer's"]

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">
              {mode === "create" ? "New Patient Profile" : "Patient Health Data"}
            </CardTitle>
            {selectedPatient && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-xs text-muted-foreground">Patient ID: {selectedPatient.id.slice(0, 8)}...</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={onClearPatient} className="h-6 w-6 p-0">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-medium text-card-foreground mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mode === "create" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="bg-background/50"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="bg-background/50"
                      placeholder="Doe"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", Number.parseInt(e.target.value))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", Number.parseInt(e.target.value))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", Number.parseInt(e.target.value))}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div>
            <h4 className="text-sm font-medium text-card-foreground mb-4">Vital Signs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bpSystolic">BP Systolic (mmHg)</Label>
                <Input
                  id="bpSystolic"
                  type="number"
                  value={formData.bloodPressureSystolic === 0 ? "" : formData.bloodPressureSystolic}
                  onChange={(e) => handleInputChange("bloodPressureSystolic", e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bpDiastolic">BP Diastolic (mmHg)</Label>
                <Input
                  id="bpDiastolic"
                  type="number"
                  value={formData.bloodPressureDiastolic === 0 ? "" : formData.bloodPressureDiastolic}
                  onChange={(e) => handleInputChange("bloodPressureDiastolic", e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.heartRate === 0 ? "" : formData.heartRate}
                  onChange={(e) => handleInputChange("heartRate", e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodSugar">Blood Sugar (mg/dL)</Label>
                <Input
                  id="bloodSugar"
                  type="number"
                  value={formData.bloodSugar === 0 ? "" : formData.bloodSugar}
                  onChange={(e) => handleInputChange("bloodSugar", e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Cholesterol */}
          <div>
            <h4 className="text-sm font-medium text-card-foreground mb-4">Cholesterol Levels</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cholTotal">Total (mg/dL)</Label>
                <Input
                  id="cholTotal"
                  type="number"
                  value={formData.cholesterolTotal === 0 ? "" : formData.cholesterolTotal}
                  onChange={(e) => handleInputChange("cholesterolTotal", e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cholHDL">HDL (mg/dL)</Label>
                <Input
                  id="cholHDL"
                  type="number"
                  value={formData.cholesterolHDL === 0 ? "" : formData.cholesterolHDL}
                  onChange={(e) => handleInputChange("cholesterolHDL", e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cholLDL">LDL (mg/dL)</Label>
                <Input
                  id="cholLDL"
                  type="number"
                  value={formData.cholesterolLDL === 0 ? "" : formData.cholesterolLDL}
                  onChange={(e) => handleInputChange("cholesterolLDL", e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div>
            <h4 className="text-sm font-medium text-card-foreground mb-4">Lifestyle Factors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Smoking Status</Label>
                <Select value={formData.smokingStatus} onValueChange={(v) => handleInputChange("smokingStatus", v)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="former">Former Smoker</SelectItem>
                    <SelectItem value="current">Current Smoker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcohol Consumption</Label>
                <Select
                  value={formData.alcoholConsumption}
                  onValueChange={(v) => handleInputChange("alcoholConsumption", v)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exercise Frequency</Label>
                <Select
                  value={formData.exerciseFrequency}
                  onValueChange={(v) => handleInputChange("exerciseFrequency", v)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-4 days/week)</SelectItem>
                    <SelectItem value="active">Active (5+ days/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Family History */}
          <div>
            <h4 className="text-sm font-medium text-card-foreground mb-4">Family Medical History</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {familyConditions.map((condition) => (
                <label
                  key={condition}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.familyHistory.includes(condition)}
                    onChange={(e) => handleFamilyHistoryChange(condition, e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-card-foreground">{condition}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Symptoms & Medications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symptoms">Current Symptoms</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe any current symptoms..."
                value={formData.currentSymptoms}
                onChange={(e) => handleInputChange("currentSymptoms", e.target.value)}
                className="bg-background/50 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                placeholder="List current medications..."
                value={formData.medications}
                onChange={(e) => handleInputChange("medications", e.target.value)}
                className="bg-background/50 min-h-[100px]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            disabled={isAnalyzing || isSaving || !formData.gender}
          >
            {mode === "create" ? (
              isSaving ? (
                <>
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Creating Patient...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Create Patient Profile
                </>
              )
            ) : (
              isAnalyzing ? (
                <>
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Predict Health Conditions
                </>
              )
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
