"use client"

import { useState } from "react"
import { BentoCard } from "@/components/bento-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/app/actions/profile"
import { LoaderIcon } from "@/components/icons"

export function SecuritySettings() {
    const [loading, setLoading] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match" })
            return
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters" })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const result = await changePassword({ currentPassword, newPassword })
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: "Password changed successfully" })
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to change password" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="health-card p-8">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground">Security Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage your password and protect your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm font-semibold text-foreground/80">Current Password</Label>
                    <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50 transition-all duration-300 input-enhanced"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-semibold text-foreground/80">New Password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50 transition-all duration-300 input-enhanced"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground/80">Confirm New Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
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
                        variant="outline"
                        className="h-12 px-8 rounded-xl font-bold border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                    >
                        {loading && <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />}
                        Update Password
                    </Button>
                </div>
            </form>
        </div >
    )
}
