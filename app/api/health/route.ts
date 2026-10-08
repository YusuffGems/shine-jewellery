import { NextResponse } from "next/server";
import { SITE } from "@/config/site";

export function GET() {
  return NextResponse.json({ ok: true, service: "shine-gold-diamonds", dataMode: SITE.dataMode, time: new Date().toISOString() });
}
