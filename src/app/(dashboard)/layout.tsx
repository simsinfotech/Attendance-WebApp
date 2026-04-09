"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
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
  const pathname = usePathname()
  const router = useRouter()

  // Prevent mobile back button from exiting the app.
  // Push a dummy history entry so pressing back pops it instead of leaving.
  // Then listen for popstate — if user would exit, redirect to dashboard.
  useEffect(() => {
    const homePath = "/my-dashboard"

    function handlePopState() {
      // Re-push the guard entry so the next back press is also caught
      window.history.pushState(null, "", window.location.href)
      // Navigate to the dashboard (or previous logical page)
      if (pathname !== homePath) {
        router.push(homePath)
      }
    }

    // Push an extra history entry as a guard
    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [pathname, router])

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
