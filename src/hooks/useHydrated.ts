"use client";

import { useEffect, useState } from "react";

/** True only after the first client render. Use before reading persisted (LocalStorage) state. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}
