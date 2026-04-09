"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Users,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Search,
  UserX,
  Plus,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  Pencil,
  UserMinus,
  UserCheck,
  ToggleLeft,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Employee } from "@/types"

export default function TeamPage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()
  const [members, setMembers] = useState<Employee[]>([])
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("all")
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    if (!employee) return
    fetchMembers()
  }, [employee?.id, orgId, showInactive])

  async function fetchMembers() {
    let query = supabase
      .from("fs_employees")
      .select("*")
      .eq("org_id", orgId)
      .order("full_name")

    if (!showInactive) {
      query = query.eq("is_active", true)
    }

    const { data } = await query
    if (data) setMembers(data)
  }

  const departments = useMemo(() => {
    const depts = new Set<string>()
    members.forEach((m) => {
      if (m.department) depts.add(m.department)
    })
    return Array.from(depts).sort()
  }, [members])

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.designation.toLowerCase().includes(search.toLowerCase())
      const matchDept =
        department === "all" || m.department === department
      return matchSearch && matchDept
    })
  }, [members, search, department])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team</h1>
            <p className="text-sm text-muted-foreground">
              Employee directory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`inline-flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-medium border transition-colors ${
                showInactive
                  ? "bg-orange-50 border-orange-200 text-orange-600"
                  : "bg-gray-50 border-gray-200 text-muted-foreground hover:bg-gray-100"
              }`}
            >
              <ToggleLeft className="h-4 w-4" />
              {showInactive ? "Showing Inactive" : "Show Inactive"}
            </button>
          )}
          {isAdmin && (
            <AddEmployeeDialog orgId={orgId} onSuccess={fetchMembers} />
          )}
          <Badge
            variant="secondary"
            className="h-8 px-3 text-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200"
          >
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 focus:border-emerald-500/50 focus:ring-emerald-200"
          />
        </div>
        <Select
          value={department}
          onValueChange={(v) => v !== null && setDepartment(v)}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-gray-50 border-gray-200">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">
            No team members found
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            {search || department !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Team members will appear here once added"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const initials = m.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <div
                key={m.id}
                className={`group relative rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  m.is_active
                    ? "border-gray-200 bg-gray-50 hover:border-emerald-200 hover:shadow-emerald-500/5"
                    : "border-orange-200 bg-orange-50/50 opacity-75"
                }`}
              >
                {/* Status indicator & admin actions */}
                <div className="absolute top-4 right-4">
                  {isAdmin && m.id !== employee?.id ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.is_active ? (
                        <>
                          <EditEmployeeDialog employee={m} onSuccess={fetchMembers} />
                          <DeactivateEmployeeButton employee={m} onSuccess={fetchMembers} />
                        </>
                      ) : (
                        <ReactivateEmployeeButton employee={m} onSuccess={fetchMembers} />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${m.is_active ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-orange-400"}`} />
                      <span className={`text-[11px] font-medium ${m.is_active ? "text-emerald-600" : "text-orange-600"}`}>
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="relative mb-3">
                    <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-emerald-500 to-green-600 p-[2.5px]">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.full_name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                          <span className="text-lg font-semibold bg-gradient-to-br from-emerald-500 to-green-600 bg-clip-text text-transparent">
                            {initials}
                          </span>
                        </div>
                      )}
                    </div>
                    {m.is_admin && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                        <Badge className="text-[10px] px-2 py-0 h-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-sm">
                          Admin
                        </Badge>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-[15px] mt-1">
                    {m.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {m.designation}
                  </p>
                </div>

                {/* Department Badge */}
                {m.department && (
                  <div className="flex justify-center mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-muted-foreground border-gray-200 text-xs font-normal"
                    >
                      <Briefcase className="h-3 w-3 mr-1.5" />
                      {m.department}
                    </Badge>
                  </div>
                )}

                {/* Info rows */}
                <div className="space-y-2.5 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-600/60" />
                    <span>
                      Joined {format(new Date(m.date_of_joining), "MMM yyyy")}
                    </span>
                  </div>

                  <a
                    href={`mailto:${m.email}`}
                    className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors group/email"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600/60 group-hover/email:text-emerald-600" />
                    <span className="truncate">{m.email}</span>
                  </a>

                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors group/phone"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600/60 group-hover/phone:text-emerald-600" />
                      <span>{m.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReactivateEmployeeButton({
  employee: emp,
  onSuccess,
}: {
  employee: Employee
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleReactivate() {
    setLoading(true)
    const { error } = await supabase
      .from("fs_employees")
      .update({ is_active: true })
      .eq("id", emp.id)

    if (error) {
      toast.error("Failed to reactivate employee")
    } else {
      toast.success(`${emp.full_name} has been reactivated`)
      setOpen(false)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors" />
        }
      >
        <UserCheck className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <UserCheck className="h-5 w-5" />
            Reactivate Employee
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to reactivate <strong>{emp.full_name}</strong>?
          They will be able to log in and appear in the team list again.
        </p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReactivate}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddEmployeeDialog({
  orgId,
  onSuccess,
}: {
  orgId: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [designation, setDesignation] = useState("")
  const [department, setDepartment] = useState("")
  const [phone, setPhone] = useState("")
  const [isAdminRole, setIsAdminRole] = useState(false)

  function resetForm() {
    setFullName("")
    setEmail("")
    setPassword("")
    setDesignation("")
    setDepartment("")
    setPhone("")
    setIsAdminRole(false)
    setShowPassword(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || !password || !designation) return
    setLoading(true)

    try {
      const res = await fetch("/api/employees/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          designation,
          department: department || undefined,
          phone: phone || undefined,
          org_id: orgId,
          is_admin: isAdminRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to create employee")
      } else {
        toast.success(`${fullName} has been added to the team!`)
        setOpen(false)
        resetForm()
        onSuccess()
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-500/25" />
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Employee
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Add New Employee
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="bg-gray-50 border-gray-200 focus:border-emerald-500/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Designation</Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Software Engineer"
                required
                className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
                className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Admin privileges</span>
            </div>
            <Switch checked={isAdminRole} onCheckedChange={setIsAdminRole} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-500/25"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Employee
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditEmployeeDialog({
  employee: emp,
  onSuccess,
}: {
  employee: Employee
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(emp.full_name)
  const [designation, setDesignation] = useState(emp.designation)
  const [department, setDepartment] = useState(emp.department ?? "")
  const [phone, setPhone] = useState(emp.phone ?? "")
  const [isAdminRole, setIsAdminRole] = useState(emp.is_admin)
  const supabase = createClient()

  function resetForm() {
    setFullName(emp.full_name)
    setDesignation(emp.designation)
    setDepartment(emp.department ?? "")
    setPhone(emp.phone ?? "")
    setIsAdminRole(emp.is_admin)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !designation) return
    setLoading(true)

    const { error } = await supabase
      .from("fs_employees")
      .update({
        full_name: fullName,
        designation,
        department: department || null,
        phone: phone || null,
        is_admin: isAdminRole,
      })
      .eq("id", emp.id)

    if (error) {
      toast.error("Failed to update employee")
    } else {
      toast.success(`${fullName} updated successfully`)
      setOpen(false)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <button className="p-1.5 rounded-lg hover:bg-gray-200 text-muted-foreground hover:text-foreground transition-colors" />
        }
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-emerald-600" />
            Edit Employee
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              value={emp.email}
              disabled
              className="bg-gray-100 border-gray-200 text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Designation</Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
                className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Admin privileges</span>
            </div>
            <Switch checked={isAdminRole} onCheckedChange={setIsAdminRole} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-500/25"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeactivateEmployeeButton({
  employee: emp,
  onSuccess,
}: {
  employee: Employee
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleDeactivate() {
    setLoading(true)
    const { error } = await supabase
      .from("fs_employees")
      .update({ is_active: false })
      .eq("id", emp.id)

    if (error) {
      toast.error("Failed to deactivate employee")
    } else {
      toast.success(`${emp.full_name} has been deactivated`)
      setOpen(false)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" />
        }
      >
        <UserMinus className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserMinus className="h-5 w-5" />
            Deactivate Employee
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to deactivate <strong>{emp.full_name}</strong>?
          They will no longer be able to log in or appear in the team list.
        </p>
        <div className="flex gap-2 justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivate}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
