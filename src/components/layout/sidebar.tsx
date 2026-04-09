"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import {
  LayoutDashboard,
  UserCircle,
  Users,
  Clock,
  CalendarOff,
  ListTodo,
  FileText,
  Target,
  MessageSquare,
  Award,
  CreditCard,
  Bell,
  Megaphone,
  Settings,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OrgSwitcher } from "./org-switcher"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const adminNav = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "My Dashboard", href: "/my-dashboard", icon: UserCircle },
  { label: "Team", href: "/team", icon: Users },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Leave", href: "/leave", icon: CalendarOff },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "EOD Reports", href: "/eod-reports", icon: FileText },
  { label: "Payroll", href: "/payroll", icon: CreditCard },
  { label: "OKRs", href: "/okrs", icon: Target },
  { label: "Feedback", href: "/feedback", icon: MessageSquare },
  { label: "Appraisals", href: "/appraisals", icon: Award },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Settings", href: "/settings", icon: Settings },
]

const employeeNav = [
  { label: "My Dashboard", href: "/my-dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Leave", href: "/leave", icon: CalendarOff },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "EOD Reports", href: "/eod-reports", icon: FileText },
  { label: "Payroll", href: "/payroll", icon: CreditCard },
  { label: "OKRs", href: "/okrs", icon: Target },
  { label: "Feedback", href: "/feedback", icon: MessageSquare },
  { label: "Appraisals", href: "/appraisals", icon: Award },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
]

function groupNavItems(nav: NavItem[], isAdmin: boolean): NavSection[] {
  const map = new Map<string, NavItem[]>()
  const sectionOrder: string[] = []

  const getSectionName = (label: string): string => {
    if (label === "Overview" || label === "My Dashboard" || label === "Team") return "Main"
    if (["Attendance", "Leave", "Tasks", "EOD Reports"].includes(label)) return "Work"
    if (label === "Payroll") return "Finance"
    if (["OKRs", "Feedback", "Appraisals"].includes(label)) return "Performance"
    if (label === "Announcements") return "Communication"
    if (label === "Settings") return "System"
    return "Other"
  }

  for (const item of nav) {
    const section = getSectionName(item.label)
    if (!map.has(section)) {
      map.set(section, [])
      sectionOrder.push(section)
    }
    map.get(section)!.push(item)
  }

  return sectionOrder.map((title) => ({ title, items: map.get(title)! }))
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { isAdmin, employee } = useUser()
  const nav = isAdmin ? adminNav : employeeNav
  const sections = groupNavItems(nav, isAdmin)

  const initials = employee?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen glass-strong transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href={isAdmin ? "/overview" : "/my-dashboard"} className="flex items-center gap-2 group">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shadow-lg transition-shadow overflow-hidden",
              isAdmin
                ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20 group-hover:shadow-indigo-500/40"
                : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20 group-hover:shadow-emerald-500/40"
            )}>
              <img src="/sims-logo.png" alt="SW" className="h-7 w-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight leading-tight">Sims Workspace</span>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider leading-tight",
                isAdmin ? "text-indigo-500" : "text-emerald-500"
              )}>
                {isAdmin ? "Admin Panel" : "Employee Portal"}
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href={isAdmin ? "/overview" : "/my-dashboard"} className="mx-auto" title="Sims Workspace">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shadow-lg overflow-hidden",
              isAdmin
                ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20"
                : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20"
            )}>
              <img src="/sims-logo.png" alt="SW" className="h-7 w-auto object-contain" />
            </div>
          </Link>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 shrink-0 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 transition-transform" />
          </Button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 shrink-0 hover:bg-gray-100"
            title="Expand sidebar"
          >
            <ChevronLeft className="h-4 w-4 transition-transform rotate-180" />
          </Button>
        </div>
      )}

      {/* Org Switcher -- admin only */}
      {isAdmin && !collapsed && (
        <div className="px-3 py-3 border-b border-gray-200">
          <OrgSwitcher />
        </div>
      )}

      {/* Nav */}
      <ScrollArea className="flex-1 py-2 scrollbar-thin">
        <nav className="px-3">
          {sections.map((section, sectionIdx) => (
            <div key={section.title} className={cn(sectionIdx > 0 && "mt-2")}>
              {/* Section label */}
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {section.title}
                  </span>
                  <div className="flex-1 h-px bg-gray-50" />
                </div>
              )}
              {collapsed && sectionIdx > 0 && (
                <div className="mx-3 my-2 h-px bg-gray-100" />
              )}

              {/* Section items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                        isActive
                          ? isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                      )}
                    >
                      {/* Active accent bar */}
                      {isActive && (
                        <div className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full",
                          isAdmin ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                        )} />
                      )}
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? isAdmin ? "text-indigo-600" : "text-emerald-600"
                            : "group-hover:text-foreground"
                        )}
                      />
                      {!collapsed && (
                        <span className={cn("transition-colors", isActive && "font-medium")}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User info card at bottom */}
      {!collapsed && employee && (
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.full_name}
                className="w-8 h-8 rounded-full object-cover shrink-0 shadow-lg"
              />
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-lg",
                isAdmin
                  ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20"
                  : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20"
              )}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {employee.full_name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {employee.designation ?? "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
