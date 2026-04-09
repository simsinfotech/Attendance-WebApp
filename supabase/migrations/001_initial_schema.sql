-- FieldScore HR — Full Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id TEXT NOT NULL REFERENCES fs_organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  designation TEXT NOT NULL,
  department TEXT,
  date_of_joining DATE DEFAULT CURRENT_DATE,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_employees_org ON fs_employees(org_id);
CREATE INDEX idx_employees_auth ON fs_employees(auth_id);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  check_in_lat DOUBLE PRECISION,
  check_in_lng DOUBLE PRECISION,
  check_in_address TEXT,
  check_out_lat DOUBLE PRECISION,
  check_out_lng DOUBLE PRECISION,
  check_out_address TEXT,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day', 'absent')),
  work_hours NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_emp_date ON fs_attendance(employee_id, date);

-- ============================================================
-- LEAVE BALANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  casual_total INTEGER DEFAULT 12,
  casual_used INTEGER DEFAULT 0,
  sick_total INTEGER DEFAULT 6,
  sick_used INTEGER DEFAULT 0,
  earned_total INTEGER DEFAULT 15,
  earned_used INTEGER DEFAULT 0,
  UNIQUE(employee_id, year)
);

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('casual', 'sick', 'earned')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES fs_employees(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leave_req_emp ON fs_leave_requests(employee_id);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  assigned_by UUID REFERENCES fs_employees(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_emp ON fs_tasks(employee_id);

-- ============================================================
-- EOD REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_eod_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed JSONB DEFAULT '[]'::jsonb,
  blockers TEXT,
  tomorrow_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- ============================================================
-- OKRs
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- KEY RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID NOT NULL REFERENCES fs_okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT
);

-- ============================================================
-- FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  to_employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  improvements TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- APPRAISALS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  cycle TEXT NOT NULL,
  self_rating NUMERIC(3,1),
  self_comments TEXT,
  manager_rating NUMERIC(3,1),
  manager_comments TEXT,
  status TEXT DEFAULT 'pending_self' CHECK (status IN ('pending_self', 'pending_manager', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  basic_salary NUMERIC(12,2) NOT NULL,
  hra NUMERIC(12,2) DEFAULT 0,
  allowances NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES fs_employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_recipient ON fs_notifications(recipient_id, is_read);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS fs_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES fs_organizations(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES fs_employees(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE fs_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_eod_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_announcements ENABLE ROW LEVEL SECURITY;

-- Helper function: get current employee
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM fs_employees WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM fs_employees WHERE auth_id = auth.uid() LIMIT 1),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current employee's org
CREATE OR REPLACE FUNCTION get_current_employee_org()
RETURNS TEXT AS $$
  SELECT org_id FROM fs_employees WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANIZATIONS: everyone can read
CREATE POLICY "orgs_select" ON fs_organizations FOR SELECT USING (true);

-- EMPLOYEES: own record OR admin sees all in org
CREATE POLICY "emp_select" ON fs_employees FOR SELECT USING (
  auth_id = auth.uid() OR
  (is_current_user_admin() AND org_id = get_current_employee_org())
);
CREATE POLICY "emp_insert" ON fs_employees FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "emp_update" ON fs_employees FOR UPDATE USING (
  auth_id = auth.uid() OR is_current_user_admin()
);

-- ATTENDANCE: own records OR admin sees org
CREATE POLICY "att_select" ON fs_attendance FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "att_insert" ON fs_attendance FOR INSERT WITH CHECK (
  employee_id = get_current_employee_id()
);
CREATE POLICY "att_update" ON fs_attendance FOR UPDATE USING (
  employee_id = get_current_employee_id()
);

-- LEAVE BALANCES: own OR admin
CREATE POLICY "lb_select" ON fs_leave_balances FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "lb_update" ON fs_leave_balances FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "lb_insert" ON fs_leave_balances FOR INSERT WITH CHECK (is_current_user_admin());

-- LEAVE REQUESTS: own OR admin
CREATE POLICY "lr_select" ON fs_leave_requests FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "lr_insert" ON fs_leave_requests FOR INSERT WITH CHECK (
  employee_id = get_current_employee_id()
);
CREATE POLICY "lr_update" ON fs_leave_requests FOR UPDATE USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);

-- TASKS: own OR admin
CREATE POLICY "tasks_select" ON fs_tasks FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "tasks_insert" ON fs_tasks FOR INSERT WITH CHECK (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "tasks_update" ON fs_tasks FOR UPDATE USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "tasks_delete" ON fs_tasks FOR DELETE USING (is_current_user_admin());

-- EOD REPORTS: own OR admin
CREATE POLICY "eod_select" ON fs_eod_reports FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "eod_insert" ON fs_eod_reports FOR INSERT WITH CHECK (
  employee_id = get_current_employee_id()
);
CREATE POLICY "eod_update" ON fs_eod_reports FOR UPDATE USING (
  employee_id = get_current_employee_id()
);

-- OKRs: own OR admin
CREATE POLICY "okr_select" ON fs_okrs FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "okr_insert" ON fs_okrs FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "okr_update" ON fs_okrs FOR UPDATE USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);

-- KEY RESULTS: through OKR relationship
CREATE POLICY "kr_select" ON fs_key_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM fs_okrs WHERE fs_okrs.id = fs_key_results.okr_id
    AND (fs_okrs.employee_id = get_current_employee_id() OR is_current_user_admin())
  )
);
CREATE POLICY "kr_insert" ON fs_key_results FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "kr_update" ON fs_key_results FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM fs_okrs WHERE fs_okrs.id = fs_key_results.okr_id
    AND (fs_okrs.employee_id = get_current_employee_id() OR is_current_user_admin())
  )
);

-- FEEDBACK: from me, to me, or admin
CREATE POLICY "fb_select" ON fs_feedback FOR SELECT USING (
  from_employee_id = get_current_employee_id() OR
  to_employee_id = get_current_employee_id() OR
  is_current_user_admin()
);
CREATE POLICY "fb_insert" ON fs_feedback FOR INSERT WITH CHECK (
  from_employee_id = get_current_employee_id()
);

-- APPRAISALS: own OR admin
CREATE POLICY "appr_select" ON fs_appraisals FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "appr_update" ON fs_appraisals FOR UPDATE USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "appr_insert" ON fs_appraisals FOR INSERT WITH CHECK (is_current_user_admin());

-- PAYROLL: own OR admin
CREATE POLICY "pay_select" ON fs_payroll FOR SELECT USING (
  employee_id = get_current_employee_id() OR is_current_user_admin()
);
CREATE POLICY "pay_insert" ON fs_payroll FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "pay_update" ON fs_payroll FOR UPDATE USING (is_current_user_admin());

-- NOTIFICATIONS: own only
CREATE POLICY "notif_select" ON fs_notifications FOR SELECT USING (
  recipient_id = get_current_employee_id()
);
CREATE POLICY "notif_insert" ON fs_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON fs_notifications FOR UPDATE USING (
  recipient_id = get_current_employee_id()
);

-- ANNOUNCEMENTS: same org
CREATE POLICY "ann_select" ON fs_announcements FOR SELECT USING (
  org_id = get_current_employee_org()
);
CREATE POLICY "ann_insert" ON fs_announcements FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "ann_update" ON fs_announcements FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "ann_delete" ON fs_announcements FOR DELETE USING (is_current_user_admin());

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE fs_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE fs_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE fs_leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE fs_announcements;
