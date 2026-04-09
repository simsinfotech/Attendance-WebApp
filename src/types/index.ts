export interface Employee {
  id: string
  auth_id: string
  org_id: string
  full_name: string
  email: string
  phone?: string
  designation: string
  department?: string
  date_of_joining: string
  is_admin: boolean
  is_active: boolean
  avatar_url?: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  code: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  check_in: string
  check_out?: string
  check_in_lat?: number
  check_in_lng?: number
  check_in_address?: string
  check_out_lat?: number
  check_out_lng?: number
  check_out_address?: string
  status: "present" | "late" | "half_day" | "absent"
  work_hours?: number
  notes?: string
  created_at: string
  employee?: Employee
}

export interface LeaveBalance {
  id: string
  employee_id: string
  year: number
  casual_total: number
  casual_used: number
  sick_total: number
  sick_used: number
  earned_total: number
  earned_used: number
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: "casual" | "sick" | "earned"
  start_date: string
  end_date: string
  reason: string
  status: "pending" | "approved" | "rejected"
  reviewed_by?: string
  review_notes?: string
  created_at: string
  employee?: Employee
}

export interface Task {
  id: string
  employee_id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  due_date?: string
  assigned_by?: string
  created_at: string
  employee?: Employee
}

export interface EodReport {
  id: string
  employee_id: string
  date: string
  tasks_completed: { title: string; status: string }[]
  blockers?: string
  tomorrow_plan?: string
  created_at: string
  employee?: Employee
}

export interface Okr {
  id: string
  employee_id: string
  title: string
  description?: string
  quarter: string
  year: number
  progress: number
  status: "on_track" | "at_risk" | "behind" | "completed"
  created_at: string
  key_results?: KeyResult[]
  employee?: Employee
}

export interface KeyResult {
  id: string
  okr_id: string
  title: string
  target_value: number
  current_value: number
  unit?: string
}

export interface Feedback {
  id: string
  from_employee_id: string
  to_employee_id: string
  rating: number
  strengths: string
  improvements: string
  is_anonymous: boolean
  created_at: string
  from_employee?: Employee
  to_employee?: Employee
}

export interface Appraisal {
  id: string
  employee_id: string
  cycle: string
  self_rating?: number
  self_comments?: string
  manager_rating?: number
  manager_comments?: string
  status: "pending_self" | "pending_manager" | "completed"
  created_at: string
  employee?: Employee
}

export interface Payroll {
  id: string
  employee_id: string
  month: number
  year: number
  basic_salary: number
  hra: number
  allowances: number
  deductions: number
  net_salary: number
  status: "draft" | "pending" | "paid"
  razorpay_order_id?: string
  razorpay_payment_id?: string
  paid_at?: string
  created_at: string
  employee?: Employee
}

export interface Notification {
  id: string
  recipient_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  link?: string
  created_at: string
}

export interface Announcement {
  id: string
  org_id: string
  title: string
  content: string
  priority: "low" | "normal" | "high" | "urgent"
  is_pinned: boolean
  created_by: string
  created_at: string
  author?: Employee
}
