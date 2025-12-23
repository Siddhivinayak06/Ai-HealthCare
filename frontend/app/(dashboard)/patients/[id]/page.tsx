import { getPatient, getPatientHealthRecords } from "@/app/actions/patients"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Phone, Mail, MapPin, Activity, Calendar, FileText } from "lucide-react"
import Link from "next/link"

export default async function PatientProfilePage({ params }: { params: { id: string } }) {
    const patient = await getPatient(params.id)
    const records = await getPatientHealthRecords(params.id)

    if (!patient) {
        notFound()
    }

    const formatDate = (date: string) => new Date(date).toLocaleDateString()

    return (
        <div className="container max-w-5xl py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {(patient as any).firstName || (patient as any).first_name} {(patient as any).lastName || (patient as any).last_name}
                        <Badge variant="outline" className="text-base font-normal">
                            {new Date().getFullYear() - new Date((patient as any).dateOfBirth || (patient as any).date_of_birth).getFullYear()} yrs
                        </Badge>
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-4 w-4" /> {patient.gender}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> DOB: {formatDate((patient as any).dateOfBirth || (patient as any).date_of_birth)}</span>
                        <span className="flex items-center gap-1"><Activity className="h-4 w-4" /> Blood: {(patient as any).bloodType || (patient as any).blood_type || "N/A"}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit Profile</Button>
                    <Button>Add Health Record</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Personal Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                    <p className="font-medium">Email</p>
                                    <p className="text-muted-foreground">{patient.email || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                    <p className="font-medium">Phone</p>
                                    <p className="text-muted-foreground">{patient.phone || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                    <p className="font-medium">Address</p>
                                    <p className="text-muted-foreground">{patient.address || "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Emergency Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm">
                                <p className="font-medium">{(patient as any).emergencyContactName || (patient as any).emergency_contact_name || "Not provided"}</p>
                                <p className="text-muted-foreground">{(patient as any).emergencyContactPhone || (patient as any).emergency_contact_phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Medical History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Conditions</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const conditionsRaw = (patient as any).medicalConditions || (patient as any).medical_conditions;
                                        const conditions = typeof conditionsRaw === 'string'
                                            ? conditionsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            : Array.isArray(conditionsRaw) ? conditionsRaw : [];

                                        return conditions.length > 0 ? (
                                            conditions.map((c: string, i: number) => (
                                                <Badge key={i} variant="secondary">{c}</Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">None recorded</p>
                                        );
                                    })()}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium mb-2">Allergies</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const allergiesRaw = (patient as any).allergies;
                                        const allergies = typeof allergiesRaw === 'string'
                                            ? allergiesRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            : Array.isArray(allergiesRaw) ? allergiesRaw : [];

                                        return allergies.length > 0 ? (
                                            allergies.map((a: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">{a}</Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">None recorded</p>
                                        );
                                    })()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Health Records */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Health Records</CardTitle>
                            <CardDescription>Recent vital signs and measurements</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {records.length > 0 ? (
                                <div className="space-y-4">
                                    {records.map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Activity className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{formatDate((record as any).recordDate || (record as any).record_date)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        BP: {(record as any).bloodPressureSystolic || (record as any).blood_pressure_systolic}/{(record as any).bloodPressureDiastolic || (record as any).blood_pressure_diastolic} | HR: {(record as any).heartRate || (record as any).heart_rate} | SpO2: {(record as any).oxygenSaturation || (record as any).oxygen_saturation}%
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`#`}>View Details</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No health records found</p>
                                    <Button variant="link" className="text-primary">Add first record</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
