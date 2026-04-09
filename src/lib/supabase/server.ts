import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dcyasohbdcnxejxhsjai.supabase.co"
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeWFzb2hiZGNueGVqeGhzamFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzMyNzcsImV4cCI6MjA5MTIwOTI3N30.8x8uSX1QFSY4hnIMt1eXD-Zb7JuE2yajyNjNyE5u3-Y"

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
