import type { CompAnalysis, PriceRecommendation } from "./types";

/**
 * Calculate weight for a comparable based on recency and similarity.
 * More recent sales and closer properties get higher weights.
 */
export function calculateCompWeight(
  comp: {
    soldDate?: string;
    distanceKm: number;
    totalAdjustment: number;
    soldPrice?: number;
  },
  referenceDate: Date = new Date()
): number {
  let weight = 1.0;

  // Recency factor: more recent = higher weight
  if (comp.soldDate) {
    const soldDate = new Date(comp.soldDate);
    const daysSinceSold = Math.max(
      0,
      (referenceDate.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Exponential decay: half-life of ~90 days
    weight *= Math.exp(-0.0077 * daysSinceSold);
  }

  // Distance factor: closer = higher weight
  if (comp.distanceKm > 0) {
    // Exponential decay: half-life of ~2 km
    weight *= Math.exp(-0.35 * comp.distanceKm);
  }

  // Adjustment magnitude factor: smaller total adjustment = higher weight
  if (comp.soldPrice && comp.soldPrice > 0) {
    const adjPercent = Math.abs(comp.totalAdjustment) / comp.soldPrice;
    // Penalize comps requiring large adjustments (>20% = low weight)
    weight *= Math.max(0.1, 1 - adjPercent * 2);
  }

  return Math.max(0.01, weight);
}

/**
 * Calculate the recommended price range from analyzed comparables.
 */
export function calculatePriceRecommendation(
  comparables: CompAnalysis[],
  estimateValue?: number,
  estimateConfidence?: number
): PriceRecommendation {
  if (comparables.length === 0) {
    return {
      low: 0,
      mid: 0,
      high: 0,
      weightedAvg: 0,
      stdDev: 0,
      confidence: 0,
      estimateValue,
      estimateConfidence,
    };
  }

  // Calculate weights for each comp
  const weightedComps = comparables.map((comp) => ({
    adjustedPrice: comp.adjustedPrice,
    weight: comp.weight,
  }));

  const totalWeight = weightedComps.reduce((sum, c) => sum + c.weight, 0);

  // Weighted average
  const weightedAvg =
    weightedComps.reduce(
      (sum, c) => sum + c.adjustedPrice * c.weight,
      0
    ) / totalWeight;

  // Weighted standard deviation
  const weightedVariance =
    weightedComps.reduce(
      (sum, c) => sum + c.weight * Math.pow(c.adjustedPrice - weightedAvg, 2),
      0
    ) / totalWeight;
  const stdDev = Math.sqrt(weightedVariance);

  // Price range: +/- 1 stddev, but capped at +/- 5%
  const maxSpread = weightedAvg * 0.05;
  const spread = Math.min(stdDev, maxSpread);

  const low = Math.round(weightedAvg - spread);
  const mid = Math.round(weightedAvg);
  const high = Math.round(weightedAvg + spread);

  // Confidence based on number of comps and agreement
  const coeffOfVariation = stdDev / weightedAvg;
  let confidence = 0.5;
  // More comps = more confident (up to 6)
  confidence += Math.min(comparables.length / 6, 1) * 0.25;
  // Lower CV = more confident
  confidence += Math.max(0, (1 - coeffOfVariation * 5)) * 0.25;
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    low,
    mid,
    high,
    weightedAvg: Math.round(weightedAvg),
    stdDev: Math.round(stdDev),
    confidence: Math.round(confidence * 100) / 100,
    estimateValue,
    estimateConfidence,
  };
}

/**
 * Format a price for display (e.g., "$750,000")
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}
