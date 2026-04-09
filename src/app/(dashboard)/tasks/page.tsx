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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Loader2,
  ClipboardList,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  User,
  AlertTriangle,
  Inbox,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Task, Employee } from "@/types"

const COLUMNS = [
  {
    id: "todo",
    label: "To Do",
    accent: "from-slate-500/20 to-slate-600/10",
    dot: "bg-slate-400",
    headerBg: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    badgeBg: "bg-slate-500/20 text-slate-300",
    icon: Circle,
  },
  {
    id: "in_progress",
    label: "In Progress",
    accent: "from-emerald-500/15 to-green-600/10",
    dot: "bg-emerald-500",
    headerBg: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-600",
    icon: Clock,
  },
  {
    id: "done",
    label: "Done",
    accent: "from-emerald-500/20 to-emerald-600/10",
    dot: "bg-emerald-400",
    headerBg: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-300",
    icon: CheckCircle2,
  },
] as const

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-emerald-500",
  low: "border-l-slate-400",
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-50 text-red-600 ring-1 ring-red-500/20",
  high: "bg-orange-50 text-orange-600 ring-1 ring-orange-500/20",
  medium: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
  low: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",
}

export default function TasksPage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    fetchData()
  }, [employee?.id, orgId])

  async function fetchData() {
    setLoading(true)
    let query = supabase
      .from("fs_tasks")
      .select("*, employee:fs_employees(*)")
      .order("created_at", { ascending: false })

    if (!isAdmin) {
      query = query.eq("employee_id", employee!.id)
    }

    const { data } = await query
    if (data) {
      const filtered = isAdmin
        ? data.filter((t: any) => t.employee?.org_id === orgId)
        : data
      setTasks(filtered as Task[])
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

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const { error } = await supabase
      .from("fs_tasks")
      .update({ status: newStatus })
      .eq("id", taskId)

    if (error) {
      toast.error("Failed to update task")
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
      )
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your team&apos;s tasks
            </p>
          </div>
        </div>
        {isAdmin && (
          <NewTaskDialog
            employees={employees}
            adminId={employee?.id}
            onSuccess={fetchData}
          />
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          const ColIcon = col.icon
          return (
            <div key={col.id} className="flex flex-col">
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-t-xl border ${col.borderColor} ${col.headerBg} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot} ring-4 ring-white/5`} />
                  <ColIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                </div>
                <span
                  className={`inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-xs font-semibold ${col.badgeBg}`}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Column Body */}
              <div
                className={`flex-1 rounded-b-xl border border-t-0 ${col.borderColor} bg-gradient-to-b ${col.accent} p-3 space-y-3 min-h-[260px]`}
              >
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group relative rounded-lg border border-gray-200 bg-gray-50 backdrop-blur-md p-4 space-y-3 border-l-[3px] ${PRIORITY_BORDER[task.priority]} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 hover:bg-gray-100`}
                  >
                    {/* Title + Priority */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug flex-1">
                        {task.title}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PRIORITY_BADGE[task.priority]}`}
                      >
                        {task.priority === "urgent" && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {task.priority}
                      </span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {isAdmin && task.employee && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-teal-600/20 ring-1 ring-gray-200">
                            <span className="text-[9px] font-bold text-emerald-600">
                              {getInitials(task.employee.full_name)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {task.employee.full_name}
                          </span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.due_date), "MMM d")}</span>
                        </div>
                      )}
                    </div>

                    {/* Edit / Delete / Status actions */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200">
                      {isAdmin && (
                        <>
                          <EditTaskDialog
                            task={task}
                            employees={employees}
                            onSuccess={fetchData}
                          />
                          <DeleteTaskButton
                            taskId={task.id}
                            taskTitle={task.title}
                            onSuccess={fetchData}
                          />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200">
                      {col.id !== "todo" && (
                        <button
                          onClick={() =>
                            updateTaskStatus(
                              task.id,
                              col.id === "done" ? "in_progress" : "todo"
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          {col.id === "done" ? "In Progress" : "To Do"}
                        </button>
                      )}
                      {col.id !== "done" && (
                        <button
                          onClick={() =>
                            updateTaskStatus(
                              task.id,
                              col.id === "todo" ? "in_progress" : "done"
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-gray-900 hover:bg-gray-100 transition-colors ml-auto"
                        >
                          {col.id === "todo" ? "In Progress" : "Done"}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 rounded-lg border-2 border-dashed border-gray-200">
                    <Inbox className="h-8 w-8 text-gray-200 mb-2" />
                    <p className="text-xs text-muted-foreground/60">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EditTaskDialog({
  task,
  employees,
  onSuccess,
}: {
  task: Task
  employees: Employee[]
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [employeeId, setEmployeeId] = useState(task.employee_id)
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date || "")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setTitle(task.title)
      setDescription(task.description || "")
      setEmployeeId(task.employee_id)
      setPriority(task.priority)
      setDueDate(task.due_date || "")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !employeeId) return
    setLoading(true)

    const { error } = await supabase
      .from("fs_tasks")
      .update({
        title,
        description: description || null,
        employee_id: employeeId,
        priority,
        due_date: dueDate || null,
      })
      .eq("id", task.id)

    if (error) {
      toast.error("Failed to update task")
    } else {
      // Notify employee about task update
      const wasReassigned = employeeId !== task.employee_id
      await supabase.from("fs_notifications").insert({
        recipient_id: employeeId,
        type: "task_assigned",
        title: wasReassigned ? "Task Reassigned to You" : "Task Updated",
        message: wasReassigned
          ? `You've been assigned: "${title}"`
          : `Task "${title}" has been updated`,
        link: "/tasks",
      })
      toast.success("Task updated!")
      setOpen(false)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={
        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-gray-900 hover:bg-gray-100 transition-colors" />
      }>
        <Pencil className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Pencil className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-lg">Edit Task</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-gray-50 border-gray-200" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-gray-50 border-gray-200 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assign To</Label>
              <Select value={employeeId} onValueChange={(v) => v !== null && setEmployeeId(v)}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(v) => v !== null && setPriority(v)}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-gray-50 border-gray-200" />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-emerald-500/20 border-0 h-11 font-medium" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteTaskButton({
  taskId,
  taskTitle,
  onSuccess,
}: {
  taskId: string
  taskTitle: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from("fs_tasks").delete().eq("id", taskId)
    if (error) {
      toast.error("Failed to delete task")
    } else {
      toast.success("Task deleted")
      setOpen(false)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" />
      }>
        <Trash2 className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">&quot;{taskTitle}&quot;</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewTaskDialog({
  employees,
  adminId,
  onSuccess,
}: {
  employees: Employee[]
  adminId?: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !employeeId) return
    setLoading(true)

    const { error } = await supabase.from("fs_tasks").insert({
      title,
      description: description || null,
      employee_id: employeeId,
      priority,
      due_date: dueDate || null,
      assigned_by: adminId,
    })

    if (error) {
      toast.error("Failed to create task")
    } else {
      // Notify employee
      await supabase.from("fs_notifications").insert({
        recipient_id: employeeId,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `You've been assigned: "${title}"`,
        link: "/tasks",
      })
      toast.success("Task created!")
      setOpen(false)
      setTitle("")
      setDescription("")
      setEmployeeId("")
      setPriority("medium")
      setDueDate("")
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-emerald-500/20 border-0" />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-lg">Create New Task</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50 focus:ring-emerald-200"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={2}
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50 focus:ring-emerald-200 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Assign To
              </Label>
              <Select value={employeeId} onValueChange={(v) => v !== null && setEmployeeId(v)}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Priority
              </Label>
              <Select value={priority} onValueChange={(v) => v !== null && setPriority(v)}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Due Date
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50 focus:ring-emerald-200"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-emerald-500/20 border-0 h-11 font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
