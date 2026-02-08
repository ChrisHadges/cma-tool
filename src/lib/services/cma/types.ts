export type AdjustmentCategory =
  | "location"
  | "size"
  | "bedrooms"
  | "bathrooms"
  | "age"
  | "lot_size"
  | "garage"
  | "basement"
  | "condition"
  | "pool"
  | "other";

export interface PropertyData {
  mlsNumber?: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  style?: string;
  bedrooms?: number;
  bedroomsPlus?: number;
  bathrooms?: number;
  bathroomsHalf?: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  garage?: string;
  garageSpaces?: number;
  basement?: string;
  heating?: string;
  cooling?: string;
  pool?: string;
  listPrice?: number;
  soldPrice?: number;
  soldDate?: string;
  daysOnMarket?: number;
  images?: string[];
}

export interface AdjustmentResult {
  category: AdjustmentCategory;
  label: string;
  subjectValue: string;
  compValue: string;
  autoAmount: number;
  adjustmentAmount: number;
  isManual: boolean;
  notes?: string;
}

export interface CompAnalysis {
  property: PropertyData;
  distanceKm: number;
  adjustments: AdjustmentResult[];
  totalAdjustment: number;
  adjustedPrice: number;
  weight: number;
}

export interface PriceRecommendation {
  low: number;
  mid: number;
  high: number;
  weightedAvg: number;
  stdDev: number;
  confidence: number;
  estimateValue?: number;
  estimateConfidence?: number;
}

export interface MarketTrendPoint {
  period: string;
  avgPrice?: number;
  medianPrice?: number;
  avgDom?: number;
  activeCount?: number;
  soldCount?: number;
  newCount?: number;
  avgPricePerSqft?: number;
  absorptionRate?: number;
}

export interface CmaResult {
  subjectProperty: PropertyData;
  comparables: CompAnalysis[];
  priceRecommendation: PriceRecommendation;
  marketTrends: MarketTrendPoint[];
}

export interface AdjustmentPreset {
  category: AdjustmentCategory;
  label: string;
  amountPerUnit: number;
  unit: string;
}

export const DEFAULT_ADJUSTMENT_PRESETS: AdjustmentPreset[] = [
  { category: "size", label: "Living Area (per sqft)", amountPerUnit: 150, unit: "sqft" },
  { category: "bedrooms", label: "Bedrooms", amountPerUnit: 15000, unit: "bedroom" },
  { category: "bathrooms", label: "Bathrooms", amountPerUnit: 10000, unit: "bathroom" },
  { category: "age", label: "Age (per year)", amountPerUnit: 1000, unit: "year" },
  { category: "lot_size", label: "Lot Size (per sqft)", amountPerUnit: 20, unit: "sqft" },
  { category: "garage", label: "Garage Spaces", amountPerUnit: 15000, unit: "space" },
  { category: "basement", label: "Basement (finished vs not)", amountPerUnit: 25000, unit: "level" },
  { category: "pool", label: "Pool", amountPerUnit: 20000, unit: "presence" },
  { category: "location", label: "Location (per km)", amountPerUnit: -2000, unit: "km" },
  { category: "condition", label: "Condition (per grade)", amountPerUnit: 10000, unit: "grade" },
];
