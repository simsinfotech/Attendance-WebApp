"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Employee } from "@/types"
import type { User } from "@supabase/supabase-js"

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

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()

        if (!cancelled) {
          setUser(data.user)
          setEmployee(data.employee)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
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
