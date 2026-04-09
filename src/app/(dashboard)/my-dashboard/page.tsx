"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { GlassCard } from "@/components/shared/glass-card"
import { PageHeader } from "@/components/shared/page-header"
import { CheckinCard } from "@/components/attendance/checkin-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CalendarOff,
  ListTodo,
  Megaphone,
  Loader2,
  Pin,
  CheckCircle2,
  ArrowRight,
  CircleDot,
} from "lucide-react"
import type { LeaveBalance, Task, Announcement } from "@/types"

export default function MyDashboardPage() {
  const { employee, isLoading: isUserLoading } = useUser()
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [leaveLoading, setLeaveLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!employee?.id) return

    let cancelled = false

    async function fetchData() {
      setLeaveLoading(true)

      const [lbRes, taskRes, annRes] = await Promise.all([
        supabase
          .from("fs_leave_balances")
          .select("*")
          .eq("employee_id", employee!.id)
          .eq("year", new Date().getFullYear())
          .maybeSingle(),
        supabase
          .from("fs_tasks")
          .select("*")
          .eq("employee_id", employee!.id)
          .neq("status", "done")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("fs_announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(3),
      ])

      if (cancelled) return

      setLeaveBalance(lbRes.data ?? null)
      setLeaveLoading(false)
      if (taskRes.data) setTasks(taskRes.data)
      if (annRes.data) setAnnouncements(annRes.data)
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [employee?.id, supabase])

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Dashboard"
        description="Your daily attendance, tasks, and updates"
      />

      {/* ── Check-in Hero Card ── */}
      <CheckinCard />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Leave Balance */}
        <GlassCard className="group transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-orange-500/5 overflow-hidden relative">
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/[0.02] group-hover:to-amber-500/[0.02] transition-all duration-300" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <CalendarOff className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Leave Balance</p>
                <p className="text-[11px] text-muted-foreground/70">
                  {new Date().getFullYear()} allocation
                </p>
              </div>
            </div>

            {leaveLoading || isUserLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
              </div>
            ) : leaveBalance ? (
              <div className="space-y-4">
                <LeaveBar
                  label="Casual"
                  used={leaveBalance.casual_used}
                  total={leaveBalance.casual_total}
                  color="from-emerald-500 to-teal-500"
                  trackColor="bg-emerald-50"
                />
                <LeaveBar
                  label="Sick"
                  used={leaveBalance.sick_used}
                  total={leaveBalance.sick_total}
                  color="from-emerald-500 to-teal-400"
                  trackColor="bg-emerald-50"
                />
                <LeaveBar
                  label="Earned"
                  used={leaveBalance.earned_used}
                  total={leaveBalance.earned_total}
                  color="from-violet-500 to-purple-400"
                  trackColor="bg-violet-50"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-muted-foreground/60">
                <CalendarOff className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">No leave balance for {new Date().getFullYear()}</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Active Tasks */}
        <GlassCard className="group transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-emerald-500/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/[0.02] group-hover:to-green-500/[0.02] transition-all duration-300" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Active Tasks</p>
                <p className="text-[11px] text-muted-foreground/70">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"} pending
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-muted-foreground/60">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs">All caught up!</p>
                </div>
              ) : (
                tasks.map((t) => {
                  const priorityConfig: Record<string, { dot: string; bg: string }> = {
                    urgent: { dot: "bg-red-400", bg: "bg-red-50 text-red-600" },
                    high: { dot: "bg-orange-400", bg: "bg-orange-50 text-orange-600" },
                    normal: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-600" },
                    low: { dot: "bg-slate-400", bg: "bg-gray-100 text-muted-foreground" },
                  }
                  const pc = priorityConfig[t.priority] ?? priorityConfig.normal

                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg transition-colors hover:bg-gray-50"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pc.dot}`} />
                      <span className="text-sm truncate flex-1">{t.title}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${pc.bg}`}>
                        {t.priority}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </GlassCard>

        {/* Announcements */}
        <GlassCard className="group transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-purple-500/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/[0.02] group-hover:to-pink-500/[0.02] transition-all duration-300" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Announcements</p>
                <p className="text-[11px] text-muted-foreground/70">Latest updates</p>
              </div>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-muted-foreground/60">
                  <Megaphone className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs">No announcements</p>
                </div>
              ) : (
                announcements.map((a) => {
                  const borderColor =
                    a.priority === "urgent"
                      ? "border-l-red-500"
                      : a.priority === "high"
                      ? "border-l-orange-500"
                      : a.priority === "normal"
                      ? "border-l-emerald-500"
                      : "border-l-slate-500"

                  return (
                    <div
                      key={a.id}
                      className={`border-l-2 ${borderColor} pl-3 py-1.5 transition-colors hover:bg-gray-50 rounded-r-lg`}
                    >
                      <div className="flex items-center gap-1.5">
                        {a.is_pinned && (
                          <Pin className="h-3 w-3 text-amber-600 shrink-0 fill-amber-500" />
                        )}
                        <p className="text-sm font-medium truncate">{a.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5">
                        {a.content}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

/* ── Leave Bar with gradient progress ── */
function LeaveBar({
  label,
  used,
  total,
  color,
  trackColor,
}: {
  label: string
  used: number
  total: number
  color: string
  trackColor: string
}) {
  const remaining = total - used
  const percent = total > 0 ? (used / total) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground/70 tabular-nums">
          <span className="font-semibold text-foreground/80">{remaining}</span>/{total} left
        </span>
      </div>
      <div className={`h-2 rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}
