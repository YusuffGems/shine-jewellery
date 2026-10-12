/* Signed direct upload of photos/videos from the Admin panel to Vercel Blob (up to 200 MB). */
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cloudEnabled } from "@/lib/server/cloudStore";
import { verifyAdminToken } from "@/lib/server/adminToken";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!cloudEnabled()) return NextResponse.json({ enabled: false }, { status: 503 });
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!verifyAdminToken(clientPayload)) throw new Error("unauthorized");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
