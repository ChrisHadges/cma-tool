export interface CmaSiteData {
  reportTitle: string;
  publishedAt: string | null;

  agent: {
    name: string;
    email: string;
    brokerage: string | null;
    phone: string | null;
    avatarUrl: string | null;
  } | null;

  subjectProperty: {
    address: string;
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
    propertyType: string;
    style: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lotSqft: number;
    yearBuilt: number;
    garage: string;
    garageSpaces: number;
    basement: string;
    pool: string;
    listPrice: string;
    listPriceRaw: number | null;
    daysOnMarket: number;
    description: string;
    images: string[];
    latitude: number | null;
    longitude: number | null;
  };

  pricing: {
    suggestedPrice: string;
    priceLow: string;
    priceHigh: string;
    suggestedPriceRaw: number | null;
    priceLowRaw: number | null;
    priceHighRaw: number | null;
  };

  comparables: Array<{
    number: number;
    address: string;
    fullAddress: string;
    soldPrice: string;
    soldPriceRaw: number | null;
    adjustedPrice: string;
    adjustedPriceRaw: number | null;
    soldDate: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    lotSqft: number;
    distanceKm: string;
    totalAdjustment: string;
    images: string[];
    adjustments: Array<{
      category: string;
      label: string;
      subjectValue: string | null;
      compValue: string | null;
      amount: string;
      amountRaw: number;
    }>;
  }>;

  marketSnapshots: Array<{
    period: string;
    avgPrice: number | null;
    medianPrice: number | null;
    avgDom: number | null;
    activeCount: number | null;
    soldCount: number | null;
    avgPricePerSqft: number | null;
  }>;

  neighborhood: {
    walkScore?: number;
    walkScoreDescription?: string;
    transitScore?: number;
    transitScoreDescription?: string;
    bikeScore?: number;
    bikeScoreDescription?: string;
    crimeIndex?: number;
    crimeDescription?: string;
    avgSchoolRating?: number;
    schools?: Array<{
      name: string;
      type: string;
      rating: number;
      distance: string;
    }>;
    medianHouseholdIncome?: number;
    medianAge?: number;
    populationDensity?: number;
    amenities?: string[];
  } | null;
}
