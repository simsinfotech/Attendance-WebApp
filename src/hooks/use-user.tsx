"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { Employee } from "@/types"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

interface UseUserReturn {
  user: User | null
  employee: Employee | null
  isAdmin: boolean
  isLoading: boolean
}

const UserContext = createContext<UseUserReturn>({
  user: null,
  employee: null,
  isAdmin: false,
  isLoading: true,
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function fetchEmployee(authId: string) {
      const { data: emp, error } = await supabase
        .from("fs_employees")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle()
      if (error) {
        console.error("Failed to fetch employee:", error.message)
      }
      if (!cancelled) {
        setEmployee(emp)
      }
    }

    async function init() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!cancelled) {
        setUser(authUser)
        if (authUser) {
          await fetchEmployee(authUser.id)
        }
        setIsLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        await fetchEmployee(sessionUser.id)
      } else {
        setEmployee(null)
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        employee,
        isAdmin: employee?.is_admin ?? false,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UseUserReturn {
  return useContext(UserContext)
}
