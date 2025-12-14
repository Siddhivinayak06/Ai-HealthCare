"use client"

import { useState } from "react"
import { resetPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { LoaderIcon, CheckCircleIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        const formData = new FormData(e.currentTarget)
        const result = await resetPassword(formData)

        setIsSubmitting(false)
        if (result.success) {
            setSuccess(true)
        } else {
            setError(result.error || "Something went wrong")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 relative z-10">
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>Enter your email to receive a password reset link</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                                <CheckCircleIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold">Check your email</h3>
                            <p className="text-muted-foreground text-sm">
                                We have sent a password reset link to your email address.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input required type="email" name="email" id="email" placeholder="Enter your registered email" />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/50 pt-6">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" />
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
