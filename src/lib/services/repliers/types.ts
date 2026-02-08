// ─── Repliers API Types ──────────────────────────────────────────

export interface RepliersAddress {
  streetNumber: string;
  streetName: string;
  streetSuffix: string;
  streetDirection: string | null;
  streetDirectionPrefix: string | null;
  unitNumber: string | null;
  city: string;
  district: string;
  area: string;
  neighborhood: string;
  zip: string;
  state: string;
  country: string;
  communityCode: string | null;
  majorIntersection: string | null;
}

export interface RepliersMap {
  latitude: number;
  longitude: number;
  point: string;
}

export interface RepliersRoom {
  description: string;
  features: string;
  length: string;
  width: string;
  level: string;
}

export interface RepliersBathroom {
  level: string;
  count: number;
  pieces: number;
}

export interface RepliersDetails {
  numBedrooms: number;
  numBedroomsPlus: number;
  numBathrooms: number;
  numBathroomsPlus: number;
  numBathroomsHalf: number;
  numRooms: number;
  numRoomsPlus: number;
  numKitchens: number;
  numKitchensPlus: number;
  numFireplaces: number;
  numStories: number;
  style: string;
  sqft: string;
  yearBuilt: string;
  propertyType: string;
  heating: string;
  airConditioning: string;
  centralAirConditioning: string;
  basement1: string;
  basement2: string;
  den: string;
  familyRoom: string;
  patio: string;
  balcony: string | null;
  garage: string;
  driveway: string;
  sewer: string;
  waterSource: string;
  waterfront: string;
  exteriorConstruction1: string;
  exteriorConstruction2: string;
  roofMaterial: string;
  foundationType: string;
  swimmingPool: string;
  locker: string | null;
  centralVac: string;
  furnished: string;
  elevator: string;
  handicappedEquipped: string;
  description: string;
  extras: string;
  zoning: string;
  zoningDescription: string;
  virtualTourUrl: string | null;
  bathrooms: RepliersBathroom[];
  rooms: RepliersRoom[];
}

export interface RepliersLot {
  acres: string | null;
  depth: string;
  width: string;
  measurement: string;
  size: string | null;
  irregular: string | null;
  legalDescription: string;
}

export interface RepliersTaxes {
  annualAmount: number;
  assessmentYear: string;
}

export interface RepliersCondoFees {
  maintenance: string;
  parkingIncl: string;
  heatIncl: string;
  hydroIncl: string;
  waterIncl: string;
  taxesIncl: string;
  cableIncl: string;
}

export interface RepliersCondominium {
  ammenities: string[];
  buildingInsurance: string;
  condoCorp: string;
  condoCorpNum: string;
  exposure: string;
  locker: string;
  parkingType: string;
  pets: string;
  propertyMgr: string;
  stories: string;
  ensuiteLaundry: string;
  commonElementsIncluded: string;
  fees: RepliersCondoFees;
  unitNumber: string;
}

export interface RepliersTimestamps {
  listingUpdated: string;
  photosUpdated: string;
  listingEntryDate: string;
  closedDate: string | null;
  expiryDate: string | null;
  unavailableDate: string | null;
  possessionDate: string | null;
  suspendedDate: string | null;
  terminatedDate: string | null;
  repliersUpdatedOn: string;
}

export interface RepliersOpenHouse {
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  TZ: string;
}

export interface RepliersAgent {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  brokerageName: string;
}

export interface RepliersListing {
  mlsNumber: string;
  resource: string;
  status: string;
  class: string;
  type: string;
  boardId: number;
  listPrice: string;
  originalPrice: number;
  soldPrice: string | null;
  lastStatus: string;
  assignment: string | null;
  address: RepliersAddress;
  map: RepliersMap;
  details: RepliersDetails;
  lot: RepliersLot;
  numGarageSpaces: number;
  numParkingSpaces: number;
  taxes: RepliersTaxes;
  condominium: RepliersCondominium | null;
  images: string[];
  photoCount: number;
  listDate: string;
  soldDate: string | null;
  updatedOn: string;
  daysOnMarket: number;
  occupancy: string;
  timestamps: RepliersTimestamps;
  permissions: {
    displayAddressOnInternet: string;
    displayPublic: string;
    displayInternetEntireListing: string;
  };
  nearby: { ammenities: string[] };
  office: { brokerageName: string };
  openHouse: RepliersOpenHouse[];
  agents: RepliersAgent[];
  coopCompensation: string;
}

export interface RepliersSearchResponse {
  page: number;
  numPages: number;
  pageSize: number;
  count: number;
  statistics?: Record<string, { avg?: number; min?: number; max?: number }>;
  aggregates?: Record<string, unknown>;
  listings: RepliersListing[];
}

export interface RepliersSearchParams {
  city?: string[];
  area?: string;
  neighborhood?: string[];
  zip?: string[];
  state?: string[];
  lat?: string;
  long?: string;
  radius?: number;
  map?: string;
  class?: string[];
  propertyType?: string[];
  type?: string[];
  status?: string[];
  standardStatus?: string[];
  lastStatus?: string[];
  minPrice?: number;
  maxPrice?: number;
  minSoldPrice?: number;
  maxSoldPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minLotSizeSqft?: number;
  maxLotSizeSqft?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minDaysOnMarket?: number;
  maxDaysOnMarket?: number;
  minSoldDate?: string;
  maxSoldDate?: string;
  minListDate?: string;
  maxListDate?: string;
  sortBy?: string;
  pageNum?: number;
  resultsPerPage?: number;
  fields?: string;
  statistics?: string;
  aggregates?: string;
  listings?: boolean;
  search?: string;
  searchFields?: string;
  hasImages?: boolean;
  [key: string]: unknown;
}

export interface RepliersAutocompleteResult {
  name: string;
  type: string;
  area?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
}

export interface RepliersEstimateRequest {
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zip: string;
  propertyType?: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lotSqft?: number;
  listPrice?: number;
}

export interface RepliersEstimateResponse {
  id: string;
  value: number;
  low: number;
  high: number;
  confidence: number;
  comparables?: RepliersListing[];
}
