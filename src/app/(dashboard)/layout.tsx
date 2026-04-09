"use client"

import { useEffect, useState } from "react"
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

  // Prevent mobile back button from exiting the web app.
  // We push a guard entry on mount. When back is pressed and the guard
  // is popped, we push it again and redirect to the dashboard.
  useEffect(() => {
    // Only apply on mobile-sized screens to avoid affecting desktop
    if (window.innerWidth > 1024) return

    const GUARD = "__dashboard_guard__"

    // Push guard entry
    if (!window.history.state?.[GUARD]) {
      window.history.replaceState({ ...window.history.state, [GUARD]: true }, "")
      window.history.pushState({ [GUARD]: true }, "", window.location.href)
    }

    function handlePopState() {
      // The guard was popped — push it back and go to dashboard
      window.history.pushState({ [GUARD]: true }, "", window.location.href)

      if (window.location.pathname !== "/my-dashboard") {
        window.location.href = "/my-dashboard"
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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
