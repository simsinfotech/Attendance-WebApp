"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import type { LeaveBalance } from "@/types"

interface LeaveRequestFormProps {
  balance: LeaveBalance | null
  onSuccess: () => void
}

export function LeaveRequestForm({ balance, onSuccess }: LeaveRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const { employee } = useUser()
  const supabase = createClient()

  function getRemaining(type: string): number {
    if (!balance) return 0
    switch (type) {
      case "casual":
        return balance.casual_total - balance.casual_used
      case "sick":
        return balance.sick_total - balance.sick_used
      case "earned":
        return balance.earned_total - balance.earned_used
      default:
        return 0
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee || !leaveType || !startDate || !endDate) return

    const days =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1

    if (days > getRemaining(leaveType)) {
      toast.error("Insufficient leave balance")
      return
    }

    setLoading(true)
    const { error } = await supabase.from("fs_leave_requests").insert({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
    })

    if (error) {
      toast.error("Failed to submit request")
    } else {
      toast.success("Leave request submitted!")
      setOpen(false)
      setLeaveType("")
      setStartDate("")
      setEndDate("")
      setReason("")
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Request Leave
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={(v) => v !== null && setLeaveType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">
                  Casual ({getRemaining("casual")} remaining)
                </SelectItem>
                <SelectItem value="sick">
                  Sick ({getRemaining("sick")} remaining)
                </SelectItem>
                <SelectItem value="earned">
                  Earned ({getRemaining("earned")} remaining)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for leave..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
