import { NextRequest, NextResponse } from "next/server";
import { fetchNeighborhoodData } from "@/lib/services/neighborhood";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const zip = searchParams.get("zip") || undefined;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    const data = await fetchNeighborhoodData(lat, lng, zip);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Neighborhood data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhood data" },
      { status: 500 }
    );
  }
}
