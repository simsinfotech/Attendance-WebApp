import { createClient as supabaseCreateClient, type SupabaseClient } from "@supabase/supabase-js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "public", any> | null = null

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dcyasohbdcnxejxhsjai.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeWFzb2hiZGNueGVqeGhzamFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzMyNzcsImV4cCI6MjA5MTIwOTI3N30.8x8uSX1QFSY4hnIMt1eXD-Zb7JuE2yajyNjNyE5u3-Y"

export function createClient() {
  if (client) return client

  client = supabaseCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}
