import type {
  PropertyData,
  AdjustmentResult,
  AdjustmentPreset,
} from "./types";
import { DEFAULT_ADJUSTMENT_PRESETS } from "./types";

function getPreset(
  presets: AdjustmentPreset[],
  category: string
): AdjustmentPreset | undefined {
  return presets.find((p) => p.category === category);
}

function numericDiff(
  subjectVal: number | undefined,
  compVal: number | undefined
): number {
  return (subjectVal || 0) - (compVal || 0);
}

export function calculateAdjustments(
  subject: PropertyData,
  comp: PropertyData,
  distanceKm: number,
  presets: AdjustmentPreset[] = DEFAULT_ADJUSTMENT_PRESETS
): AdjustmentResult[] {
  const results: AdjustmentResult[] = [];

  // ─── Size (sqft) ─────────────────────────────────────────────
  const sizePreset = getPreset(presets, "size");
  if (sizePreset) {
    const diff = numericDiff(subject.sqft, comp.sqft);
    const amount = Math.round(diff * sizePreset.amountPerUnit);
    results.push({
      category: "size",
      label: "Living Area",
      subjectValue: subject.sqft ? `${subject.sqft} sqft` : "N/A",
      compValue: comp.sqft ? `${comp.sqft} sqft` : "N/A",
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Bedrooms ────────────────────────────────────────────────
  const bedPreset = getPreset(presets, "bedrooms");
  if (bedPreset) {
    const subjectTotal = (subject.bedrooms || 0) + (subject.bedroomsPlus || 0);
    const compTotal = (comp.bedrooms || 0) + (comp.bedroomsPlus || 0);
    const diff = subjectTotal - compTotal;
    const amount = Math.round(diff * bedPreset.amountPerUnit);
    results.push({
      category: "bedrooms",
      label: "Bedrooms",
      subjectValue: String(subjectTotal),
      compValue: String(compTotal),
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Bathrooms ───────────────────────────────────────────────
  const bathPreset = getPreset(presets, "bathrooms");
  if (bathPreset) {
    const subjectTotal =
      (subject.bathrooms || 0) + (subject.bathroomsHalf || 0) * 0.5;
    const compTotal =
      (comp.bathrooms || 0) + (comp.bathroomsHalf || 0) * 0.5;
    const diff = subjectTotal - compTotal;
    const amount = Math.round(diff * bathPreset.amountPerUnit);
    results.push({
      category: "bathrooms",
      label: "Bathrooms",
      subjectValue: String(subjectTotal),
      compValue: String(compTotal),
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Age (Year Built) ───────────────────────────────────────
  const agePreset = getPreset(presets, "age");
  if (agePreset && subject.yearBuilt && comp.yearBuilt) {
    // Newer comp = positive adjustment to comp (subject older = reduce value)
    // comp_year - subject_year: positive means comp is newer
    const diff = comp.yearBuilt - subject.yearBuilt;
    const amount = Math.round(diff * agePreset.amountPerUnit * -1);
    results.push({
      category: "age",
      label: "Year Built",
      subjectValue: String(subject.yearBuilt),
      compValue: String(comp.yearBuilt),
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Lot Size ────────────────────────────────────────────────
  const lotPreset = getPreset(presets, "lot_size");
  if (lotPreset) {
    const diff = numericDiff(subject.lotSqft, comp.lotSqft);
    const amount = Math.round(diff * lotPreset.amountPerUnit);
    results.push({
      category: "lot_size",
      label: "Lot Size",
      subjectValue: subject.lotSqft ? `${subject.lotSqft} sqft` : "N/A",
      compValue: comp.lotSqft ? `${comp.lotSqft} sqft` : "N/A",
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Garage ──────────────────────────────────────────────────
  const garagePreset = getPreset(presets, "garage");
  if (garagePreset) {
    const diff = numericDiff(subject.garageSpaces, comp.garageSpaces);
    const amount = Math.round(diff * garagePreset.amountPerUnit);
    results.push({
      category: "garage",
      label: "Garage Spaces",
      subjectValue: String(subject.garageSpaces || 0),
      compValue: String(comp.garageSpaces || 0),
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Basement ────────────────────────────────────────────────
  const basementPreset = getPreset(presets, "basement");
  if (basementPreset) {
    const subjectFinished = isBasementFinished(subject.basement);
    const compFinished = isBasementFinished(comp.basement);
    let amount = 0;
    if (subjectFinished && !compFinished) {
      amount = basementPreset.amountPerUnit;
    } else if (!subjectFinished && compFinished) {
      amount = -basementPreset.amountPerUnit;
    }
    results.push({
      category: "basement",
      label: "Basement",
      subjectValue: subject.basement || "None",
      compValue: comp.basement || "None",
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Pool ────────────────────────────────────────────────────
  const poolPreset = getPreset(presets, "pool");
  if (poolPreset) {
    const subjectHasPool = hasPool(subject.pool);
    const compHasPool = hasPool(comp.pool);
    let amount = 0;
    if (subjectHasPool && !compHasPool) {
      amount = poolPreset.amountPerUnit;
    } else if (!subjectHasPool && compHasPool) {
      amount = -poolPreset.amountPerUnit;
    }
    results.push({
      category: "pool",
      label: "Pool",
      subjectValue: subject.pool || "None",
      compValue: comp.pool || "None",
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  // ─── Location ────────────────────────────────────────────────
  const locationPreset = getPreset(presets, "location");
  if (locationPreset && distanceKm > 0) {
    // Further away = larger negative adjustment (less comparable)
    const amount = Math.round(distanceKm * locationPreset.amountPerUnit);
    results.push({
      category: "location",
      label: "Location/Distance",
      subjectValue: "Subject",
      compValue: `${distanceKm.toFixed(1)} km away`,
      autoAmount: amount,
      adjustmentAmount: amount,
      isManual: false,
    });
  }

  return results;
}

function isBasementFinished(basement: string | undefined): boolean {
  if (!basement) return false;
  const lower = basement.toLowerCase();
  return lower.includes("finished") || lower.includes("fin");
}

function hasPool(pool: string | undefined): boolean {
  if (!pool) return false;
  const lower = pool.toLowerCase();
  return lower !== "none" && lower !== "" && lower !== "n/a";
}

export function totalAdjustment(adjustments: AdjustmentResult[]): number {
  return adjustments.reduce((sum, adj) => sum + adj.adjustmentAmount, 0);
}

export function adjustedPrice(
  soldPrice: number,
  adjustments: AdjustmentResult[]
): number {
  return soldPrice + totalAdjustment(adjustments);
}
