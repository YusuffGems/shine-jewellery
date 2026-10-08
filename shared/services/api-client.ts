/* Typed fetch wrapper for Phase 2 (NEXT_PUBLIC_DATA_MODE=api).
   Services keep their signatures; their bodies switch from db.update() to these calls. */
import { SITE } from "@/config/site";

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  if (!res.ok) {
    let code = "request_failed";
    try {
      code = ((await res.json()) as { error?: string }).error ?? code;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, code);
  }
  return res.json() as Promise<T>;
}

export const isApiMode = () => SITE.dataMode === "api";
