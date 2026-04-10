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
  const [sessionReady, setSessionReady] = useState(false)
  const [initError, setInitError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  // On mount: exchange the recovery code (PKCE flow) for a session,
  // or rely on the hash fragment (legacy flow). Either way, confirm a
  // recovery session exists before allowing the user to type a new password.
  useEffect(() => {
    let cancelled = false

    async function initRecoverySession() {
      if (typeof window === "undefined") return

      const url = new URL(window.location.href)
      const code = url.searchParams.get("code")

      // PKCE flow: exchange the code for a session
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (exchangeError) {
          setInitError("This reset link is invalid or has expired. Please request a new one.")
          return
        }
        // Clean up the URL so the code can't be reused
        window.history.replaceState({}, "", "/reset-password")
        setSessionReady(true)
        return
      }

      // Legacy hash flow: session is set automatically by the Supabase client
      // when it parses access_token / refresh_token from the URL fragment.
      // Confirm we actually have a session before enabling the form.
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) {
        setSessionReady(true)
      } else {
        setInitError("No active recovery session. Please click the reset link from your email again.")
      }
    }

    initRecoverySession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setSessionReady(true)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!sessionReady) {
      setError("Recovery session not ready. Please wait a moment or click the reset link again.")
      return
    }

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
      // Sign out the temporary recovery session so the user must log in
      // with their new password.
      await supabase.auth.signOut()
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
            {initError ? (
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Link Invalid or Expired</h2>
                  <p className="text-sm text-gray-500 mt-2">{initError}</p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 border-0 rounded-xl"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : success ? (
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
            ) : !sessionReady ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm text-gray-500">Verifying your reset link...</p>
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
