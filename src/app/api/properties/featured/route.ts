import { NextResponse } from "next/server";
import { searchListings, parseSqftRange } from "@/lib/services/repliers/client";
import type { RepliersListing } from "@/lib/services/repliers/types";

/**
 * GET /api/properties/featured
 *
 * Returns featured/recent listings for the AI CMA builder landing page.
 * Fetches active listings with images to display as suggestion cards.
 * Returns empty array if Repliers API is unavailable — the frontend
 * will simply not show the suggestions section.
 */
export async function GET() {
  try {
    const data = await searchListings({
      status: ["A"],
      type: ["residential"],
      class: ["residential"],
      resultsPerPage: 6,
      sortBy: "updatedOnDesc",
      hasImages: true,
      minPrice: 300000,
    });

    const listings = (data.listings || []).slice(0, 6).map(
      (listing: RepliersListing) => {
        const addr = listing.address;
        const streetAddress = [
          addr?.streetNumber,
          addr?.streetName,
          addr?.streetSuffix,
        ]
          .filter(Boolean)
          .join(" ") || "Unknown Address";

        // Parse sqft string (e.g. "1500-1999") into a number
        const sqftStr = listing.details?.sqft || "0";
        const sqftNum = parseSqftRange(sqftStr).avg;

        return {
          mlsNumber: listing.mlsNumber || "",
          streetAddress,
          city: addr?.city || "",
          state: addr?.state || "ON",
          listPrice: listing.listPrice ? Number(listing.listPrice) : null,
          bedrooms: listing.details?.numBedrooms || 0,
          bathrooms: listing.details?.numBathrooms || 0,
          sqft: sqftNum,
          propertyType:
            listing.details?.propertyType || "Residential",
          image: listing.images?.[0] || null,
        };
      }
    );

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Featured properties error:", error);
    // Return empty array — not a critical failure
    return NextResponse.json({ listings: [] });
  }
}
