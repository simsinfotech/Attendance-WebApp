"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { GlassCard } from "@/components/shared/glass-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Shield, User, Eye, EyeOff, Clock, Camera, Trash2, Upload, X, ImagePlus, Mail, Briefcase, Building2, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { OFFICE_TIMINGS } from "@/lib/config"

export default function SettingsPage() {
  const { employee, user, refreshUser } = useUser()
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!employee?.org_id) return
    supabase
      .from("fs_organizations")
      .select("name")
      .eq("id", employee.org_id)
      .single()
      .then(({ data }: { data: { name: string } | null }) => {
        if (data) setOrgName(data.name)
      })
  }, [employee?.org_id])

  const initials = employee?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/employees/avatar", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Upload failed")
      } else {
        toast.success("Profile photo updated!")
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        await refreshUser()
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setUploading(false)
    }
  }

  async function handleRemovePhoto() {
    setUploading(true)
    try {
      const res = await fetch("/api/employees/avatar", { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to remove photo")
      } else {
        toast.success("Profile photo removed")
        await refreshUser()
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setUploading(false)
    }
  }

  function cancelPreview() {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    try {
      const result = await Promise.race([
        supabase.auth.updateUser({ password: newPassword }),
        new Promise<{ error: { message: string } }>((_, reject) =>
          setTimeout(() => reject({ error: { message: "Request timed out. Please try again." } }), 10000)
        ),
      ])
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Password updated!")
        setNewPassword("")
      }
    } catch (err: any) {
      toast.error(err?.error?.message ?? "Request timed out. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Account settings" />

      {/* Profile Hero Card */}
      <GlassCard className="overflow-hidden p-0">
        {/* Banner gradient */}
        <div className={`h-28 sm:h-36 bg-gradient-to-br ${employee?.is_admin ? "from-indigo-500 via-blue-500 to-indigo-600" : "from-emerald-500 via-green-500 to-emerald-600"} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute top-4 right-6 hidden sm:block">
            <img src="/sims-logo.png" alt="" className="h-10 w-auto opacity-20" />
          </div>
        </div>

        {/* Avatar & info section */}
        <div className="px-5 sm:px-8 pb-6">
          {/* Avatar overlapping banner */}
          <div className="-mt-12 sm:-mt-16 mb-5">
            <div className="relative group shrink-0 inline-block">
              <div className={`rounded-full p-1 bg-white shadow-xl ${employee?.is_admin ? "ring-4 ring-indigo-100" : "ring-4 ring-emerald-100"}`}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden focus:outline-none cursor-pointer"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : employee?.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white ${employee?.is_admin ? "bg-gradient-to-br from-indigo-500 to-blue-600" : "bg-gradient-to-br from-emerald-500 to-green-600"}`}>
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-0.5">
                      <Camera className="h-5 w-5 text-white" />
                      <span className="text-[10px] text-white font-medium">Change</span>
                    </div>
                  </div>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Name & role */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{employee?.full_name}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${employee?.is_admin ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200" : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"}`}>
                  <Shield className="h-3.5 w-3.5" />
                  {employee?.is_admin ? "Admin" : "Employee"}
                </span>
              </div>
              <p className="text-base text-muted-foreground mt-1">{employee?.designation}{employee?.department ? ` \u00B7 ${employee.department}` : ""}</p>
              {employee?.date_of_joining && (
                <p className="text-sm text-muted-foreground/70 mt-1 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {format(new Date(employee.date_of_joining), "MMMM yyyy")}
                </p>
              )}
            </div>
          </div>

          {/* Upload actions */}
          {preview && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 flex-1">
                <ImagePlus className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-sm sm:text-base text-blue-700">New photo selected. Upload to save.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`h-9 px-4 text-sm ${employee?.is_admin ? "bg-indigo-600 hover:bg-indigo-700 text-white border-0" : "bg-emerald-600 hover:bg-emerald-700 text-white border-0"}`}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
                <Button size="sm" variant="outline" onClick={cancelPreview} disabled={uploading} className="h-9 px-4 text-sm">
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Remove photo */}
          {!preview && employee?.avatar_url && (
            <div className="mb-6">
              <button
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove photo
              </button>
            </div>
          )}

          {/* Photo hint */}
          {!preview && !employee?.avatar_url && (
            <p className="text-sm text-muted-foreground mb-6">
              Click on the avatar to upload a profile photo. JPG, PNG, or WebP up to 2 MB.
            </p>
          )}

          {/* Profile details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-5 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
              <div className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${employee?.is_admin ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">{employee?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
              <div className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${employee?.is_admin ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Designation</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{employee?.designation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
              <div className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${employee?.is_admin ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Department</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{employee?.department ?? "\u2014"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
              <div className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${employee?.is_admin ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Organization</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{orgName || employee?.org_id}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Office Timings */}
      <GlassCard className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${employee?.is_admin ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Office Timings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gray-50/80">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Working Hours</p>
            <p className="text-base font-semibold mt-1">{OFFICE_TIMINGS.label}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50/80">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Expected Hours</p>
            <p className="text-base font-semibold mt-1">{OFFICE_TIMINGS.expectedHours} hours/day</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50/80">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Half Day Threshold</p>
            <p className="text-base font-semibold mt-1">Below {OFFICE_TIMINGS.halfDayThreshold} hours</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50/80">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Late Mark After</p>
            <p className="text-base font-semibold mt-1">10:00 AM</p>
          </div>
        </div>
      </GlassCard>

      {/* Change Password */}
      <GlassCard className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${employee?.is_admin ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Security</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10 h-11 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="h-11 px-6 text-base">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
