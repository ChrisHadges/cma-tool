import { NextRequest, NextResponse } from "next/server";
import { getSimilarListings } from "@/lib/services/repliers/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsNumber: string }> }
) {
  try {
    const { mlsNumber } = await params;
    const { searchParams } = new URL(request.url);

    const options: {
      radius?: number;
      fields?: string;
      sortBy?: string;
      boardId?: number;
    } = {};

    if (searchParams.get("radius")) options.radius = Number(searchParams.get("radius"));
    if (searchParams.get("fields")) options.fields = searchParams.get("fields")!;
    if (searchParams.get("sortBy")) options.sortBy = searchParams.get("sortBy")!;
    if (searchParams.get("boardId")) options.boardId = Number(searchParams.get("boardId"));

    const result = await getSimilarListings(mlsNumber, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Similar listings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar listings" },
      { status: 500 }
    );
  }
}
