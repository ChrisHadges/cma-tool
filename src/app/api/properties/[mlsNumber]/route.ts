import { NextRequest, NextResponse } from "next/server";
import { getListing } from "@/lib/services/repliers/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsNumber: string }> }
) {
  try {
    const { mlsNumber } = await params;
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId")
      ? Number(searchParams.get("boardId"))
      : undefined;

    const listing = await getListing(mlsNumber, boardId);

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Get listing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}
