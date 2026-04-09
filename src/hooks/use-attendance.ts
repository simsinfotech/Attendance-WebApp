"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "./use-user"
import type { Attendance } from "@/types"
import { format } from "date-fns"
import { OFFICE_TIMINGS } from "@/lib/config"

export function useAttendance() {
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(true)
  const { employee } = useUser()
  const supabase = createClient()

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    if (!employee) return

    async function fetchToday() {
      const { data } = await supabase
        .from("fs_attendance")
        .select("*")
        .eq("employee_id", employee!.id)
        .eq("date", today)
        .maybeSingle()
      setTodayRecord(data)
      setLoading(false)
    }

    fetchToday()
  }, [employee?.id, today])

  async function checkIn(lat: number, lng: number, address: string) {
    if (!employee) throw new Error("Not logged in")

    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const isLate =
      hour > OFFICE_TIMINGS.startHour ||
      (hour === OFFICE_TIMINGS.startHour && minute > OFFICE_TIMINGS.startMinute)
    const status = isLate ? "late" : "present"

    const { data, error } = await supabase
      .from("fs_attendance")
      .insert({
        employee_id: employee.id,
        date: today,
        check_in: now.toISOString(),
        check_in_lat: lat,
        check_in_lng: lng,
        check_in_address: address,
        status,
      })
      .select()
      .single()

    if (error) throw error
    setTodayRecord(data)
    return data
  }

  async function checkOut(lat: number, lng: number, address: string) {
    if (!employee || !todayRecord) throw new Error("No check-in found")

    const now = new Date()
    const checkInTime = new Date(todayRecord.check_in)
    const hoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

    let status = todayRecord.status
    if (hoursWorked < OFFICE_TIMINGS.halfDayThreshold) status = "half_day"

    const { data, error } = await supabase
      .from("fs_attendance")
      .update({
        check_out: now.toISOString(),
        check_out_lat: lat,
        check_out_lng: lng,
        check_out_address: address,
        work_hours: Math.round(hoursWorked * 100) / 100,
        status,
      })
      .eq("id", todayRecord.id)
      .select()
      .single()

    if (error) throw error
    setTodayRecord(data)
    return data
  }

  const isCheckedIn = !!todayRecord?.check_in && !todayRecord?.check_out
  const isCheckedOut = !!todayRecord?.check_out

  return {
    todayRecord,
    isCheckedIn,
    isCheckedOut,
    loading,
    checkIn,
    checkOut,
  }
}
