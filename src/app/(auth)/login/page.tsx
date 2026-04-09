"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Shield, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const supabase = createClient()

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail) return
    setResetLoading(true)
    setError("")

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setResetSent(true)
    }
    setResetLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }

      window.location.href = data.redirect || "/my-dashboard"
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-5 overflow-hidden">
            <img
              src="/sims-logo.png"
              alt="Sims Workspace"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sims <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">Workspace</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to manage your workforce</p>
        </div>

        {/* Login Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-50 border border-gray-200 backdrop-blur-xl shadow-2xl shadow-black/20">
          {/* Top gradient accent */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

          <div className="p-8">
            {forgotMode ? (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">Reset Password</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your email and we&apos;ll send a reset link
                  </p>
                </div>

                {resetSent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <Mail className="h-5 w-5 text-emerald-600 shrink-0" />
                      <p className="text-sm text-emerald-700">
                        Reset link sent! Check your email inbox.
                      </p>
                    </div>
                    <Button
                      onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(""); setError("") }}
                      variant="outline"
                      className="w-full h-12 rounded-xl"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email Address
                      </label>
                      <div className={`relative group rounded-xl border transition-all duration-300 ${
                        focused === "reset-email"
                          ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}>
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                          focused === "reset-email" ? "text-emerald-600" : "text-gray-400"
                        }`} />
                        <input
                          type="email"
                          placeholder="you@company.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          onFocus={() => setFocused("reset-email")}
                          onBlur={() => setFocused(null)}
                          required
                          className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm outline-none placeholder:text-gray-400"
                        />
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
                      disabled={resetLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20 border-0 text-sm font-medium transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 rounded-xl"
                    >
                      {resetLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      {resetLoading ? "Sending..." : "Send Reset Link"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => { setForgotMode(false); setError("") }}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Address
                </label>
                <div className={`relative group rounded-xl border transition-all duration-300 ${
                  focused === "email"
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}>
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    focused === "email" ? "text-emerald-600" : "text-gray-400"
                  }`} />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    required
                    className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError("") }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    required
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

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20 border-0 text-sm font-medium transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            )}
          </div>

          {/* Bottom section */}
          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Sparkles className="h-3 w-3" />
              <span>Secure HR Management Platform</span>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-300 mt-6">
          Sims Workspace &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
