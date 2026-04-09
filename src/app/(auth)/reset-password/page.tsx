"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Listen for the PASSWORD_RECOVERY event from the hash fragment
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string) => {
        if (event === "PASSWORD_RECOVERY") {
          // User arrived via password reset link - session is set, show the form
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img src="/sims-logo.png" alt="Sims Workspace" className="mx-auto h-20 w-auto mb-5" />
          <h1 className="text-3xl font-bold tracking-tight">
            Sims <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">Workspace</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Set your new password</p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-50 border border-gray-200 backdrop-blur-xl shadow-2xl shadow-black/20">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

          <div className="p-8">
            {success ? (
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Password Updated!</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your password has been changed successfully. Redirecting to login...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-semibold">New Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className={`relative group rounded-xl border transition-all duration-300 ${
                    focused === "password"
                      ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}>
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      focused === "password" ? "text-emerald-600" : "text-gray-400"
                    }`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      required
                      minLength={6}
                      className="w-full bg-transparent pl-11 pr-11 py-3.5 text-sm outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className={`relative group rounded-xl border transition-all duration-300 ${
                    focused === "confirm"
                      ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}>
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      focused === "confirm" ? "text-emerald-600" : "text-gray-400"
                    }`} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused("confirm")}
                      onBlur={() => setFocused(null)}
                      required
                      className="w-full bg-transparent pl-11 pr-11 py-3.5 text-sm outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20 border-0 text-sm font-medium transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Sparkles className="h-3 w-3" />
              <span>Secure HR Management Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
