import { NextRequest, NextResponse } from "next/server";
import { getCanvaAuthUrl } from "@/lib/services/canva/client";

/**
 * GET /api/canva/auth?returnTo=/cma/5/export
 *
 * Redirects the browser directly to Canva's OAuth page.
 * The PKCE code_verifier is encoded into the `state` parameter
 * (not a cookie) so it survives the redirect chain.
 *
 * The optional `returnTo` query param tells the callback where
 * to redirect the user after successful auth.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get("returnTo") || "/dashboard";

    const authUrl = getCanvaAuthUrl(returnTo);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Canva auth error:", error);
    return NextResponse.redirect(
      new URL(
        "/dashboard?canva_error=auth_init_failed",
        process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"
      )
    );
  }
}
