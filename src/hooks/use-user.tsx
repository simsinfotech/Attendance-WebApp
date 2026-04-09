"use client"

import {
  createContext,
  useCallback,
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
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UseUserReturn>({
  user: null,
  employee: null,
  isAdmin: false,
  isLoading: true,
  refreshUser: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setUser(data.user)
      setEmployee(data.employee)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <UserContext.Provider
      value={{
        user,
        employee,
        isAdmin: employee?.is_admin ?? false,
        isLoading,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UseUserReturn {
  return useContext(UserContext)
}
