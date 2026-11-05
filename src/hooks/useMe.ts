"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Me {
  user: { id: string; username: string; role: "admin" | "pharmacy" | "warehouse"; displayName: string } | null;
  pharmacy?: { id: string; name: string; status: string; subscription: string; endDate: string | null } | null;
  warehouse?: { id: string; name: string; status: string } | null;
}

/** Current server session (cookie). `loading` until the first answer. */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const r = await api<Me>("/api/auth/me");
    setMe(r.ok ? r.data : { user: null });
    setLoading(false);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { me, loading, refresh };
}
