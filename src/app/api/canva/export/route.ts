import { NextRequest, NextResponse } from "next/server";
import { exportDesign } from "@/lib/services/canva/client";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("canva_access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Canva" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { designId, format } = body;

    console.log("Export request:", { designId, format });

    if (!designId || !format) {
      return NextResponse.json(
        { error: "designId and format are required" },
        { status: 400 }
      );
    }

    const result = await exportDesign(accessToken, designId, format);
    console.log("Export result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Canva export error:", error);
    return NextResponse.json(
      { error: "Failed to export Canva design" },
      { status: 500 }
    );
  }
}
