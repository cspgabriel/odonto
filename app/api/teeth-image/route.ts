import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const TEETH_BASE =
  process.env.TEETH_IMAGES_BASE_URL ?? "https://coastal-medical.clinicpro.shop/teeth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const num = request.nextUrl.searchParams.get("num");
  const n = num ? parseInt(num, 10) : NaN;
  if (Number.isNaN(n) || n < 1 || n > 32) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const res = await fetch(`${TEETH_BASE}/${n}.png`, {
      headers: { Accept: "image/png" },
      cache: "force-cache",
    });
    if (!res.ok) return new NextResponse("Image not found", { status: 404 });
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
