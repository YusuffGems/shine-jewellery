/* Shared store data: GET = latest content for every visitor, PUT = save from a signed-in admin. */
import { NextResponse } from "next/server";
import { cloudEnabled, readCloud, writeCloud } from "@/lib/server/cloudStore";
import { bearer, verifyAdminToken } from "@/lib/server/adminToken";
import { keepHashes, publicView } from "@/lib/store/syncKeys";
import { createSeed } from "@/lib/store/seed";
import type { Database } from "@/types";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  if (!cloudEnabled()) return NextResponse.json({ enabled: false }, { headers: noStore });
  const isAdmin = !!verifyAdminToken(bearer(req));
  try {
    const data = await readCloud();
    return NextResponse.json({ enabled: true, data: data ? publicView(data, isAdmin) : null }, { headers: noStore });
  } catch {
    return NextResponse.json({ enabled: true, data: null, error: "read_failed" }, { status: 502, headers: noStore });
  }
}

export async function PUT(req: Request) {
  if (!cloudEnabled()) return NextResponse.json({ enabled: false }, { status: 503 });
  const who = verifyAdminToken(bearer(req));
  if (!who) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let incoming: Partial<Database>;
  try {
    incoming = (await req.json()) as Partial<Database>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!incoming || typeof incoming !== "object" || !Array.isArray(incoming.products)) return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  delete incoming.session;
  const existing = (await readCloud()) ?? createSeed();
  await writeCloud(keepHashes(incoming, existing));
  return NextResponse.json({ ok: true }, { headers: noStore });
}