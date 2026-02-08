import { NextRequest, NextResponse } from "next/server";
import { autocompleteLocations } from "@/lib/services/repliers/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    if (!search || search.length < 2) {
      return NextResponse.json([]);
    }

    const results = await autocompleteLocations(search);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to autocomplete" },
      { status: 500 }
    );
  }
}
