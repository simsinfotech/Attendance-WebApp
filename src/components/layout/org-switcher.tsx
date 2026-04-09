"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"

const ORGS = [
  { id: "ORG-001", name: "SimsInfotech" },
  { id: "ORG-002", name: "Estate Hive" },
]

export function OrgSwitcher() {
  const [selectedOrg, setSelectedOrg] = useState("ORG-001")

  useEffect(() => {
    const stored = localStorage.getItem("fs_selected_org")
    if (stored) setSelectedOrg(stored)
  }, [])

  function handleChange(value: string | null) {
    if (value === null) return
    setSelectedOrg(value)
    localStorage.setItem("fs_selected_org", value)
    window.dispatchEvent(new CustomEvent("org-change", { detail: value }))
  }

  return (
    <Select value={selectedOrg} onValueChange={handleChange}>
      <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {ORGS.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
