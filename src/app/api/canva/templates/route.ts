import { NextRequest, NextResponse } from "next/server";
import { searchBrandTemplates, getTemplateDataset } from "@/lib/services/canva/client";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("canva_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Canva" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const dataset = searchParams.get("dataset") as "non_empty" | undefined;
    const continuation = searchParams.get("continuation") || undefined;

    const result = await searchBrandTemplates(accessToken, {
      query,
      dataset,
      continuation,
    });

    // Log available templates for debugging
    if (result.items) {
      console.log("Available brand templates:", result.items.map((t: { id: string; title: string }) => `${t.title} (${t.id})`));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Canva templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Canva templates" },
      { status: 500 }
    );
  }
}
