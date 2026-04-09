import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null, employee: null })
  }

  const { data: employee } = await supabase
    .from("fs_employees")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle()

  return NextResponse.json({ user, employee })
}
