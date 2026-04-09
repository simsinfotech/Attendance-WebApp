"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
import { GlassCard } from "@/components/shared/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Loader2, Star, MessageSquare, Send, Eye, EyeOff, TrendingUp, ArrowUpRight, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { Feedback, Employee } from "@/types"

/* ---------- Interactive star rating ---------- */
function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  size?: "sm" | "md" | "lg"
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)

  const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-7 w-7" }
  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((v) => {
        const filled = v <= (hovered || value)
        return (
          <button
            key={v}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(v)}
            onMouseEnter={() => !readonly && setHovered(v)}
            className={`relative p-0.5 transition-transform duration-150 ${
              !readonly ? "hover:scale-125 cursor-pointer" : "cursor-default"
            }`}
          >
            <Star
              className={`${iconSize} transition-all duration-200 ${
                filled
                  ? "text-amber-600 fill-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "text-gray-300"
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function FeedbackPage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [givenFeedback, setGivenFeedback] = useState<Feedback[]>([])
  const [receivedFeedback, setReceivedFeedback] = useState<Feedback[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    if (!employee) return
    fetchData()
  }, [employee?.id, orgId])

  async function fetchData() {
    const [given, received, emps] = await Promise.all([
      supabase
        .from("fs_feedback")
        .select("*, to_employee:fs_employees!to_employee_id(*)")
        .eq("from_employee_id", employee!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("fs_feedback")
        .select("*, from_employee:fs_employees!from_employee_id(*)")
        .eq("to_employee_id", employee!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("fs_employees")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true),
    ])

    if (given.data) setGivenFeedback(given.data as Feedback[])
    if (received.data) setReceivedFeedback(received.data as Feedback[])
    if (emps.data) setEmployees(emps.data.filter((e: Employee) => e.id !== employee!.id))
  }

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/25">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">360 Feedback</h1>
            <p className="text-sm text-muted-foreground">Give and receive peer feedback</p>
          </div>
        </div>
        <NewFeedbackDialog
          employees={employees}
          fromId={employee?.id}
          onSuccess={fetchData}
        />
      </div>

      {/* ---- Tabs ---- */}
      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="received" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-rose-500/20 rounded-lg text-sm">
            Received ({receivedFeedback.length})
          </TabsTrigger>
          <TabsTrigger value="given" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-rose-500/20 rounded-lg text-sm">
            Given ({givenFeedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="space-y-4">
            {receivedFeedback.length === 0 ? (
              <EmptyFeedback message="No feedback received yet" description="When colleagues share feedback, it will appear here." />
            ) : (
              receivedFeedback.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  feedback={fb}
                  personLabel={
                    fb.is_anonymous
                      ? "Anonymous"
                      : fb.from_employee?.full_name ?? "Unknown"
                  }
                  direction="from"
                  isAnonymous={fb.is_anonymous}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="given">
          <div className="space-y-4">
            {givenFeedback.length === 0 ? (
              <EmptyFeedback message="No feedback given yet" description="Share constructive feedback with your colleagues to help them grow." />
            ) : (
              givenFeedback.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  feedback={fb}
                  personLabel={fb.to_employee?.full_name ?? "Unknown"}
                  direction="to"
                  isAnonymous={false}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------- Empty state ---------- */
function EmptyFeedback({ message, description }: { message: string; description: string }) {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-rose-100 mb-4">
        <MessageSquare className="h-8 w-8 text-pink-600" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </GlassCard>
  )
}

/* ---------- Feedback card ---------- */
function FeedbackCard({
  feedback,
  personLabel,
  direction,
  isAnonymous,
}: {
  feedback: Feedback
  personLabel: string
  direction: "from" | "to"
  isAnonymous: boolean
}) {
  return (
    <GlassCard className="space-y-4 hover:bg-gray-50 transition-colors duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isAnonymous
              ? "bg-gray-100"
              : "bg-gradient-to-br from-pink-50 to-rose-50"
          }`}>
            {isAnonymous ? (
              <EyeOff className="h-4.5 w-4.5 text-muted-foreground" />
            ) : (
              <UserCircle className="h-5 w-5 text-pink-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {personLabel}
              {isAnonymous && (
                <Badge className="ml-2 bg-gray-100 text-muted-foreground border-0 text-[10px] font-medium">
                  Anonymous
                </Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {direction === "from" ? "Shared feedback" : "Received feedback"}{" "}
              {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <StarRating value={feedback.rating} readonly size="sm" />
      </div>

      {/* Strengths and Improvements */}
      <div className="grid sm:grid-cols-2 gap-3">
        {feedback.strengths && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Strengths</span>
            </div>
            <p className="text-sm text-emerald-700 leading-relaxed">{feedback.strengths}</p>
          </div>
        )}
        {feedback.improvements && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">Growth Areas</span>
            </div>
            <p className="text-sm text-orange-700 leading-relaxed">{feedback.improvements}</p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

/* ============================================ */
/*          New Feedback Dialog                 */
/* ============================================ */
function NewFeedbackDialog({
  employees,
  fromId,
  onSuccess,
}: {
  employees: Employee[]
  fromId?: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [toId, setToId] = useState("")
  const [rating, setRating] = useState(0)
  const [strengths, setStrengths] = useState("")
  const [improvements, setImprovements] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId || !rating) return
    setLoading(true)

    const { error } = await supabase.from("fs_feedback").insert({
      from_employee_id: fromId,
      to_employee_id: toId,
      rating,
      strengths: strengths || null,
      improvements: improvements || null,
      is_anonymous: isAnonymous,
    })

    if (error) {
      toast.error("Failed to submit feedback")
    } else {
      await supabase.from("fs_notifications").insert({
        recipient_id: toId,
        type: "feedback_received",
        title: "New Feedback Received",
        message: isAnonymous
          ? "You received anonymous feedback"
          : "You received new peer feedback",
        link: "/feedback",
      })
      toast.success("Feedback submitted!")
      setOpen(false)
      setToId("")
      setRating(0)
      setStrengths("")
      setImprovements("")
      setIsAnonymous(false)
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 border-0 shadow-lg shadow-pink-500/25 text-white" />}>
        <Plus className="mr-2 h-4 w-4" />
        Give Feedback
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
              <MessageSquare className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <DialogTitle>Give Feedback</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Share constructive feedback</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Employee selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
            <Select value={toId} onValueChange={(v) => v !== null && setToId(v)}>
              <SelectTrigger className="bg-gray-100 border-gray-200">
                <SelectValue placeholder="Select colleague" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 text-[10px] font-bold">
                        {e.full_name.charAt(0)}
                      </span>
                      {e.full_name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</Label>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && (
                <span className="text-sm font-semibold text-amber-600">{rating}/5</span>
              )}
            </div>
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Strengths
            </Label>
            <Textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What are they doing well?"
              rows={2}
              className="bg-gray-100 border-emerald-200 focus:border-emerald-500/40"
            />
          </div>

          {/* Improvements */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Areas for Improvement
            </Label>
            <Textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Where can they grow?"
              rows={2}
              className="bg-gray-100 border-orange-200 focus:border-orange-500/40"
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 p-3.5">
            <div className="flex items-center gap-3">
              {isAnonymous ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Anonymous feedback</p>
                <p className="text-xs text-muted-foreground">Your name will be hidden</p>
              </div>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 border-0 shadow-lg shadow-pink-500/25 text-white"
            disabled={loading || !rating}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Feedback
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
