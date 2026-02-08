// ─── Neighborhood Data Types ──────────────────────────────────────

export interface SchoolInfo {
  name: string;
  type: "elementary" | "middle" | "high" | "private" | "other";
  rating?: number; // 1-10
  distance?: string; // e.g., "0.5 km"
}

export interface NeighborhoodData {
  // Schools
  schools: SchoolInfo[];
  avgSchoolRating: number | null;

  // Walk/Transit scores
  walkScore: number | null; // 0-100
  walkScoreDescription: string | null;
  transitScore: number | null; // 0-100
  transitScoreDescription: string | null;
  bikeScore: number | null; // 0-100
  bikeScoreDescription: string | null;

  // Crime / Safety
  crimeIndex: number | null; // relative to national average (100 = average)
  crimeDescription: string | null;

  // Nearby amenities
  nearbyAmenities: string[];

  // Demographics
  medianHouseholdIncome: number | null;
  population: number | null;
  medianAge: number | null;

  // Sourced from
  dataSource: string;
  fetchedAt: string;
}

export interface PlacesApiResponse {
  schools?: Array<{
    name: string;
    type: string;
    rating?: number;
    distance?: number;
    grades?: string;
  }>;
  transit?: {
    score?: number;
    description?: string;
  };
  walkScore?: {
    score?: number;
    description?: string;
  };
  bikeScore?: {
    score?: number;
    description?: string;
  };
  amenities?: string[];
  demographics?: {
    medianIncome?: number;
    population?: number;
    medianAge?: number;
  };
  crime?: {
    index?: number;
    description?: string;
  };
  // Repliers places may return different structure - we handle flexibly
  [key: string]: unknown;
}
