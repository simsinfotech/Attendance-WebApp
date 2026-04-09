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
import { Loader2, Shield, User, Eye, EyeOff, Clock, Camera, Trash2 } from "lucide-react"
import { toast } from "sonner"
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
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Account settings" />

      {/* Profile Photo */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Profile Photo</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-gray-200 hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : employee?.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employee.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xl font-semibold">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <div className="flex flex-col gap-2">
            {preview ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpload} disabled={uploading}>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload
                </Button>
                <Button size="sm" variant="outline" onClick={cancelPreview} disabled={uploading}>
                  Cancel
                </Button>
              </div>
            ) : employee?.avatar_url ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove Photo
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WebP. Max 2 MB.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Profile Info */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{employee?.full_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{employee?.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Designation</p>
            <p className="font-medium">{employee?.designation}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Department</p>
            <p className="font-medium">{employee?.department ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium">{employee?.is_admin ? "Admin" : "Employee"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Organization</p>
            <p className="font-medium">
              {orgName || employee?.org_id}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Office Timings */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Office Timings</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Working Hours</p>
            <p className="font-medium">{OFFICE_TIMINGS.label}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Expected Hours</p>
            <p className="font-medium">{OFFICE_TIMINGS.expectedHours} hours/day</p>
          </div>
          <div>
            <p className="text-muted-foreground">Half Day Threshold</p>
            <p className="font-medium">Below {OFFICE_TIMINGS.halfDayThreshold} hours</p>
          </div>
          <div>
            <p className="text-muted-foreground">Late Mark After</p>
            <p className="font-medium">10:00 AM</p>
          </div>
        </div>
      </GlassCard>

      {/* Change Password */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Security</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative max-w-sm">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
