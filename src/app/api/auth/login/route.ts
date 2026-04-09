import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dcyasohbdcnxejxhsjai.supabase.co"
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeWFzb2hiZGNueGVqeGhzamFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzMyNzcsImV4cCI6MjA5MTIwOTI3N30.8x8uSX1QFSY4hnIMt1eXD-Zb7JuE2yajyNjNyE5u3-Y"

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
          // ignore
        }
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: employee } = await supabase
      .from("fs_employees")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single()

    return NextResponse.json({
      redirect: employee?.is_admin ? "/overview" : "/my-dashboard"
    })
  }

  return NextResponse.json({ error: "Login failed" }, { status: 401 })
}
