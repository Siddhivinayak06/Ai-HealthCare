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
        <div className="health-card p-8">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground">Personal Information</h3>
                <p className="text-sm text-muted-foreground mt-1">Update your account details and profile information.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-foreground/80">Full Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50 transition-all duration-300 input-enhanced"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50 transition-all duration-300 input-enhanced"
                    />
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                        <div className={`h-2 w-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-8 btn-gradient rounded-xl font-bold"
                    >
                        {loading ? (
                            <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
