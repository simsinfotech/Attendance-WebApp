"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
import { GlassCard } from "@/components/shared/glass-card"
import { PageHeader } from "@/components/shared/page-header"
import { GpsMap } from "@/components/attendance/gps-map"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Clock,
  CalendarOff,
  CreditCard,
  Megaphone,
  MapPin,
  Pin,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Coffee,
} from "lucide-react"
import { format } from "date-fns"
import type { Attendance, Employee, Announcement } from "@/types"

export default function OverviewPage() {
  const { employee } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [todayAttendance, setTodayAttendance] = useState<(Attendance & { employee: Employee })[]>([])
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [payrollSummary, setPayrollSummary] = useState({ total: 0, paid: 0 })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    if (!employee) return
    fetchAll()

    // Realtime for attendance
    const channel = supabase
      .channel("admin-attendance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fs_attendance",
        },
        () => {
          fetchAttendance()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employee?.id, orgId])

  async function fetchAll() {
    await Promise.all([
      fetchEmployees(),
      fetchAttendance(),
      fetchLeaves(),
      fetchPayroll(),
      fetchAnnouncements(),
    ])
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("fs_employees")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
    if (error) console.error("fetchEmployees error:", error)
    if (data) setEmployees(data)
  }

  async function fetchAttendance() {
    const { data, error } = await supabase
      .from("fs_attendance")
      .select("*, employee:fs_employees(*)")
      .eq("date", today)
      .order("check_in", { ascending: false })
    if (error) console.error("fetchAttendance error:", error)
    if (data) {
      // Filter by org
      const filtered = data.filter((a: any) => a.employee?.org_id === orgId)
      setTodayAttendance(filtered as any)
    }
  }

  async function fetchLeaves() {
    const { data, error } = await supabase
      .from("fs_leave_requests")
      .select("employee_id, status, employee:fs_employees!employee_id(org_id)")
      .eq("status", "pending")
    if (error) console.error("fetchLeaves error:", error)
    const filtered = (data ?? []).filter((r: any) => r.employee?.org_id === orgId)
    setPendingLeaves(filtered.length)
  }

  async function fetchPayroll() {
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from("fs_payroll")
      .select("status, net_salary, employee:fs_employees(org_id)")
      .eq("month", month)
      .eq("year", year)
    if (error) console.error("fetchPayroll error:", error)
    if (data) {
      const filtered = data.filter((p: any) => p.employee?.org_id === orgId)
      setPayrollSummary({
        total: filtered.length,
        paid: filtered.filter((p: any) => p.status === "paid").length,
      })
    }
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from("fs_announcements")
      .select("*")
      .eq("org_id", orgId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5)
    if (data) setAnnouncements(data)
  }

  const checkedInCount = todayAttendance.length
  const mapPoints = todayAttendance
    .filter((a) => a.check_in_lat && a.check_in_lng)
    .map((a) => ({
      lat: a.check_in_lat!,
      lng: a.check_in_lng!,
      label: a.employee?.full_name ?? "Unknown",
      time: format(new Date(a.check_in), "hh:mm a"),
    }))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={`Dashboard for ${orgId === "ORG-001" ? "SimsInfotech" : "Estate Hive"}`}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Team Headcount"
          value={employees.length}
          subtitle="Active employees"
          gradient="from-emerald-500 to-teal-500"
          shadowColor="shadow-emerald-500/20"
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-500"
          href="/team"
        />
        <StatCard
          icon={UserCheck}
          label="Checked-In Today"
          value={checkedInCount}
          subtitle={employees.length > 0 ? `${Math.round((checkedInCount / employees.length) * 100)}% of team` : "No employees"}
          gradient="from-emerald-500 to-teal-400"
          shadowColor="shadow-emerald-500/20"
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-400"
          href="/attendance"
        />
        <StatCard
          icon={CalendarOff}
          label="Pending Leaves"
          value={pendingLeaves}
          subtitle="Awaiting approval"
          gradient="from-orange-500 to-amber-400"
          shadowColor="shadow-orange-500/20"
          iconBg="bg-gradient-to-br from-orange-500 to-amber-400"
          href="/leave"
        />
        <StatCard
          icon={CreditCard}
          label="Payroll Status"
          value={`${payrollSummary.paid}/${payrollSummary.total}`}
          subtitle="Processed this month"
          gradient="from-violet-500 to-purple-400"
          shadowColor="shadow-emerald-500/20"
          iconBg="bg-gradient-to-br from-violet-500 to-purple-400"
          href="/payroll"
        />
      </div>

      {/* ── Today's Check-ins + Map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Check-ins List */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Today&apos;s Check-ins</h3>
                  <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
                </div>
              </div>
              <Badge variant="secondary" className="tabular-nums">
                {checkedInCount} total
              </Badge>
            </div>
          </div>

          <div className="overflow-auto max-h-[400px] px-3 py-2">
            {todayAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Coffee className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">No check-ins yet today</p>
                <p className="text-xs mt-1 text-muted-foreground/70">Employees will appear here when they check in</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todayAttendance.map((a) => {
                  const initials = (a.employee?.full_name ?? "?")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <div
                      key={a.id}
                      className="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50 cursor-default"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20">
                          {initials}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          a.status === "present" ? "bg-emerald-400" :
                          a.status === "late" ? "bg-orange-400" :
                          a.status === "half_day" ? "bg-yellow-400" : "bg-red-400"
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.employee?.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(a.check_in), "hh:mm a")}
                          </span>
                          {a.check_in_address && (
                            <>
                              <span className="text-muted-foreground/30">|</span>
                              <MapPin className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {a.check_in_address}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <StatusBadge status={a.status} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Map */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Field Locations</h3>
                <p className="text-xs text-muted-foreground">{mapPoints.length} active locations</p>
              </div>
            </div>
          </div>
          <GpsMap points={mapPoints} height="370px" />
        </GlassCard>
      </div>

      {/* ── Announcements ── */}
      {announcements.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-semibold">Announcements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a) => {
              const borderColor =
                a.priority === "urgent"
                  ? "border-l-red-500"
                  : a.priority === "high"
                  ? "border-l-orange-500"
                  : a.priority === "normal"
                  ? "border-l-emerald-500"
                  : "border-l-slate-500"

              const priorityDot =
                a.priority === "urgent"
                  ? "bg-red-400"
                  : a.priority === "high"
                  ? "bg-orange-400"
                  : a.priority === "normal"
                  ? "bg-emerald-500"
                  : "bg-slate-400"

              return (
                <GlassCard
                  key={a.id}
                  className={`border-l-[3px] ${borderColor} transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {a.is_pinned && (
                        <Pin className="h-3.5 w-3.5 text-amber-600 shrink-0 fill-amber-500" />
                      )}
                      <h4 className="text-sm font-semibold truncate">{a.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${priorityDot}`} />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                        {a.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {a.content}
                  </p>
                  {a.created_at && (
                    <p className="text-[10px] text-muted-foreground/50 mt-3">
                      {format(new Date(a.created_at), "MMM d, yyyy")}
                    </p>
                  )}
                </GlassCard>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Stat Card ── */
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  gradient,
  shadowColor,
  iconBg,
  href,
}: {
  icon: any
  label: string
  value: number | string
  subtitle: string
  gradient: string
  shadowColor: string
  iconBg: string
  href?: string
}) {
  const inner = (
    <GlassCard className={`group relative overflow-hidden transition-all duration-300 hover:translate-y-[-3px] hover:shadow-xl ${shadowColor} cursor-default`}>
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

      <div className="relative flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg ${shadowColor} shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">{subtitle}</p>
        </div>
      </div>
    </GlassCard>
  )

  if (href) {
    return <a href={href} className="block">{inner}</a>
  }
  return inner
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    present: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Present" },
    late: { bg: "bg-orange-50", text: "text-orange-600", label: "Late" },
    half_day: { bg: "bg-yellow-50", text: "text-yellow-600", label: "Half Day" },
    absent: { bg: "bg-red-50", text: "text-red-600", label: "Absent" },
  }

  const c = config[status] ?? { bg: "bg-gray-100", text: "text-muted-foreground", label: status }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
