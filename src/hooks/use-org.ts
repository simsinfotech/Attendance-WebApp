"use client"

import { useState, useEffect } from "react"

export function useOrg() {
  const [orgId, setOrgId] = useState("ORG-001")

  useEffect(() => {
    const stored = localStorage.getItem("fs_selected_org")
    if (stored) setOrgId(stored)

    function handleChange(e: Event) {
      const customEvent = e as CustomEvent<string>
      setOrgId(customEvent.detail)
    }

    window.addEventListener("org-change", handleChange)
    return () => window.removeEventListener("org-change", handleChange)
  }, [])

  return orgId
}
