"use client"

import { useMemo } from "react"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  isToday,
  isSameMonth,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { Attendance } from "@/types"

interface AttendanceCalendarProps {
  records: Attendance[]
  month: Date
}

const statusColors: Record<string, string> = {
  present: "bg-green-100 border-green-300",
  late: "bg-orange-100 border-orange-300",
  half_day: "bg-yellow-100 border-yellow-300",
  absent: "bg-red-100 border-red-300",
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function AttendanceCalendar({ records, month }: AttendanceCalendarProps) {
  const attendanceMap = useMemo(() => {
    const map: Record<string, Attendance> = {}
    records.forEach((r) => {
      map[r.date] = r
    })
    return map
  }, [records])

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  })

  const startDay = getDay(startOfMonth(month))

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const record = attendanceMap[dateStr]
          const isSunday = getDay(day) === 0

          return (
            <div
              key={dateStr}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg border border-transparent text-xs transition-colors",
                record && statusColors[record.status],
                !record && !isSunday && isSameMonth(day, month) && "bg-gray-50",
                isSunday && "text-muted-foreground/50",
                isToday(day) && "ring-1 ring-primary"
              )}
            >
              <span className="font-medium">{format(day, "d")}</span>
              {record && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {record.work_hours ? `${record.work_hours}h` : ""}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded", color)} />
            <span className="text-xs text-muted-foreground capitalize">
              {status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
