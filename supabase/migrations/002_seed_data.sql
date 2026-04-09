-- FieldScore HR — Seed Data
-- Run AFTER creating auth users in Supabase Dashboard
-- Replace auth_id UUIDs with actual auth.users IDs after creating accounts

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
INSERT INTO fs_organizations (id, name, code) VALUES
  ('ORG-001', 'SimsInfotech', 'SIMS'),
  ('ORG-002', 'Estate Hive', 'EHIVE');

-- ============================================================
-- EMPLOYEES
-- After creating auth users, update auth_id for each employee
-- ============================================================
INSERT INTO fs_employees (id, org_id, full_name, email, designation, department, date_of_joining, is_admin) VALUES
  -- Admin (Shamique Hussain — CEO of both companies)
  ('00000000-0000-0000-0000-000000000001', 'ORG-001', 'Shamique Hussain', 'shamique@simsinfotech.com', 'CEO', 'Management', '2024-01-01', true),

  -- SimsInfotech Employees
  ('00000000-0000-0000-0000-000000000002', 'ORG-001', 'Arjun Mehta', 'arjun@simsinfotech.com', 'Full Stack Developer', 'Engineering', '2024-03-15', false),
  ('00000000-0000-0000-0000-000000000003', 'ORG-001', 'Priya Sharma', 'priya@simsinfotech.com', 'UI/UX Designer', 'Design', '2024-04-01', false),
  ('00000000-0000-0000-0000-000000000004', 'ORG-001', 'Rahul Verma', 'rahul@simsinfotech.com', 'Backend Developer', 'Engineering', '2024-06-10', false),
  ('00000000-0000-0000-0000-000000000005', 'ORG-001', 'Sneha Patel', 'sneha@simsinfotech.com', 'QA Engineer', 'Engineering', '2024-07-20', false),
  ('00000000-0000-0000-0000-000000000006', 'ORG-001', 'Vikram Singh', 'vikram@simsinfotech.com', 'DevOps Engineer', 'Engineering', '2024-09-01', false),
  ('00000000-0000-0000-0000-000000000007', 'ORG-001', 'Anita Desai', 'anita@simsinfotech.com', 'Project Manager', 'Management', '2024-02-15', false),

  -- Estate Hive Employee
  ('00000000-0000-0000-0000-000000000008', 'ORG-002', 'Karan Malhotra', 'karan@estatehive.com', 'Property Manager', 'Operations', '2025-01-10', false);

-- ============================================================
-- LEAVE BALANCES 2026
-- ============================================================
INSERT INTO fs_leave_balances (employee_id, year, casual_total, casual_used, sick_total, sick_used, earned_total, earned_used) VALUES
  ('00000000-0000-0000-0000-000000000001', 2026, 12, 0, 6, 0, 15, 0),
  ('00000000-0000-0000-0000-000000000002', 2026, 12, 2, 6, 1, 15, 0),
  ('00000000-0000-0000-0000-000000000003', 2026, 12, 1, 6, 0, 15, 0),
  ('00000000-0000-0000-0000-000000000004', 2026, 12, 0, 6, 0, 15, 0),
  ('00000000-0000-0000-0000-000000000005', 2026, 12, 3, 6, 2, 15, 1),
  ('00000000-0000-0000-0000-000000000006', 2026, 12, 1, 6, 0, 15, 0),
  ('00000000-0000-0000-0000-000000000007', 2026, 12, 2, 6, 1, 15, 2),
  ('00000000-0000-0000-0000-000000000008', 2026, 12, 0, 6, 0, 15, 0);

-- ============================================================
-- SAMPLE ANNOUNCEMENTS
-- ============================================================
INSERT INTO fs_announcements (org_id, title, content, priority, is_pinned, created_by) VALUES
  ('ORG-001', 'Welcome to FieldScore HR!', 'We are excited to launch our new HR management platform. Please explore the dashboard and update your profiles.', 'high', true, '00000000-0000-0000-0000-000000000001'),
  ('ORG-001', 'Q2 2026 Goals Meeting', 'Team meeting scheduled for April 15th to discuss Q2 objectives and key results.', 'normal', false, '00000000-0000-0000-0000-000000000001'),
  ('ORG-002', 'Estate Hive — Property Review', 'Monthly property portfolio review scheduled for April 12th.', 'normal', false, '00000000-0000-0000-0000-000000000001');
