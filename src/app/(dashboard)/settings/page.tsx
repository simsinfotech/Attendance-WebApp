"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { GlassCard } from "@/components/shared/glass-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Shield, User, Eye, EyeOff, Clock } from "lucide-react"
import { toast } from "sonner"
import { OFFICE_TIMINGS } from "@/lib/config"

export default function SettingsPage() {
  const { employee, user } = useUser()
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [orgName, setOrgName] = useState("")
  const supabase = createClient()
  const router = useRouter()

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
