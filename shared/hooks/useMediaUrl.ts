"use client";
import { useEffect, useState } from "react";
import { cachedUrl, resolveUrl } from "@/lib/media/blobStore";

export function useMediaUrl(url?: string): string {
  const [resolved, setResolved] = useState<string>(() => (url ? cachedUrl(url) ?? "" : ""));
  useEffect(() => {
    let alive = true;
    if (!url) {
      setResolved("");
      return;
    }
    const hit = cachedUrl(url);
    if (hit) {
      setResolved(hit);
      return;
    }
    resolveUrl(url)
      .then((u) => alive && setResolved(u))
      .catch(() => alive && setResolved(""));
    return () => {
      alive = false;
    };
  }, [url]);
  return resolved;
}
