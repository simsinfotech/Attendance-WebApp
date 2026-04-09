"use client"

export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry: () => void
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-gray-600 text-sm">{error.message}</p>
          <button
            onClick={() => unstable_retry()}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
