import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // If Supabase not configured, show login page (for UI preview)
  if (!supabaseUrl || supabaseUrl === "your_supabase_url_here") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: employee } = await supabase
    .from("fs_employees")
    .select("is_admin")
    .eq("auth_id", user.id)
    .single();

  redirect(employee?.is_admin ? "/overview" : "/my-dashboard");
}
