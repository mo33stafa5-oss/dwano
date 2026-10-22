"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadRequests, markRequestsSeen, REQUESTS_EVENT, type MedicineRequest } from "@/lib/requests";

/**
 * server : real storage is configured and the admin is logged in (data from any device)
 * locked : real storage is configured but nobody is logged in
 * local  : server not configured, falls back to requests saved in THIS browser
 */
export type RequestsMode = "loading" | "server" | "locked" | "local";

export function useRequests(enabled = true) {
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [mode, setMode] = useState<RequestsMode>("loading");
  const modeRef = useRef<RequestsMode>("loading");
  const set = (m: RequestsMode) => ((modeRef.current = m), setMode(m));

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/admin/requests", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { requests: MedicineRequest[] };
        set("server");
        return setRequests(json.requests);
      }
      if (res.status === 401) {
        set("locked");
        return setRequests([]);
      }
    } catch {
      /* fall through to local */
    }
    set("local");
    setRequests(loadRequests());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const poll = setInterval(refresh, 30_000);
    const onLocal = () => modeRef.current === "local" && refresh();
    window.addEventListener(REQUESTS_EVENT, onLocal);
    window.addEventListener("storage", onLocal);
    return () => {
      clearInterval(poll);
      window.removeEventListener(REQUESTS_EVENT, onLocal);
      window.removeEventListener("storage", onLocal);
    };
  }, [enabled, refresh]);

  const markAllSeen = useCallback(async () => {
    if (modeRef.current === "server") {
      const ids = requests.filter((r) => !r.seen).map((r) => r.id);
      if (ids.length === 0) return;
      await fetch("/api/admin/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }).catch(() => {});
      refresh();
    } else if (modeRef.current === "local") {
      markRequestsSeen();
    }
  }, [requests, refresh]);

  const login = useCallback(
    async (password: string) => {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (res.ok) {
        await refresh();
        return { ok: true as const };
      }
      return { ok: false as const, error: res.status === 401 ? "كلمة المرور غير صحيحة." : "تسجيل الدخول غير مفعّل على الخادم." };
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    refresh();
  }, [refresh]);

  return { requests, mode, unseen: requests.filter((r) => !r.seen).length, markAllSeen, login, logout, refresh };
}
