"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { db } from "@/lib/store/db";
import { Icon } from "./Icon";

type ToastItem = { id: number; text: string; tone: "default" | "error" };
const ToastCtx = createContext<(text: string, tone?: ToastItem["tone"]) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: ToastItem["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800);
  }, []);

  useEffect(() => db.onError(() => push("Browser storage is full. Delete unused media in Admin › Media library, or use Admin › Settings › Export data and then Reset.", "error")), [push]);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast${i.tone === "error" ? " toast--error" : ""}`}>
            <Icon name={i.tone === "error" ? "close" : "check"} size={16} />
            <span>{i.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
