"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useOrg } from "@/hooks/use-org"
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
import {
  TbPlus,
  TbLoader2,
  TbPin,
  TbTrash,
  TbSpeakerphone,
  TbClock,
  TbUser,
  TbAlertCircle,
  TbPinnedOff,
} from "react-icons/tb"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { Announcement } from "@/types"

const priorityConfig: Record<
  string,
  { dot: string; border: string; badge: string; label: string }
> = {
  urgent: {
    dot: "bg-red-500",
    border: "border-l-red-500",
    badge: "bg-red-50 text-red-600 border-red-200",
    label: "Urgent",
  },
  high: {
    dot: "bg-orange-500",
    border: "border-l-orange-500",
    badge: "bg-orange-50 text-orange-600 border-orange-200",
    label: "High",
  },
  normal: {
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    label: "Normal",
  },
  low: {
    dot: "bg-gray-400",
    border: "border-l-gray-400",
    badge: "bg-gray-50 text-muted-foreground border-gray-200",
    label: "Low",
  },
}

export default function AnnouncementsPage() {
  const { employee, isAdmin } = useUser()
  const orgId = useOrg()
  const supabase = createClient()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    if (!employee) return
    fetchData()

    const channel = supabase
      .channel("announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fs_announcements" },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employee?.id, orgId])

  async function fetchData() {
    const { data } = await supabase
      .from("fs_announcements")
      .select("*, author:fs_employees!created_by(*)")
      .eq("org_id", orgId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
    if (data) setAnnouncements(data as Announcement[])
  }

  async function deleteAnnouncement(id: string) {
    const { error } = await supabase
      .from("fs_announcements")
      .delete()
      .eq("id", id)
    if (error) {
      toast.error("Failed to delete")
    } else {
      toast.success("Announcement deleted")
      fetchData()
    }
  }

  async function togglePin(id: string, currentPin: boolean) {
    await supabase
      .from("fs_announcements")
      .update({ is_pinned: !currentPin })
      .eq("id", id)
    fetchData()
  }

  const pinned = announcements.filter((a) => a.is_pinned)
  const regular = announcements.filter((a) => !a.is_pinned)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/25">
            <TbSpeakerphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground">
              Company-wide updates and notices
            </p>
          </div>
        </div>
        {isAdmin && (
          <NewAnnouncementDialog
            orgId={orgId}
            createdBy={employee?.id}
            onSuccess={fetchData}
          />
        )}
      </div>

      {/* Empty State */}
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <TbSpeakerphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">
            No announcements yet
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            {isAdmin
              ? "Create the first announcement to keep your team informed"
              : "Announcements from your organization will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinned.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TbPin className="h-3.5 w-3.5" />
                <span>Pinned</span>
              </div>
              <div className="space-y-3">
                {pinned.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    isAdmin={isAdmin}
                    onDelete={deleteAnnouncement}
                    onTogglePin={togglePin}
                    isPinned
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Section */}
          {regular.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TbClock className="h-3.5 w-3.5" />
                  <span>Recent</span>
                </div>
              )}
              <div className="space-y-3">
                {regular.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    isAdmin={isAdmin}
                    onDelete={deleteAnnouncement}
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({
  announcement: a,
  isAdmin,
  onDelete,
  onTogglePin,
  isPinned,
}: {
  announcement: Announcement
  isAdmin: boolean
  onDelete: (id: string) => void
  onTogglePin: (id: string, currentPin: boolean) => void
  isPinned?: boolean
}) {
  const config = priorityConfig[a.priority] ?? priorityConfig.normal

  return (
    <div
      className={`group relative rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg overflow-hidden ${
        isPinned ? "ring-1 ring-purple-200" : ""
      }`}
    >
      {/* Priority left border */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${config.dot} rounded-l-xl`} />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isPinned && (
                <TbPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              )}
              <h3 className="font-semibold text-[15px] leading-tight">
                {a.title}
              </h3>
              <Badge
                variant="secondary"
                className={`text-[11px] px-2 py-0 h-5 border ${config.badge}`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full mr-1.5 ${config.dot}`}
                />
                {config.label}
              </Badge>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
              {a.content}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <TbUser className="h-3 w-3" />
                <span>{a.author?.full_name ?? "Admin"}</span>
              </div>
              <span className="text-gray-200">|</span>
              <div className="flex items-center gap-1.5">
                <TbClock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(a.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-purple-50"
                onClick={() => onTogglePin(a.id, a.is_pinned)}
                title={a.is_pinned ? "Unpin" : "Pin to top"}
              >
                {a.is_pinned ? (
                  <TbPinnedOff className="h-4 w-4 text-purple-600" />
                ) : (
                  <TbPin className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-red-50"
                onClick={() => onDelete(a.id)}
                title="Delete"
              >
                <TbTrash className="h-4 w-4 text-muted-foreground hover:text-red-600" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewAnnouncementDialog({
  orgId,
  createdBy,
  onSuccess,
}: {
  orgId: string
  createdBy?: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState("normal")
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !content || !createdBy) return
    setLoading(true)

    const { error } = await supabase.from("fs_announcements").insert({
      org_id: orgId,
      title,
      content,
      priority,
      is_pinned: isPinned,
      created_by: createdBy,
    })

    if (error) {
      toast.error("Failed to create announcement")
    } else {
      toast.success("Announcement posted!")
      setOpen(false)
      setTitle("")
      setContent("")
      setPriority("normal")
      setIsPinned(false)
      onSuccess()
    }
    setLoading(false)
  }

  const priorities = [
    { value: "low", label: "Low", color: "bg-gray-400", ring: "ring-gray-400/30" },
    { value: "normal", label: "Normal", color: "bg-emerald-500", ring: "ring-emerald-200" },
    { value: "high", label: "High", color: "bg-orange-500", ring: "ring-orange-500/30" },
    { value: "urgent", label: "Urgent", color: "bg-red-500", ring: "ring-red-500/30" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-purple-500/25" />
        }
      >
        <TbPlus className="mr-2 h-4 w-4" />
        New Announcement
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TbSpeakerphone className="h-5 w-5 text-purple-600" />
            Post Announcement
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              required
              className="bg-gray-50 border-gray-200 focus:border-purple-500/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement details..."
              rows={4}
              required
              className="bg-gray-50 border-gray-200 focus:border-purple-500/50 resize-none"
            />
          </div>

          {/* Priority pills */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border ${
                    priority === p.value
                      ? `${p.ring} ring-2 border-transparent bg-gray-100`
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-muted-foreground"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full ${p.color}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <TbPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pin to top</span>
            </div>
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-purple-500/25"
            disabled={loading}
          >
            {loading && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Announcement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
