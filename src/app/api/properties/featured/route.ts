import { NextResponse } from "next/server";
import { searchListings } from "@/lib/services/repliers/client";
import type { RepliersListing } from "@/lib/services/repliers/types";

/**
 * GET /api/properties/featured
 *
 * Returns featured/recent listings for the AI CMA builder landing page.
 * Fetches active listings with images to display as suggestion cards.
 */
export async function GET() {
  try {
    const data = await searchListings({
      status: "A",
      type: "residential",
      resultsPerPage: 6,
      sortBy: "updatedOnDesc",
      hasImages: true,
      minPrice: 300000,
      class: "residential",
    } as Record<string, unknown>);

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

        return {
          mlsNumber: listing.mlsNumber || "",
          streetAddress,
          city: addr?.city || "",
          state: addr?.state || "ON",
          listPrice: listing.listPrice || null,
          bedrooms: listing.details?.numBedrooms || 0,
          bathrooms: listing.details?.numBathrooms || 0,
          sqft: listing.details?.sqft || "0",
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
