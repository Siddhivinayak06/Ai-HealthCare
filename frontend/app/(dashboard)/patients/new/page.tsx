"use client"

import { PatientForm } from "@/components/patient-form"
import { DashboardHeader } from "@/components/dashboard-header"
import { useRouter } from "next/navigation"

export default function NewPatientPage() {
    const router = useRouter()

    const handlePatientCreated = (id?: string) => {
        router.push(`/patients?selectedId=${id || ''}`)
        router.refresh()
    }

    return (
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
            <DashboardHeader
                title="Add New Patient"
                description="Create a new patient record"
                showActions={false}
            />
            <div className="max-w-2xl">
                <PatientForm
                    onAnalyze={() => { }} // Not analyzing here, just creating
                    isAnalyzing={false}
                    mode="create"
                    onSuccess={handlePatientCreated}
                />
            </div>
        </div>
    )
}
