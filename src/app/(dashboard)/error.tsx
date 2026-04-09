"use client"

import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="glass rounded-2xl p-8 text-center max-w-md space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-gray-500">{error.message}</p>
        <button
          onClick={() => unstable_retry()}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-all text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
