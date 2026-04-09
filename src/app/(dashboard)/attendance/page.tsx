"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
import { GlassCard } from "@/components/shared/glass-card"
import { AttendanceTable } from "@/components/attendance/attendance-table"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { GpsMap } from "@/components/attendance/gps-map"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TableProperties,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Timer,
  ClipboardList,
  Download,
} from "lucide-react"
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns"
import type { Attendance, Employee } from "@/types"

export default function AttendancePage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [records, setRecords] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [month, setMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return

    if (isAdmin) {
      fetchEmployees()
    }
    fetchAttendance()
  }, [employee?.id, orgId, month, selectedEmployee])

  async function fetchEmployees() {
    const { data } = await supabase
      .from("fs_employees")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
    if (data) setEmployees(data)
  }

  async function fetchAttendance() {
    setLoading(true)
    const from = format(startOfMonth(month), "yyyy-MM-dd")
    const to = format(endOfMonth(month), "yyyy-MM-dd")

    let query = supabase
      .from("fs_attendance")
      .select("*, employee:fs_employees(*)")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })

    if (!isAdmin) {
      query = query.eq("employee_id", employee!.id)
    } else if (selectedEmployee !== "all") {
      query = query.eq("employee_id", selectedEmployee)
    }

    const { data } = await query
    if (data) {
      const filtered = isAdmin
        ? data.filter((a: any) => a.employee?.org_id === orgId)
        : data
      setRecords(filtered as Attendance[])
    }
    setLoading(false)
  }

  const mapPoints = records
    .filter((r) => r.check_in_lat && r.check_in_lng)
    .map((r) => ({
      lat: r.check_in_lat!,
      lng: r.check_in_lng!,
      label: r.employee?.full_name ?? "You",
      time: format(new Date(r.check_in), "MMM d, hh:mm a"),
    }))

  function exportCSV() {
    if (records.length === 0) return
    const headers = ["Date", "Employee", "Check In", "Check Out", "Status", "Working Hours"]
    const rows = records.map((r) => [
      r.date,
      r.employee?.full_name ?? "—",
      r.check_in ? format(new Date(r.check_in), "hh:mm a") : "—",
      r.check_out ? format(new Date(r.check_out), "hh:mm a") : "—",
      r.status,
      r.work_hours?.toFixed(1) ?? "—",
    ])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${format(month, "yyyy-MM")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* Stats */
  const stats = {
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    halfDay: records.filter((r) => r.status === "half_day").length,
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-sm text-muted-foreground">Track attendance and locations</p>
          </div>
        </div>

        {/* Month nav + Employee filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month picker pills */}
          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 backdrop-blur-sm">
            <button
              onClick={() => setMonth(subMonths(month, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[120px] px-2 text-center text-sm font-semibold">
              {format(month, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setMonth(addMonths(month, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {isAdmin && (
            <Select value={selectedEmployee} onValueChange={(v) => v !== null && setSelectedEmployee(v)}>
              <SelectTrigger className="w-[200px] rounded-full border-gray-200 bg-gray-50 backdrop-blur-sm">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={records.length === 0}
            className="rounded-full border-gray-200 bg-gray-50 hover:bg-gray-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<UserCheck className="h-4 w-4" />} label="Present" value={stats.present} color="emerald" />
        <StatCard icon={<Timer className="h-4 w-4" />} label="Late" value={stats.late} color="orange" />
        <StatCard icon={<UserX className="h-4 w-4" />} label="Absent" value={stats.absent} color="red" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Half Day" value={stats.halfDay} color="amber" />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="table">
        <TabsList className="inline-flex h-10 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="table"
            className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/15 data-active:to-green-500/15 data-active:text-foreground data-active:shadow-none"
          >
            <TableProperties className="h-3.5 w-3.5" />
            Table
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/15 data-active:to-green-500/15 data-active:text-foreground data-active:shadow-none"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="map"
              className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/15 data-active:to-green-500/15 data-active:text-foreground data-active:shadow-none"
            >
              <MapPin className="h-3.5 w-3.5" />
              Map
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="table" className="mt-4">
          {loading ? (
            <LoadingSkeleton />
          ) : records.length === 0 ? (
            <EmptyState />
          ) : (
            <GlassCard className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <AttendanceTable records={records} showEmployee={isAdmin} />
              </div>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <GlassCard className="border border-gray-200 shadow-xl">
            <AttendanceCalendar records={records} month={month} />
          </GlassCard>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="map" className="mt-4">
            {mapPoints.length === 0 ? (
              <EmptyState message="No location data for this period" />
            ) : (
              <GlassCard className="p-0 overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
                <GpsMap points={mapPoints} height="500px" />
              </GlassCard>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

/* ── Stat Card ── */
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: "emerald" | "orange" | "red" | "amber"
}) {
  const palette = {
    emerald: {
      bg: "from-emerald-500/10 to-emerald-600/5",
      border: "border-emerald-200",
      icon: "text-emerald-600 bg-emerald-50",
      text: "text-emerald-600",
    },
    orange: {
      bg: "from-orange-500/10 to-orange-600/5",
      border: "border-orange-200",
      icon: "text-orange-600 bg-orange-50",
      text: "text-orange-600",
    },
    red: {
      bg: "from-red-500/10 to-red-600/5",
      border: "border-red-200",
      icon: "text-red-600 bg-red-50",
      text: "text-red-600",
    },
    amber: {
      bg: "from-amber-500/10 to-amber-600/5",
      border: "border-amber-200",
      icon: "text-amber-600 bg-amber-50",
      text: "text-amber-600",
    },
  }
  const c = palette[color]

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.icon}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Empty State ── */
function EmptyState({ message }: { message?: string }) {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 mb-4">
        <Clock className="h-7 w-7 text-emerald-600" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No records found</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {message ?? "There are no attendance records for the selected period. Adjust the month or employee filter."}
      </p>
    </GlassCard>
  )
}

/* ── Loading Skeleton ── */
function LoadingSkeleton() {
  return (
    <GlassCard className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-50" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded-md bg-gray-50" />
            <div className="h-2 w-1/4 animate-pulse rounded-md bg-gray-50" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-50" />
        </div>
      ))}
    </GlassCard>
  )
}
