import { NextResponse } from "next/server";
import { searchListings, parseSqftRange } from "@/lib/services/repliers/client";
import type { RepliersListing } from "@/lib/services/repliers/types";

/**
 * Fallback featured properties shown when Repliers API is unavailable.
 * These are sample properties to demonstrate the UI.
 */
const FALLBACK_PROPERTIES = [
  {
    mlsNumber: "C8147018",
    streetAddress: "25 Cole Street",
    city: "Toronto",
    state: "ON",
    listPrice: 1299000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    propertyType: "Detached",
    image: null,
  },
  {
    mlsNumber: "W7389421",
    streetAddress: "142 Lakeshore Rd",
    city: "Oakville",
    state: "ON",
    listPrice: 899000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    propertyType: "Detached",
    image: null,
  },
  {
    mlsNumber: "N6521834",
    streetAddress: "88 Yonge St Unit 2801",
    city: "Toronto",
    state: "ON",
    listPrice: 749000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    propertyType: "Condo",
    image: null,
  },
  {
    mlsNumber: "E5894372",
    streetAddress: "310 Bloor St W",
    city: "Mississauga",
    state: "ON",
    listPrice: 1050000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    propertyType: "Semi-Detached",
    image: null,
  },
  {
    mlsNumber: "C9283746",
    streetAddress: "55 Harbour Square",
    city: "Toronto",
    state: "ON",
    listPrice: 625000,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    propertyType: "Condo",
    image: null,
  },
  {
    mlsNumber: "W8173629",
    streetAddress: "204 Main St S",
    city: "Brampton",
    state: "ON",
    listPrice: 975000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    propertyType: "Detached",
    image: null,
  },
];

/**
 * GET /api/properties/featured
 *
 * Returns featured/recent listings for the AI CMA builder landing page.
 * Fetches active listings with images to display as suggestion cards.
 * Falls back to sample properties if Repliers API is unavailable.
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

    if (listings.length > 0) {
      return NextResponse.json({ listings });
    }

    // No results from API — use fallback
    console.log("Repliers returned 0 featured listings, using fallback data");
    return NextResponse.json({ listings: FALLBACK_PROPERTIES });
  } catch (error) {
    console.error("Featured properties error:", error);
    // Return fallback properties so the UI always has something to show
    return NextResponse.json({ listings: FALLBACK_PROPERTIES });
  }
}
