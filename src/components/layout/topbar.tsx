"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { NotificationBell } from "./notification-bell"
import { MobileSidebar } from "./mobile-sidebar"
import { TbArrowLeft, TbLogout, TbSettings } from "react-icons/tb"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function Topbar() {
  const { employee, isAdmin } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isHome = pathname === "/my-dashboard" || pathname === "/overview"

  const greeting = useMemo(() => getGreeting(), [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const initials = employee?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-200 relative">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => router.push(isAdmin ? "/overview" : "/my-dashboard")}
            >
              <TbArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="hidden sm:block animate-fade-in">
            <h2 className="text-sm font-medium text-muted-foreground">
              {greeting},{" "}
              <span className="text-foreground font-semibold">{employee?.full_name ?? "User"}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" />}>
              <div className={cn(
                "rounded-full p-[2px]",
                isAdmin
                  ? "bg-gradient-to-br from-indigo-500 to-blue-600"
                  : "bg-gradient-to-br from-emerald-500 to-green-600"
              )}>
                <Avatar className="h-8 w-8 border-2 border-white">
                  {employee?.avatar_url && (
                    <AvatarImage src={employee.avatar_url} alt={employee.full_name} />
                  )}
                  <AvatarFallback className="bg-background text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{employee?.full_name}</p>
                <p className="text-xs text-muted-foreground">{employee?.designation}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <TbSettings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <TbLogout className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Subtle gradient accent line at bottom */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent",
        isAdmin ? "via-indigo-500/30" : "via-emerald-500/30"
      )} />
    </header>
  )
}
