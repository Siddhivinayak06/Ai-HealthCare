"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UsersIcon, RefreshIcon, LoaderIcon } from "@/components/icons"
import { createPatient, deletePatient } from "@/app/actions/patients"
import type { Patient } from "@/lib/db"

interface PatientsListProps {
  patients: Patient[]
  onSelectPatient: (patient: Patient) => void
  onRefresh: () => void
}

export function PatientsList({ patients, onSelectPatient, onRefresh }: PatientsListProps) {
  const [search, setSearch] = useState("")
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
  })

  const filteredPatients = patients.filter((p) => {
    const searchLower = search.toLowerCase()
    const firstName = p.firstName?.toLowerCase() || ""
    const lastName = p.lastName?.toLowerCase() || ""
    const email = p.email?.toLowerCase() || ""

    return firstName.includes(searchLower) || lastName.includes(searchLower) || email.includes(searchLower)
  })

  const handleAddPatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth) return

    setIsAddingPatient(true)
    const result = await createPatient(newPatient)
    setIsAddingPatient(false)

    if (result.success) {
      setIsDialogOpen(false)
      setNewPatient({ firstName: "", lastName: "", dateOfBirth: "", gender: "", email: "", phone: "" })
      onRefresh()
    }
  }

  const handleDeletePatient = async (id: string) => {
    if (confirm("Are you sure you want to delete this patient record?")) {
      await deletePatient(id)
      onRefresh()
    }
  }

  const calculateAge = (dob: Date | string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Patient Records</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 bg-background/50">
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                  <DialogDescription>Enter the patient's basic information to create a new record.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newPatient.firstName}
                        onChange={(e) => setNewPatient((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newPatient.lastName}
                        onChange={(e) => setNewPatient((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newPatient.dateOfBirth}
                        onChange={(e) => setNewPatient((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={newPatient.gender}
                        onValueChange={(v) => setNewPatient((p) => ({ ...p, gender: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient((p) => ({ ...p, email: e.target.value }))}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPatient} disabled={isAddingPatient}>
                    {isAddingPatient ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add Patient"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search patients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {patients.length === 0 ? "No patients registered yet" : "No patients match your search"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {patients.length === 0 ? 'Click "Add Patient" to create the first record' : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-muted/50 transition-colors ring-1 ring-border/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {p.firstName?.[0] || "?"}
                    {p.lastName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">
                      {p.firstName} {p.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {p.dateOfBirth ? calculateAge(p.dateOfBirth) : "N/A"} years old
                      </span>
                      {p.gender && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground capitalize">{p.gender}</span>
                        </>
                      )}
                      {p.email && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{p.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectPatient(p)}
                    className="bg-background/50"
                  >
                    Analyze Health
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePatient(p.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
