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
        <BentoCard>
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">Security Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage your password and security.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading} variant="outline" className="border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                        {loading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                    </Button>
                </div>
            </form>
        </BentoCard>
    )
}
