import type { SupabaseClient } from "@supabase/supabase-js"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value)
}

/**
 * Find a Supabase auth user id that corresponds to an employee record.
 *
 * First tries the stored `auth_id`. If that's missing or not a valid UUID,
 * falls back to listing auth users and matching by email (checking the
 * `emailHint` first, then the stored employee email).
 *
 * Returns the resolved auth_id, or null if no matching user was found.
 */
export async function resolveAuthId(
  admin: SupabaseClient,
  target: { auth_id?: string | null; email?: string | null },
  emailHint?: string | null
): Promise<string | null> {
  if (isValidUuid(target.auth_id)) {
    return target.auth_id
  }

  const candidates = [emailHint, target.email]
    .filter((e): e is string => typeof e === "string" && e.length > 0)
    .map((e) => e.trim().toLowerCase())

  if (candidates.length === 0) return null

  // Paginate through auth users until we find a match
  let page = 1
  const perPage = 1000
  // Hard cap to avoid runaway loops
  const maxPages = 20

  while (page <= maxPages) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return null
    const users = data?.users ?? []
    if (users.length === 0) return null

    const match = users.find((u) => {
      const email = u.email?.toLowerCase()
      return email && candidates.includes(email)
    })
    if (match) return match.id

    if (users.length < perPage) return null
    page++
  }

  return null
}
