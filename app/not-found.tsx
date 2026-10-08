import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container empty" style={{ paddingBlock: "8rem" }}>
      <span className="eyebrow">404</span>
      <h3>Page not found · الصفحة غير موجودة</h3>
      <p style={{ marginBottom: "2rem" }}>The page you are looking for has moved or no longer exists.</p>
      <Link href="/" className="btn">Return home</Link>
    </main>
  );
}
