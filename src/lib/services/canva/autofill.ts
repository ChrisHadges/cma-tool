import type { CmaResult } from "../cma/types";
import type { CanvaAutofillData, CanvaTemplateDataset } from "./types";
import { formatPrice } from "../cma/pricing";

/**
 * Map CMA analysis results to Canva brand template autofill fields.
 * This function inspects the template dataset schema and maps available
 * CMA data to the matching fields.
 */
export function mapCmaToAutofillData(
  cmaResult: CmaResult,
  templateDataset: CanvaTemplateDataset,
  reportTitle: string = "Comparative Market Analysis"
): CanvaAutofillData {
  const data: CanvaAutofillData = {};
  const fields = templateDataset.fields;
  const subject = cmaResult.subjectProperty;
  const price = cmaResult.priceRecommendation;

  // Common field name patterns and their values
  const textMappings: Record<string, string> = {
    // Report metadata
    title: reportTitle,
    report_title: reportTitle,
    heading: reportTitle,

    // Subject property
    address: subject.streetAddress,
    street_address: subject.streetAddress,
    property_address: `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`,
    full_address: `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`,
    city: subject.city,
    state: subject.state,
    zip: subject.zip,

    // Property details
    bedrooms: String(subject.bedrooms || ""),
    beds: String(subject.bedrooms || ""),
    bathrooms: String(subject.bathrooms || ""),
    baths: String(subject.bathrooms || ""),
    sqft: subject.sqft ? `${subject.sqft.toLocaleString()} sq ft` : "",
    square_feet: subject.sqft ? `${subject.sqft.toLocaleString()} sq ft` : "",
    year_built: String(subject.yearBuilt || ""),
    property_type: subject.propertyType || "",
    lot_size: subject.lotSqft ? `${subject.lotSqft.toLocaleString()} sq ft` : "",

    // Pricing
    list_price: subject.listPrice ? formatPrice(subject.listPrice) : "",
    listing_price: subject.listPrice ? formatPrice(subject.listPrice) : "",
    price: price.mid ? formatPrice(price.mid) : "",
    suggested_price: price.mid ? formatPrice(price.mid) : "",
    recommended_price: price.mid ? formatPrice(price.mid) : "",
    price_range: price.low && price.high ? `${formatPrice(price.low)} - ${formatPrice(price.high)}` : "",
    price_low: price.low ? formatPrice(price.low) : "",
    price_high: price.high ? formatPrice(price.high) : "",

    // Market data
    num_comps: String(cmaResult.comparables.length),
    confidence: price.confidence ? `${Math.round(price.confidence * 100)}%` : "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  // Add comparable property data
  // Supports both formats: comp_1_address (underscore) and comp1address (no underscore)
  cmaResult.comparables.forEach((comp, index) => {
    const num = index + 1;
    const soldPrice = comp.property.soldPrice
      ? formatPrice(comp.property.soldPrice)
      : "";
    const address = comp.property.streetAddress;
    const beds = String(comp.property.bedrooms || "");
    const baths = String(comp.property.bathrooms || "");
    const sqft = comp.property.sqft
      ? `${comp.property.sqft.toLocaleString()} sq ft`
      : "";
    const yearBuilt = String(comp.property.yearBuilt || "");
    const soldDate = comp.property.soldDate || "";

    // Underscore format: comp_1_address
    textMappings[`comp_${num}_address`] = address;
    textMappings[`comp_${num}_price`] = soldPrice;
    textMappings[`comp_${num}_adjusted_price`] = formatPrice(comp.adjustedPrice);
    textMappings[`comp_${num}_beds`] = beds;
    textMappings[`comp_${num}_baths`] = baths;
    textMappings[`comp_${num}_sqft`] = sqft;
    textMappings[`comp_${num}_year_built`] = yearBuilt;
    textMappings[`comp_${num}_adjustment`] = formatPrice(comp.totalAdjustment);
    textMappings[`comp_${num}_distance`] = `${comp.distanceKm.toFixed(1)} km`;
    textMappings[`comp_${num}_sold_date`] = soldDate;
    textMappings[`comp_${num}_date_sold`] = soldDate;

    // No-underscore format: comp1address
    textMappings[`comp${num}address`] = address;
    textMappings[`comp${num}price`] = soldPrice;
    textMappings[`comp${num}beds`] = beds;
    textMappings[`comp${num}baths`] = baths;
    textMappings[`comp${num}sqft`] = sqft;
    textMappings[`comp${num}yearbuilt`] = yearBuilt;
    textMappings[`comp${num}datesold`] = soldDate;
  });

  // Map template fields to data
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    if (fieldDef.type === "text") {
      // Try exact match first, then normalized match
      const normalizedName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const value =
        textMappings[fieldName] ||
        textMappings[normalizedName] ||
        findBestMatch(normalizedName, textMappings);

      if (value) {
        data[fieldName] = { type: "text", text: value };
      }
    }
    // Image fields would need asset_ids uploaded to Canva first
    // They're handled separately in the export flow
  }

  return data;
}

/**
 * Fuzzy match a field name against available mappings.
 */
function findBestMatch(
  fieldName: string,
  mappings: Record<string, string>
): string | undefined {
  // Check if field name contains any mapping key
  for (const [key, value] of Object.entries(mappings)) {
    if (fieldName.includes(key) || key.includes(fieldName)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Build a descriptive query for Canva's generate-design tool.
 */
export function buildCanvaGenerateQuery(cmaResult: CmaResult): string {
  const subject = cmaResult.subjectProperty;
  const price = cmaResult.priceRecommendation;

  return `Create a professional real estate Comparative Market Analysis (CMA) report document.

Subject Property: ${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}
Property Type: ${subject.propertyType || "Residential"}
${subject.bedrooms || "?"} Bedrooms, ${subject.bathrooms || "?"} Bathrooms, ${subject.sqft ? `${subject.sqft} sq ft` : ""}
List Price: ${subject.listPrice ? formatPrice(subject.listPrice) : "N/A"}

Recommended Price Range: ${formatPrice(price.low)} - ${formatPrice(price.high)}
Suggested Price: ${formatPrice(price.mid)}

${cmaResult.comparables.length} Comparable Properties Analyzed
Confidence Level: ${Math.round(price.confidence * 100)}%

Include sections for: Property Overview, Comparable Analysis, Market Trends, and Price Recommendation.
Use a clean, professional real estate design with property photos.`;
}
