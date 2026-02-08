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

  // Add comparable property data (comp_1_address, comp_2_price, etc.)
  cmaResult.comparables.forEach((comp, index) => {
    const num = index + 1;
    const prefix = `comp_${num}`;
    textMappings[`${prefix}_address`] = comp.property.streetAddress;
    textMappings[`${prefix}_price`] = comp.property.soldPrice
      ? formatPrice(comp.property.soldPrice)
      : "";
    textMappings[`${prefix}_adjusted_price`] = formatPrice(comp.adjustedPrice);
    textMappings[`${prefix}_beds`] = String(comp.property.bedrooms || "");
    textMappings[`${prefix}_baths`] = String(comp.property.bathrooms || "");
    textMappings[`${prefix}_sqft`] = comp.property.sqft
      ? `${comp.property.sqft.toLocaleString()} sq ft`
      : "";
    textMappings[`${prefix}_adjustment`] = formatPrice(comp.totalAdjustment);
    textMappings[`${prefix}_distance`] = `${comp.distanceKm.toFixed(1)} km`;
    textMappings[`${prefix}_sold_date`] = comp.property.soldDate || "";
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
