import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/services/repliers/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const propertyType = searchParams.get("propertyType");
    const months = parseInt(searchParams.get("months") || "12", 10);

    // Build date range for historical data
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);

    // Get sold listings statistics
    const soldStats = await searchListings({
      city: city ? [city] : undefined,
      area: area || undefined,
      propertyType: propertyType ? [propertyType] : undefined,
      status: ["U"],
      lastStatus: ["Sld"],
      minSoldDate: startDate.toISOString().split("T")[0],
      maxSoldDate: now.toISOString().split("T")[0],
      statistics: "soldPrice,listPrice,daysOnMarket",
      listings: false,
      resultsPerPage: 1,
    });

    // Get active listings count
    const activeStats = await searchListings({
      city: city ? [city] : undefined,
      area: area || undefined,
      propertyType: propertyType ? [propertyType] : undefined,
      status: ["A"],
      statistics: "listPrice",
      listings: false,
      resultsPerPage: 1,
    });

    return NextResponse.json({
      sold: {
        count: soldStats.count,
        statistics: soldStats.statistics,
      },
      active: {
        count: activeStats.count,
        statistics: activeStats.statistics,
      },
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Market stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market statistics" },
      { status: 500 }
    );
  }
}
