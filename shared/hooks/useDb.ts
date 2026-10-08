"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { db } from "@/lib/store/db";
import type { Database } from "@/types";

export function useDb(): Database {
  return useSyncExternalStore(db.subscribe, db.get, db.getServerSnapshot);
}

/** True after the client has loaded persisted data — use to avoid flashing seed-only UI. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(db.isHydrated());
  useEffect(() => {
    if (db.isHydrated()) setReady(true);
    return db.subscribe(() => setReady(db.isHydrated()));
  }, []);
  return ready;
}
