import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/services/repliers/client";
import type { RepliersSearchParams } from "@/lib/services/repliers/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: RepliersSearchParams = {};

    // Location filters
    if (searchParams.get("city")) params.city = searchParams.getAll("city");
    if (searchParams.get("area")) params.area = searchParams.get("area")!;
    if (searchParams.get("neighborhood")) params.neighborhood = searchParams.getAll("neighborhood");
    if (searchParams.get("zip")) params.zip = searchParams.getAll("zip");
    if (searchParams.get("state")) params.state = searchParams.getAll("state");

    // Geospatial
    if (searchParams.get("lat")) params.lat = searchParams.get("lat")!;
    if (searchParams.get("long")) params.long = searchParams.get("long")!;
    if (searchParams.get("radius")) params.radius = Number(searchParams.get("radius"));

    // Property filters
    if (searchParams.get("class")) params.class = searchParams.getAll("class");
    if (searchParams.get("propertyType")) params.propertyType = searchParams.getAll("propertyType");
    if (searchParams.get("type")) params.type = searchParams.getAll("type");
    if (searchParams.get("status")) params.status = searchParams.getAll("status");
    if (searchParams.get("lastStatus")) params.lastStatus = searchParams.getAll("lastStatus");

    // Price filters
    if (searchParams.get("minPrice")) params.minPrice = Number(searchParams.get("minPrice"));
    if (searchParams.get("maxPrice")) params.maxPrice = Number(searchParams.get("maxPrice"));
    if (searchParams.get("minSoldPrice")) params.minSoldPrice = Number(searchParams.get("minSoldPrice"));
    if (searchParams.get("maxSoldPrice")) params.maxSoldPrice = Number(searchParams.get("maxSoldPrice"));

    // Property detail filters
    if (searchParams.get("minBedrooms")) params.minBedrooms = Number(searchParams.get("minBedrooms"));
    if (searchParams.get("maxBedrooms")) params.maxBedrooms = Number(searchParams.get("maxBedrooms"));
    if (searchParams.get("minBaths")) params.minBaths = Number(searchParams.get("minBaths"));
    if (searchParams.get("minSqft")) params.minSqft = Number(searchParams.get("minSqft"));
    if (searchParams.get("maxSqft")) params.maxSqft = Number(searchParams.get("maxSqft"));
    if (searchParams.get("minYearBuilt")) params.minYearBuilt = Number(searchParams.get("minYearBuilt"));

    // Date filters
    if (searchParams.get("minSoldDate")) params.minSoldDate = searchParams.get("minSoldDate")!;
    if (searchParams.get("maxSoldDate")) params.maxSoldDate = searchParams.get("maxSoldDate")!;

    // Sorting and pagination
    if (searchParams.get("sortBy")) params.sortBy = searchParams.get("sortBy")!;
    if (searchParams.get("pageNum")) params.pageNum = Number(searchParams.get("pageNum"));
    if (searchParams.get("resultsPerPage")) params.resultsPerPage = Number(searchParams.get("resultsPerPage"));

    // Search text
    if (searchParams.get("search")) params.search = searchParams.get("search")!;

    // Statistics and aggregates
    if (searchParams.get("statistics")) params.statistics = searchParams.get("statistics")!;
    if (searchParams.get("aggregates")) params.aggregates = searchParams.get("aggregates")!;

    const result = await searchListings(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Property search error:", error);
    return NextResponse.json(
      { error: "Failed to search properties" },
      { status: 500 }
    );
  }
}
