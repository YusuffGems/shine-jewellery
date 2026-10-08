"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="container empty" style={{ paddingBlock: "8rem" }}>
      <h3>Something went wrong · حدث خطأ ما</h3>
      <p style={{ marginBottom: "2rem" }}>Please try again. If the problem continues, contact support.</p>
      <button className="btn" onClick={reset}>Try again</button>
    </main>
  );
}
