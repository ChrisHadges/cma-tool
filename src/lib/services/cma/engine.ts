import type {
  PropertyData,
  CompAnalysis,
  CmaResult,
  MarketTrendPoint,
  AdjustmentPreset,
} from "./types";
import { DEFAULT_ADJUSTMENT_PRESETS } from "./types";
import { calculateAdjustments, totalAdjustment, adjustedPrice } from "./adjustments";
import { calculateCompWeight, calculatePriceRecommendation } from "./pricing";

/**
 * Calculate the distance in km between two lat/lng coordinates using Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Analyze a single comparable against the subject property.
 */
export function analyzeComparable(
  subject: PropertyData,
  comp: PropertyData,
  presets: AdjustmentPreset[] = DEFAULT_ADJUSTMENT_PRESETS
): CompAnalysis {
  // Calculate distance
  let distanceKm = 0;
  if (subject.latitude && subject.longitude && comp.latitude && comp.longitude) {
    distanceKm = haversineDistanceKm(
      subject.latitude,
      subject.longitude,
      comp.latitude,
      comp.longitude
    );
  }

  // Calculate adjustments
  const adjustments = calculateAdjustments(subject, comp, distanceKm, presets);
  const totalAdj = totalAdjustment(adjustments);
  const compSoldPrice = comp.soldPrice || comp.listPrice || 0;
  const adjPrice = adjustedPrice(compSoldPrice, adjustments);

  // Calculate weight
  const weight = calculateCompWeight({
    soldDate: comp.soldDate,
    distanceKm,
    totalAdjustment: totalAdj,
    soldPrice: compSoldPrice,
  });

  return {
    property: comp,
    distanceKm: Math.round(distanceKm * 100) / 100,
    adjustments,
    totalAdjustment: totalAdj,
    adjustedPrice: adjPrice,
    weight: Math.round(weight * 10000) / 10000,
  };
}

/**
 * Run a full CMA analysis: analyze all comps and produce a price recommendation.
 */
export function runCmaAnalysis(
  subject: PropertyData,
  comps: PropertyData[],
  presets: AdjustmentPreset[] = DEFAULT_ADJUSTMENT_PRESETS,
  marketTrends: MarketTrendPoint[] = [],
  estimate?: { value: number; confidence: number }
): CmaResult {
  // Analyze each comparable
  const analyzedComps = comps.map((comp) =>
    analyzeComparable(subject, comp, presets)
  );

  // Sort by weight (best comps first)
  analyzedComps.sort((a, b) => b.weight - a.weight);

  // Calculate price recommendation
  const priceRecommendation = calculatePriceRecommendation(
    analyzedComps,
    estimate?.value,
    estimate?.confidence
  );

  return {
    subjectProperty: subject,
    comparables: analyzedComps,
    priceRecommendation,
    marketTrends,
  };
}
