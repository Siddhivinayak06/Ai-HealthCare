"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { getDoctorsList } from "@/app/actions/appointments"

type Doctor = {
    id: string
    name: string
    email: string
}

export function DoctorSelector({ onSelect }: { onSelect: (id: string) => void }) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [doctors, setDoctors] = useState<Doctor[]>([])

    useEffect(() => {
        async function fetchDoctors() {
            try {
                const data = await getDoctorsList()
                setDoctors(data)
            } catch (error) {
                console.error("Failed to fetch doctors", error)
            }
        }
        fetchDoctors()
    }, [])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? doctors.find((doctor) => doctor.id === value)?.name
                        : "Select doctor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search doctor..." />
                    <CommandList>
                        <CommandEmpty>No doctor found.</CommandEmpty>
                        <CommandGroup>
                            {doctors.map((doctor) => (
                                <CommandItem
                                    key={doctor.id}
                                    value={doctor.id}
                                    onSelect={(currentValue) => {
                                        setValue(doctor.id)
                                        onSelect(doctor.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === doctor.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{doctor.name}</span>
                                        <span className="text-xs text-muted-foreground">{doctor.email}</span>
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
