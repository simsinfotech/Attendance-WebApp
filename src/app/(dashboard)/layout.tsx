"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { UserProvider } from "@/hooks/use-user"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <UserProvider>
      <div className="min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        {/* Main area */}
        <div
          className={cn(
            "transition-all duration-300",
            collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"
          )}
        >
          <Topbar />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  )
}
