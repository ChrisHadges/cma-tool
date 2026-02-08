import { NextRequest, NextResponse } from "next/server";
import { exchangeCanvaCode, decodeOAuthState } from "@/lib/services/canva/client";

/**
 * GET /api/canva/callback?code=...&state=...
 *
 * Canva redirects here after the user authorizes.
 * The `state` parameter contains the PKCE code_verifier (encoded + signed).
 * We extract it, exchange the auth code for tokens, store them in cookies,
 * and redirect the user back to where they started.
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Canva OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/dashboard?canva_error=${error}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard?canva_error=no_code", baseUrl)
      );
    }

    if (!state) {
      console.error("Canva callback: missing state parameter");
      return NextResponse.redirect(
        new URL("/dashboard?canva_error=missing_state", baseUrl)
      );
    }

    // Decode the state to get code_verifier and returnTo path
    const decoded = decodeOAuthState(state);
    if (!decoded) {
      console.error("Canva callback: invalid or expired state parameter");
      return NextResponse.redirect(
        new URL("/dashboard?canva_error=invalid_state", baseUrl)
      );
    }

    const { codeVerifier, returnTo } = decoded;

    // Exchange authorization code + code_verifier for tokens
    const tokens = await exchangeCanvaCode(code, codeVerifier);

    // Redirect back to where the user started (or dashboard)
    const redirectUrl = new URL(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}canva_connected=true`,
      baseUrl
    );
    const response = NextResponse.redirect(redirectUrl);

    // Store the access token
    response.cookies.set("canva_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    // Store refresh token
    if (tokens.refreshToken) {
      response.cookies.set("canva_refresh_token", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Canva callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?canva_error=exchange_failed", baseUrl)
    );
  }
}
