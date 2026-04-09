"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import type { Attendance } from "@/types"

interface AttendanceTableProps {
  records: Attendance[]
  showEmployee?: boolean
}

export function AttendanceTable({ records, showEmployee }: AttendanceTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>Employee</TableHead>}
          <TableHead>Date</TableHead>
          <TableHead>Check In</TableHead>
          <TableHead>Check Out</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Location</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={showEmployee ? 7 : 6}
              className="text-center text-muted-foreground py-8"
            >
              No attendance records found
            </TableCell>
          </TableRow>
        ) : (
          records.map((r) => (
            <TableRow key={r.id}>
              {showEmployee && (
                <TableCell className="font-medium">
                  {r.employee?.full_name ?? "—"}
                </TableCell>
              )}
              <TableCell>{format(new Date(r.date), "MMM d, yyyy")}</TableCell>
              <TableCell>
                {r.check_in ? format(new Date(r.check_in), "hh:mm a") : "—"}
              </TableCell>
              <TableCell>
                {r.check_out ? format(new Date(r.check_out), "hh:mm a") : "—"}
              </TableCell>
              <TableCell>{r.work_hours ? `${r.work_hours}h` : "—"}</TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                {r.check_in_address ?? "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    present: "bg-green-50 text-green-600 border-green-200",
    late: "bg-orange-50 text-orange-600 border-orange-200",
    half_day: "bg-yellow-50 text-yellow-600 border-yellow-200",
    absent: "bg-red-50 text-red-600 border-red-200",
  }
  return (
    <Badge className={styles[status] ?? ""}>
      {status.replace("_", " ")}
    </Badge>
  )
}
