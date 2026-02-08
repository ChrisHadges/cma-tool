import { NextRequest, NextResponse } from "next/server";
import { createEstimate } from "@/lib/services/repliers/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createEstimate(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json(
      { error: "Failed to create estimate" },
      { status: 500 }
    );
  }
}
