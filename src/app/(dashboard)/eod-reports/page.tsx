"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TbPlus,
  TbLoader2,
  TbTrash,
  TbFileText,
  TbCalendar,
  TbCircleCheck,
  TbAlertOctagon,
  TbBulb,
  TbChevronDown,
  TbChevronUp,
  TbUser,
  TbInbox,
  TbClock,
} from "react-icons/tb"
import { toast } from "sonner"
import { format } from "date-fns"
import type { EodReport, Employee } from "@/types"

export default function EodReportsPage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [reports, setReports] = useState<EodReport[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!employee) return
    fetchData()
  }, [employee?.id, orgId, selectedEmployee])

  async function fetchData() {
    setLoading(true)
    let query = supabase
      .from("fs_eod_reports")
      .select("*, employee:fs_employees(*)")
      .order("date", { ascending: false })
      .limit(30)

    if (!isAdmin) {
      query = query.eq("employee_id", employee!.id)
    } else if (selectedEmployee !== "all") {
      query = query.eq("employee_id", selectedEmployee)
    }

    const { data } = await query
    if (data) {
      const filtered = isAdmin
        ? data.filter((r: any) => r.employee?.org_id === orgId)
        : data
      setReports(filtered as EodReport[])
      // Auto-expand the most recent report
      if (filtered.length > 0) {
        setExpandedIds(new Set([(filtered[0] as any).id]))
      }
    }

    if (isAdmin) {
      const { data: emps } = await supabase
        .from("fs_employees")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
      if (emps) setEmployees(emps)
    }
    setLoading(false)
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Group reports by date
  const grouped = reports.reduce<Record<string, EodReport[]>>((acc, report) => {
    const dateKey = report.date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(report)
    return acc
  }, {})

  const STATUS_BADGE: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-600",
    in_progress: "bg-emerald-50 text-emerald-600",
    partial: "bg-amber-50 text-amber-600",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
            <TbFileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EOD Reports</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <TbCalendar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <NewEodDialog employeeId={employee?.id} onSuccess={fetchData} />
          )}
        </div>
      </div>

      {/* Admin filter */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-md px-4 py-2">
            <TbUser className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedEmployee} onValueChange={(v) => v !== null && setSelectedEmployee(v)}>
              <SelectTrigger className="w-[200px] border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0">
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
          </div>
        </div>
      )}

      {/* Reports Timeline */}
      {reports.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 mb-4">
            <TbInbox className="h-8 w-8 text-teal-500/50" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">
            No reports found
          </p>
          <p className="text-sm text-muted-foreground/60">
            {isAdmin
              ? "No EOD reports have been submitted yet."
              : "Submit your first end-of-day report to get started."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-200 via-gray-200 to-transparent hidden md:block" />

          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, dateReports]) => (
              <div key={dateKey} className="relative">
                {/* Date header with timeline dot */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 shrink-0">
                    <TbCalendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold">
                      {format(new Date(dateKey), "EEEE, MMM d, yyyy")}
                    </h2>
                    <span className="text-xs text-muted-foreground/50 bg-gray-50 px-2 py-0.5 rounded-full">
                      {dateReports.length} {dateReports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>
                </div>

                {/* Reports for this date */}
                <div className="md:ml-14 space-y-3">
                  {dateReports.map((report) => {
                    const isExpanded = expandedIds.has(report.id)
                    return (
                      <div
                        key={report.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                      >
                        {/* Collapsible header */}
                        <button
                          onClick={() => toggleExpand(report.id)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            {isAdmin && report.employee && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-600/30 ring-1 ring-gray-200">
                                <span className="text-xs font-bold text-emerald-600">
                                  {getInitials(report.employee.full_name)}
                                </span>
                              </div>
                            )}
                            <div>
                              {isAdmin && report.employee && (
                                <p className="text-sm font-medium">
                                  {report.employee.full_name}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <TbCircleCheck className="h-3 w-3 text-emerald-600" />
                                <span>
                                  {(report.tasks_completed as any[]).length}{" "}
                                  {(report.tasks_completed as any[]).length === 1
                                    ? "task"
                                    : "tasks"}
                                </span>
                                {report.blockers && (
                                  <>
                                    <span className="text-gray-400">|</span>
                                    <TbAlertOctagon className="h-3 w-3 text-red-600" />
                                    <span className="text-red-600">Has blockers</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TbClock className="h-3.5 w-3.5 text-muted-foreground/40" />
                            {isExpanded ? (
                              <TbChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <TbChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Expandable content */}
                        {isExpanded && (
                          <div className="px-5 pb-5 space-y-4 border-t border-gray-200">
                            {/* Tasks completed */}
                            <div className="pt-4">
                              <div className="flex items-center gap-2 mb-3">
                                <TbCircleCheck className="h-4 w-4 text-emerald-600" />
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                  Tasks Completed
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {(report.tasks_completed as any[]).map(
                                  (t, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-2.5"
                                    >
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 shrink-0">
                                        {i + 1}
                                      </span>
                                      <span className="text-sm flex-1">
                                        {t.title}
                                      </span>
                                      {t.status && (
                                        <span
                                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] || "bg-gray-100 text-muted-foreground"}`}
                                        >
                                          {t.status.replace("_", " ")}
                                        </span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Blockers */}
                            {report.blockers && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <TbAlertOctagon className="h-4 w-4 text-red-600" />
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600">
                                    Blockers
                                  </h4>
                                </div>
                                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                                  <p className="text-sm text-red-700 leading-relaxed">
                                    {report.blockers}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Tomorrow plan */}
                            {report.tomorrow_plan && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <TbBulb className="h-4 w-4 text-emerald-600" />
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                    Tomorrow&apos;s Plan
                                  </h4>
                                </div>
                                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                                  <p className="text-sm text-emerald-600/90 leading-relaxed">
                                    {report.tomorrow_plan}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NewEodDialog({
  employeeId,
  onSuccess,
}: {
  employeeId?: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState([{ title: "", status: "completed" }])
  const [blockers, setBlockers] = useState("")
  const [tomorrowPlan, setTomorrowPlan] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function addTask() {
    setTasks([...tasks, { title: "", status: "completed" }])
  }

  function removeTask(index: number) {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  function updateTask(index: number, field: string, value: string) {
    setTasks(
      tasks.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) return

    const validTasks = tasks.filter((t) => t.title.trim())
    if (validTasks.length === 0) {
      toast.error("Add at least one task")
      return
    }

    setLoading(true)
    const { error } = await supabase.from("fs_eod_reports").insert({
      employee_id: employeeId,
      date: format(new Date(), "yyyy-MM-dd"),
      tasks_completed: validTasks,
      blockers: blockers || null,
      tomorrow_plan: tomorrowPlan || null,
    })

    if (error) {
      if (error.code === "23505") {
        toast.error("You already submitted today's EOD report")
      } else {
        toast.error("Failed to submit report")
      }
    } else {
      toast.success("EOD report submitted!")
      setOpen(false)
      setTasks([{ title: "", status: "completed" }])
      setBlockers("")
      setTomorrowPlan("")
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 border-0" />}>
        <TbPlus className="mr-2 h-4 w-4" />
        Submit EOD
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <TbFileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">End of Day Report</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Tasks section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TbCircleCheck className="h-4 w-4 text-emerald-600" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Tasks Completed
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addTask}
                className="h-7 text-xs text-teal-600 hover:text-emerald-600 hover:bg-emerald-50"
              >
                <TbPlus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(i, "title", e.target.value)}
                    placeholder={`What did you work on?`}
                    className="flex-1 bg-gray-50 border-gray-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                  <Select
                    value={task.status}
                    onValueChange={(v) => v !== null && updateTask(i, "status", v)}
                  >
                    <SelectTrigger className="w-[120px] bg-gray-50 border-gray-200 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(i)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    >
                      <TbTrash className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blockers section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TbAlertOctagon className="h-4 w-4 text-red-600" />
              <Label className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Blockers
              </Label>
            </div>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any blockers or issues you faced today..."
              rows={2}
              className="bg-gray-50 border-gray-200 focus:border-red-300 focus:ring-red-500/20 resize-none"
            />
          </div>

          {/* Tomorrow's plan section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TbBulb className="h-4 w-4 text-emerald-600" />
              <Label className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Tomorrow&apos;s Plan
              </Label>
            </div>
            <Textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="What do you plan to work on tomorrow?"
              rows={2}
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50 focus:ring-emerald-200 resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 border-0 h-11 font-medium"
            disabled={loading}
          >
            {loading && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
