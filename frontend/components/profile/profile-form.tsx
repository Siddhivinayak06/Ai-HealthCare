"use client"

import { useState } from "react"
import { BentoCard } from "@/components/bento-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfile } from "@/app/actions/profile"
import { LoaderIcon } from "@/components/icons"
import { toast } from "sonner" // Assuming sonner is set up, or replace with console/alert

interface ProfileFormProps {
    user: {
        name: string | null
        email: string
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(user.name || "")
    const [email, setEmail] = useState(user.email || "")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const result = await updateUserProfile({ name, email })
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: "Profile updated successfully" })
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to update profile" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <BentoCard>
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">Personal Information</h3>
                <p className="text-sm text-muted-foreground mt-1">Update your personal details here.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </BentoCard>
    )
}
