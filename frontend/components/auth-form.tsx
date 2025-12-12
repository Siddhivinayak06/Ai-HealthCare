"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HeartPulseIcon, LoaderIcon, AlertCircleIcon } from "@/components/icons"
import { signIn, signUp } from "@/app/actions/auth"

type AuthFormProps = {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLogin = mode === "login"

  async function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result = isLogin ? await signIn(formData) : await signUp(formData)

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30">
              <HeartPulseIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">MedAI Diagnostics</h1>
          <p className="text-sm text-muted-foreground font-medium">AI-Powered Healthcare Analysis</p>
        </div>

        {/* Form Card - Bento styled */}
        <div className="bento-card p-8">
          <div className="space-y-2 text-center mb-8">
            <h2 className="text-2xl font-bold text-card-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Enter your credentials to access your account" : "Enter your details to get started"}
            </p>
          </div>

          <form action={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium text-card-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Dr. John Smith"
                    disabled={isPending}
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-medium text-card-foreground">I am a...</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="radio"
                        id="role-patient"
                        name="role"
                        value="patient"
                        className="peer sr-only"
                        defaultChecked
                      />
                      <Label
                        htmlFor="role-patient"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary/5 cursor-pointer transition-all"
                      >
                        <span className="text-xl mb-1">👤</span>
                        <span className="font-semibold">Patient</span>
                      </Label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="role-doctor"
                        name="role"
                        value="doctor"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="role-doctor"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary/5 cursor-pointer transition-all"
                      >
                        <span className="text-xl mb-1">👨‍⚕️</span>
                        <span className="font-semibold">Doctor</span>
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-card-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={isLogin ? "user@example.com" : "john@example.com"}
                required
                disabled={isPending}
                className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium text-card-foreground">
                  Password
                </Label>
                {isLogin && (
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isPending}
                className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
              />
              {!isLogin && <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 font-semibold text-base transition-all duration-200"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-primary hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground font-medium">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground font-medium">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
