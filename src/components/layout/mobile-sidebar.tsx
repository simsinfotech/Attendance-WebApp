"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Menu, LayoutDashboard, UserCircle, Users, Clock, CalendarOff, ListTodo, FileText, Target, MessageSquare, Award, CreditCard, Megaphone, Settings } from "lucide-react"
import { OrgSwitcher } from "./org-switcher"

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

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { isAdmin } = useUser()
  const nav = isAdmin ? adminNav : employeeNav

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" />}>
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 glass-strong">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center mr-2",
            isAdmin
              ? "bg-gradient-to-br from-indigo-500 to-blue-600"
              : "bg-gradient-to-br from-emerald-500 to-green-600"
          )}>
            <span className="text-sm font-bold text-white">SW</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">Sims Workspace</span>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-wider leading-tight",
              isAdmin ? "text-indigo-500" : "text-emerald-500"
            )}>
              {isAdmin ? "Admin Panel" : "Employee Portal"}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="px-3 py-3 border-b border-gray-200">
            <OrgSwitcher />
          </div>
        )}

        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
