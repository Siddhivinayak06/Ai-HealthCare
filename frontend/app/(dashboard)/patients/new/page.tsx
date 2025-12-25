import { PatientForm } from "@/components/patients/patient-form"

export default async function NewPatientPage() {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-background/50 overflow-hidden">
            {/* Shared Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-accent/10 via-accent/5 to-transparent rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

            <PatientForm />
        </div>
    )
}
