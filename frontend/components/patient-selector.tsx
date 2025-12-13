"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getPatients, searchPatients } from "@/app/actions/patients"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface PatientSelectorProps {
    onSelect: (patientId: string) => void
    label?: string
}

export function PatientSelector({ onSelect, label = "Select patient" }: PatientSelectorProps) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        // Initial load
        setLoading(true)
        getPatients().then((data) => {
            setPatients(data)
            setLoading(false)
        })
    }, [])

    // Debounce search could be added here for optimization if list is large
    // For now local filtering or simple search via CommandInput is fine for small lists
    // But let's create a robust search just in case
    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (term.length > 2) {
            setLoading(true)
            const results = await searchPatients(term)
            setPatients(results)
            setLoading(false)
        }
    }

    const selectedPatient = patients.find((patient) => patient.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                >
                    {value ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                    {(selectedPatient?.first_name?.[0] || 'Unknown')[0]}
                                </AvatarFallback>
                            </Avatar>
                            {selectedPatient?.first_name} {selectedPatient?.last_name}
                        </div>
                    ) : (
                        label
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-slate-900/95 backdrop-blur-xl border-white/10 text-slate-200">
                <Command className="bg-transparent">
                    <CommandInput
                        placeholder="Search patients..."
                        className="text-slate-200"
                        onValueChange={handleSearch}
                    />
                    <CommandList>
                        <CommandEmpty>No patient found.</CommandEmpty>
                        <CommandGroup heading="Patients">
                            {patients.map((patient) => (
                                <CommandItem
                                    key={patient.id}
                                    value={patient.id + " " + patient.first_name + " " + patient.last_name} // Search hack
                                    onSelect={(currentValue) => {
                                        const id = patients.find(p => p.id + " " + p.first_name + " " + p.last_name === currentValue)?.id
                                        if (id) {
                                            setValue(id === value ? "" : id)
                                            onSelect(id)
                                        }
                                        setOpen(false)
                                    }}
                                    className="aria-selected:bg-white/10 aria-selected:text-white"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === patient.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                        <span className="text-xs text-slate-500">{patient.email}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
