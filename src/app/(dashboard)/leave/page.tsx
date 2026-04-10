"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
import { GlassCard } from "@/components/shared/glass-card"
import { LeaveRequestForm } from "@/components/leave/leave-request-form"
import { LeaveApprovalDialog } from "@/components/leave/leave-approval-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import {
  TbCalendarHeart,
  TbBeach,
  TbStethoscope,
  TbAward,
  TbClock,
  TbCircleCheck,
  TbCircleX,
  TbInbox,
  TbListCheck,
  TbUsers,
  TbCalendarTime,
  TbFileText,
} from "react-icons/tb"
import type { LeaveBalance, LeaveRequest } from "@/types"

export default function LeavePage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [allBalances, setAllBalances] = useState<(LeaveBalance & { employee?: any })[]>([])
  const [reviewRequest, setReviewRequest] = useState<LeaveRequest | null>(null)

  useEffect(() => {
    if (!employee) return
    fetchData()
  }, [employee?.id, orgId])

  async function fetchData() {
    // Own balance
    const { data: lb } = await supabase
      .from("fs_leave_balances")
      .select("*")
      .eq("employee_id", employee!.id)
      .eq("year", new Date().getFullYear())
      .single()
    if (lb) setBalance(lb)

    // Requests
    let reqQuery = supabase
      .from("fs_leave_requests")
      .select("*, employee:fs_employees(*)")
      .order("created_at", { ascending: false })

    if (!isAdmin) {
      reqQuery = reqQuery.eq("employee_id", employee!.id)
    }

    const { data: reqs } = await reqQuery
    if (reqs) {
      const filtered = isAdmin
        ? reqs.filter((r: any) => r.employee?.org_id === orgId)
        : reqs
      setRequests(filtered as LeaveRequest[])
    }

    // All balances (admin)
    if (isAdmin) {
      const { data: balances } = await supabase
        .from("fs_leave_balances")
        .select("*, employee:fs_employees(*)")
        .eq("year", new Date().getFullYear())
      if (balances) {
        setAllBalances(
          balances.filter((b: any) => b.employee?.org_id === orgId)
        )
      }
    }
  }

  const pending = requests.filter((r) => r.status === "pending")

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <TbCalendarHeart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
            <p className="text-sm text-muted-foreground">Manage leave requests and balances</p>
          </div>
        </div>
        {!isAdmin && (
          <LeaveRequestForm balance={balance} onSuccess={fetchData} />
        )}
      </div>

      {/* ── Employee: Balance Cards ── */}
      {!isAdmin && balance && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BalanceCard
            label="Casual Leave"
            icon={<TbBeach className="h-5 w-5" />}
            used={balance.casual_used}
            total={balance.casual_total}
            color="blue"
          />
          <BalanceCard
            label="Sick Leave"
            icon={<TbStethoscope className="h-5 w-5" />}
            used={balance.sick_used}
            total={balance.sick_total}
            color="orange"
          />
          <BalanceCard
            label="Earned Leave"
            icon={<TbAward className="h-5 w-5" />}
            used={balance.earned_used}
            total={balance.earned_total}
            color="green"
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue={isAdmin ? "pending" : "history"}>
        <TabsList className="inline-flex h-10 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 backdrop-blur-sm">
          {isAdmin && (
            <>
              <TabsTrigger
                value="pending"
                className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/20 data-active:to-teal-500/20 data-active:text-foreground data-active:shadow-none"
              >
                <TbInbox className="h-3.5 w-3.5" />
                Pending
                {pending.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-600">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/20 data-active:to-teal-500/20 data-active:text-foreground data-active:shadow-none"
              >
                <TbListCheck className="h-3.5 w-3.5" />
                All Requests
              </TabsTrigger>
              <TabsTrigger
                value="balances"
                className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/20 data-active:to-teal-500/20 data-active:text-foreground data-active:shadow-none"
              >
                <TbUsers className="h-3.5 w-3.5" />
                Balances
              </TabsTrigger>
            </>
          )}
          {!isAdmin && (
            <TabsTrigger
              value="history"
              className="gap-1.5 rounded-full px-4 text-xs data-active:bg-gradient-to-r data-active:from-emerald-500/20 data-active:to-teal-500/20 data-active:text-foreground data-active:shadow-none"
            >
              <TbCalendarTime className="h-3.5 w-3.5" />
              My Requests
            </TabsTrigger>
          )}
        </TabsList>

        {/* Admin: Pending */}
        {isAdmin && (
          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <LeaveEmptyState message="No pending leave requests to review" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((r) => (
                  <PendingCard
                    key={r.id}
                    request={r}
                    onReview={() => setReviewRequest(r)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* All / History */}
        <TabsContent value={isAdmin ? "all" : "history"} className="mt-4">
          {requests.length === 0 ? (
            <LeaveEmptyState message="No leave requests yet" />
          ) : (
            <GlassCard className="p-0 overflow-hidden border border-gray-200 shadow-xl">
              <div className="overflow-x-auto">
                <RequestsTable
                  requests={requests}
                  showEmployee={isAdmin}
                />
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* Admin: Balances */}
        {isAdmin && (
          <TabsContent value="balances" className="mt-4">
            {allBalances.length === 0 ? (
              <LeaveEmptyState message="No leave balances found for this year" />
            ) : (
              <GlassCard className="p-0 overflow-hidden border border-gray-200 shadow-xl">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Casual</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sick</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBalances.map((b) => (
                        <TableRow key={b.id} className="border-gray-100 transition-colors hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-xs font-bold text-emerald-600">
                                {b.employee?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="font-medium">{b.employee?.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <BalancePill used={b.casual_used} total={b.casual_total} color="blue" />
                          </TableCell>
                          <TableCell>
                            <BalancePill used={b.sick_used} total={b.sick_total} color="orange" />
                          </TableCell>
                          <TableCell>
                            <BalancePill used={b.earned_used} total={b.earned_total} color="green" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GlassCard>
            )}
          </TabsContent>
        )}
      </Tabs>

      <LeaveApprovalDialog
        request={reviewRequest}
        open={!!reviewRequest}
        onClose={() => setReviewRequest(null)}
        onSuccess={fetchData}
      />
    </div>
  )
}

/* ── Balance Card (Employee) ── */
function BalanceCard({
  label,
  icon,
  used,
  total,
  color,
}: {
  label: string
  icon: React.ReactNode
  used: number
  total: number
  color: "blue" | "orange" | "green"
}) {
  const remaining = total - used
  const percent = total > 0 ? (used / total) * 100 : 0

  const palette = {
    blue: {
      gradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-500/25",
      bg: "from-emerald-500/10 to-green-500/5",
      border: "border-emerald-200",
      bar: "bg-emerald-500",
      barTrack: "bg-emerald-50",
      text: "text-emerald-600",
      iconBg: "bg-white/20",
    },
    orange: {
      gradient: "from-orange-500 to-rose-600",
      shadow: "shadow-orange-500/25",
      bg: "from-orange-500/10 to-rose-500/5",
      border: "border-orange-200",
      bar: "bg-orange-500",
      barTrack: "bg-orange-50",
      text: "text-orange-600",
      iconBg: "bg-white/20",
    },
    green: {
      gradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-500/25",
      bg: "from-emerald-500/10 to-green-500/5",
      border: "border-emerald-200",
      bar: "bg-emerald-500",
      barTrack: "bg-emerald-50",
      text: "text-emerald-600",
      iconBg: "bg-white/20",
    },
  }
  const c = palette[color]

  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl`}>
      {/* Decorative circles */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.07] blur-xl transition-opacity group-hover:opacity-[0.12]`} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-4xl font-bold tabular-nums ${c.text}`}>
              {remaining}
            </span>
            <span className="text-sm text-muted-foreground">/ {total} days</span>
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} ${c.shadow} shadow-lg`}>
          <span className="text-white">{icon}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className={`h-2 w-full overflow-hidden rounded-full ${c.barTrack}`}>
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{used} used</span>
          <span>{remaining} remaining</span>
        </div>
      </div>
    </div>
  )
}

/* ── Balance Pill (Admin table) ── */
function BalancePill({
  used,
  total,
  color,
}: {
  used: number
  total: number
  color: "blue" | "orange" | "green"
}) {
  const remaining = total - used
  const percent = total > 0 ? (used / total) * 100 : 0
  const palette = {
    blue: { bar: "bg-emerald-500", track: "bg-emerald-50", text: "text-emerald-600" },
    orange: { bar: "bg-orange-500", track: "bg-orange-50", text: "text-orange-600" },
    green: { bar: "bg-emerald-500", track: "bg-emerald-50", text: "text-emerald-600" },
  }
  const c = palette[color]

  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 w-16 overflow-hidden rounded-full ${c.track}`}>
        <div
          className={`h-full rounded-full ${c.bar} transition-all`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${c.text}`}>
        {used}/{total}
      </span>
    </div>
  )
}

/* ── Pending Card (Admin) ── */
function PendingCard({
  request,
  onReview,
}: {
  request: LeaveRequest
  onReview: () => void
}) {
  const leaveTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
    casual: { label: "Casual", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    sick: { label: "Sick", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    earned: { label: "Earned", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  }
  const lt = leaveTypeConfig[request.leave_type] ?? leaveTypeConfig.casual

  const initials = request.employee?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2) ?? "?"

  const days =
    Math.ceil(
      (new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1

  return (
    <GlassCard className="group relative overflow-hidden border border-gray-200 p-5 transition-all hover:border-gray-300 hover:shadow-xl">
      {/* Top: avatar + name + type badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-sm font-bold text-emerald-600">
            {initials}
          </div>
          <div>
            <p className="font-semibold">{request.employee?.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {request.employee?.designation ?? "Employee"}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${lt.bg} ${lt.color}`}>
          {lt.label}
        </span>
      </div>

      {/* Date range */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <TbCalendarTime className="h-4 w-4 text-muted-foreground" />
        <span>
          {format(new Date(request.start_date), "MMM d")} &mdash; {format(new Date(request.end_date), "MMM d, yyyy")}
        </span>
        <span className="ml-auto rounded-full bg-gray-50 px-2 py-0.5 text-xs text-muted-foreground">
          {days} day{days !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reason */}
      {request.reason && (
        <div className="mt-3 flex items-start gap-2">
          <TbFileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {request.reason}
          </p>
        </div>
      )}

      {/* Action button */}
      <div className="mt-4">
        <Button
          onClick={onReview}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-110"
          size="sm"
        >
          Review Request
        </Button>
      </div>
    </GlassCard>
  )
}

/* ── Requests Table ── */
function RequestsTable({
  requests,
  showEmployee,
}: {
  requests: LeaveRequest[]
  showEmployee?: boolean
}) {
  const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    pending: {
      icon: <TbClock className="h-3 w-3" />,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-500/25",
    },
    approved: {
      icon: <TbCircleCheck className="h-3 w-3" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-500/25",
    },
    rejected: {
      icon: <TbCircleX className="h-3 w-3" />,
      color: "text-red-600",
      bg: "bg-red-50 border-red-500/25",
    },
  }

  const leaveTypeColors: Record<string, string> = {
    casual: "text-emerald-600",
    sick: "text-orange-600",
    earned: "text-emerald-600",
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-200 hover:bg-transparent">
          {showEmployee && <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</TableHead>}
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r) => {
          const sc = statusConfig[r.status] ?? statusConfig.pending
          const days =
            Math.ceil(
              (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1

          return (
            <TableRow key={r.id} className="border-gray-100 transition-colors hover:bg-gray-50">
              {showEmployee && (
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-[10px] font-bold text-emerald-600">
                      {r.employee?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium">{r.employee?.full_name}</span>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <span className={`text-sm font-medium capitalize ${leaveTypeColors[r.leave_type] ?? ""}`}>
                  {r.leave_type}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <span className="text-sm">
                    {format(new Date(r.start_date), "MMM d")} &mdash; {format(new Date(r.end_date), "MMM d")}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({days}d)
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                  {sc.icon}
                  <span className="capitalize">{r.status}</span>
                </span>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <p className="truncate text-sm text-muted-foreground">
                  {r.reason ?? "\u2014"}
                </p>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

/* ── Empty State ── */
function LeaveEmptyState({ message }: { message?: string }) {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 mb-4">
        <TbCalendarHeart className="h-7 w-7 text-emerald-600" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Nothing here yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {message ?? "No leave data to display. Check back later!"}
      </p>
    </GlassCard>
  )
}
