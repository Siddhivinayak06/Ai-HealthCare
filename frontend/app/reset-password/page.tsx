"use client"

import { useState, Suspense } from "react"
import { updatePassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { LoaderIcon, CheckCircleIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!token) {
        return (
            <div className="text-center py-6">
                <p className="text-destructive mb-4">Invalid or missing reset token.</p>
                <Button variant="outline" onClick={() => router.push('/forgot-password')}>
                    Request new link
                </Button>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        const formData = new FormData(e.currentTarget)
        formData.append("token", token)
        const result = await updatePassword(formData)

        setIsSubmitting(false)
        if (result.success) {
            setSuccess(true)
        } else {
            setError(result.error || "Something went wrong")
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircleIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Password Reset Successful</h3>
                <p className="text-muted-foreground text-sm">
                    Your password has been successfully updated.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/login">Return to Login</Link>
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input required type="password" name="password" id="password" minLength={8} placeholder="At least 8 characters" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input required type="password" name="confirmPassword" id="confirmPassword" minLength={8} placeholder="Confirm new password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                    </>
                ) : (
                    "Update Password"
                )}
            </Button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 relative z-10">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter a new password for your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-4"><LoaderIcon className="animate-spin" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
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
