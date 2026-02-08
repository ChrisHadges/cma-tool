import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("canva_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ connected: false });
    }

    // Quick validation: try to get user info from Canva
    try {
      const res = await fetch("https://api.canva.com/rest/v1/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        return NextResponse.json({
          connected: true,
          user: {
            displayName: userData.display_name || userData.name || "Canva User",
          },
        });
      }

      // Token expired or invalid
      return NextResponse.json({ connected: false, reason: "token_expired" });
    } catch {
      return NextResponse.json({ connected: false, reason: "api_error" });
    }
  } catch {
    return NextResponse.json({ connected: false });
  }
}
