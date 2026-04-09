"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useAttendance } from "@/hooks/use-attendance"
import { MapPin, Clock, LogIn, LogOut, Loader2, Wifi, Building2 } from "lucide-react"
import { toast } from "sonner"
import { OFFICE_TIMINGS } from "@/lib/config"

export function CheckinCard() {
  const [time, setTime] = useState<Date | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { getLocation, loading: geoLoading } = useGeolocation()
  const { todayRecord, isCheckedIn, isCheckedOut, loading, checkIn, checkOut } =
    useAttendance()

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function handleCheckIn() {
    setActionLoading(true)
    try {
      const { lat, lng, address } = await getLocation()
      await checkIn(lat, lng, address)
      toast.success("Checked in successfully!")
    } catch (err: any) {
      toast.error(err.message || "Check-in failed")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCheckOut() {
    setActionLoading(true)
    try {
      const { lat, lng, address } = await getLocation()
      await checkOut(lat, lng, address)
      toast.success("Checked out successfully!")
    } catch (err: any) {
      toast.error(err.message || "Check-out failed")
    } finally {
      setActionLoading(false)
    }
  }

  const isLoading = actionLoading || geoLoading

  // Calculate working duration
  const getWorkingDuration = () => {
    if (!todayRecord?.check_in) return null
    const checkInTime = new Date(todayRecord.check_in)
    const now = isCheckedOut && todayRecord.check_out ? new Date(todayRecord.check_out) : new Date()
    const diffMs = now.getTime() - checkInTime.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="relative">
      {/* Outer glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/15 via-green-500/15 to-teal-500/15 rounded-2xl blur-sm" />

      <GlassCard variant="strong" className="relative overflow-hidden rounded-2xl border border-gray-200">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/8 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-violet-500/8 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative space-y-8 py-4">
          {/* Live clock section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Live</span>
            </div>

            <p className="text-6xl sm:text-7xl font-bold tracking-tight tabular-nums bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              {time ? format(time, "HH:mm") : "--:--"}
              <span className="text-3xl sm:text-4xl text-muted-foreground/50">
                :{time ? format(time, "ss") : "--"}
              </span>
            </p>
            <p className="text-muted-foreground mt-2 text-sm tracking-wide">
              {time ? format(time, "EEEE, MMMM d, yyyy") : "\u00A0"}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-600 font-medium">
              <Building2 className="h-3 w-3" />
              Office Hours: {OFFICE_TIMINGS.label}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex justify-center">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading status...</span>
              </div>
            ) : isCheckedOut ? (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-emerald-600">
                  Day Complete -- {todayRecord?.work_hours?.toFixed(1)}h worked
                </span>
              </div>
            ) : isCheckedIn ? (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200">
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">
                  Working since {format(new Date(todayRecord!.check_in), "hh:mm a")}
                </span>
                {getWorkingDuration() && (
                  <>
                    <span className="text-emerald-600/30">|</span>
                    <Clock className="h-3.5 w-3.5 text-emerald-600/70" />
                    <span className="text-sm text-emerald-600/70 tabular-nums">{getWorkingDuration()}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-sm text-muted-foreground">Not checked in yet</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex justify-center">
            {!isCheckedOut && (
              <div className="relative group">
                {/* Button glow */}
                <div className={`absolute -inset-1 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300 ${
                  isCheckedIn
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500"
                }`} />
                <Button
                  size="lg"
                  onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                  disabled={isLoading || loading}
                  className={`relative w-56 h-14 text-base font-semibold rounded-xl transition-all duration-300 ${
                    isCheckedIn
                      ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                  ) : isCheckedIn ? (
                    <LogOut className="mr-2.5 h-5 w-5" />
                  ) : (
                    <LogIn className="mr-2.5 h-5 w-5" />
                  )}
                  {isCheckedIn ? "Check Out" : "Check In"}
                </Button>
              </div>
            )}
          </div>

          {/* Location info */}
          {todayRecord?.check_in_address && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 max-w-md">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="text-xs text-muted-foreground truncate">{todayRecord.check_in_address}</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
