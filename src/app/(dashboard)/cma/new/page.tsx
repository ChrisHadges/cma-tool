"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Loader2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";

type Step = "search" | "details" | "criteria" | "comps" | "confirm";

interface SubjectPropertyForm {
  mlsNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  style: string;
  bedrooms: number | null;
  bedroomsPlus: number | null;
  bathrooms: number | null;
  bathroomsHalf: number | null;
  sqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  garage: string;
  garageSpaces: number | null;
  basement: string;
  heating: string;
  cooling: string;
  pool: string;
  listPrice: number | null;
  taxesAnnual: number | null;
  daysOnMarket: number | null;
  description: string;
  images: string[];
  dataJson: unknown;
}

interface CompCriteria {
  radius: string;
  soldWithinMonths: string;
  minBeds: string;
  maxBeds: string;
  minBaths: string;
  minSqft: string;
  maxSqft: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  status: string;
}

const emptyForm: SubjectPropertyForm = {
  mlsNumber: "",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  latitude: null,
  longitude: null,
  propertyType: "",
  style: "",
  bedrooms: null,
  bedroomsPlus: null,
  bathrooms: null,
  bathroomsHalf: null,
  sqft: null,
  lotSqft: null,
  yearBuilt: null,
  garage: "",
  garageSpaces: null,
  basement: "",
  heating: "",
  cooling: "",
  pool: "",
  listPrice: null,
  taxesAnnual: null,
  daysOnMarket: null,
  description: "",
  images: [],
  dataJson: null,
};

const STEPS: { key: Step; label: string }[] = [
  { key: "search", label: "Find Property" },
  { key: "details", label: "Property Details" },
  { key: "criteria", label: "Comp Criteria" },
  { key: "comps", label: "Select Comps" },
  { key: "confirm", label: "Create Report" },
];

export default function NewCmaPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <NewCmaPageInner />
    </Suspense>
  );
}

function NewCmaPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("search");
  const [mlsSearch, setMlsSearch] = useState(searchParams.get("mls") || "");
  const [searchResults, setSearchResults] = useState<
    Record<string, unknown>[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SubjectPropertyForm>(emptyForm);
  const [title, setTitle] = useState("");

  // Comp selection state
  const [criteria, setCriteria] = useState<CompCriteria>({
    radius: "3",
    soldWithinMonths: "6",
    minBeds: "",
    maxBeds: "",
    minBaths: "",
    minSqft: "",
    maxSqft: "",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    status: "U",
  });
  const [compResults, setCompResults] = useState<Record<string, unknown>[]>([]);
  const [selectedComps, setSelectedComps] = useState<Set<string>>(new Set());
  const [searchingComps, setSearchingComps] = useState(false);

  // Auto-search if MLS number provided in URL
  useEffect(() => {
    if (searchParams.get("mls")) {
      handleMlsLookup();
    }
  }, []);

  // When subject property is set, auto-populate comp criteria based on it
  useEffect(() => {
    if (form.bedrooms || form.sqft || form.listPrice || form.propertyType) {
      const beds = form.bedrooms ?? 0;
      const sqft = form.sqft ?? 0;
      const price = form.listPrice ?? 0;

      setCriteria((prev) => ({
        ...prev,
        minBeds: beds > 0 ? String(Math.max(1, beds - 1)) : "",
        maxBeds: beds > 0 ? String(beds + 1) : "",
        minBaths: form.bathrooms ? String(Math.max(1, (form.bathrooms ?? 0) - 1)) : "",
        minSqft: sqft > 0 ? String(Math.round(sqft * 0.8)) : "",
        maxSqft: sqft > 0 ? String(Math.round(sqft * 1.2)) : "",
        propertyType: form.propertyType || "",
        minPrice: price > 0 ? String(Math.round(price * 0.75)) : "",
        maxPrice: price > 0 ? String(Math.round(price * 1.25)) : "",
      }));
    }
  }, [form.bedrooms, form.bathrooms, form.sqft, form.listPrice, form.propertyType]);

  const handleMlsLookup = async () => {
    if (!mlsSearch.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${mlsSearch.trim()}`);
      if (res.ok) {
        const listing = await res.json();
        populateFromListing(listing);
        setStep("details");
      } else {
        const searchRes = await fetch(
          `/api/properties/search?search=${encodeURIComponent(mlsSearch)}&resultsPerPage=10`
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          setSearchResults(data.listings || []);
        }
      }
    } catch (error) {
      console.error("Lookup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const populateFromListing = (listing: Record<string, unknown>) => {
    const address = listing.address as Record<string, string>;
    const details = listing.details as Record<string, unknown>;
    const lot = listing.lot as Record<string, string>;
    const map = listing.map as Record<string, number>;
    const taxes = listing.taxes as Record<string, unknown>;

    const streetAddr = [
      address?.unitNumber ? `${address.unitNumber}-` : "",
      address?.streetNumber,
      address?.streetName,
      address?.streetSuffix,
    ]
      .filter(Boolean)
      .join(" ");

    let lotSqft: number | null = null;
    if (lot?.depth && lot?.width) {
      const depth = parseFloat(lot.depth);
      const width = parseFloat(lot.width);
      if (depth && width) {
        lotSqft = Math.round(depth * width);
      }
    }

    let sqft: number | null = null;
    if (details?.sqft) {
      const sqftStr = details.sqft as string;
      const parts = sqftStr.split("-").map((s) => parseInt(s.trim(), 10));
      sqft =
        parts.length === 2
          ? Math.round((parts[0] + parts[1]) / 2)
          : parts[0] || null;
    }

    setForm({
      mlsNumber: (listing.mlsNumber as string) || "",
      streetAddress: streetAddr,
      city: address?.city || "",
      state: address?.state || "",
      zip: address?.zip || "",
      country: address?.country || "US",
      latitude: map?.latitude || null,
      longitude: map?.longitude || null,
      propertyType: (details?.propertyType as string) || "",
      style: (details?.style as string) || "",
      bedrooms: (details?.numBedrooms as number) ?? null,
      bedroomsPlus: (details?.numBedroomsPlus as number) ?? null,
      bathrooms: (details?.numBathrooms as number) ?? null,
      bathroomsHalf: (details?.numBathroomsHalf as number) ?? null,
      sqft,
      lotSqft,
      yearBuilt: details?.yearBuilt
        ? parseInt(details.yearBuilt as string, 10)
        : null,
      garage: (details?.garage as string) || "",
      garageSpaces: (listing.numGarageSpaces as number) ?? null,
      basement: (details?.basement1 as string) || "",
      heating: (details?.heating as string) || "",
      cooling: (details?.airConditioning as string) || "",
      pool: (details?.swimmingPool as string) || "",
      listPrice: listing.listPrice ? Number(listing.listPrice) : null,
      taxesAnnual: taxes?.annualAmount ? Number(taxes.annualAmount) : null,
      daysOnMarket: (listing.daysOnMarket as number) ?? null,
      description: (details?.description as string) || "",
      images: (listing.images as string[]) || [],
      dataJson: listing,
    });

    setTitle(`CMA - ${streetAddr}, ${address?.city}`);
  };

  const selectFromResults = (listing: Record<string, unknown>) => {
    populateFromListing(listing);
    setSearchResults([]);
    setStep("details");
  };

  const searchForComps = async () => {
    setSearchingComps(true);
    setCompResults([]);
    try {
      // First try similar listings if we have an MLS number
      if (form.mlsNumber) {
        const simRes = await fetch(
          `/api/properties/${form.mlsNumber}/similar?radius=${criteria.radius}`
        );
        if (simRes.ok) {
          const simData = await simRes.json();
          if (simData.listings && simData.listings.length > 0) {
            setCompResults(simData.listings);
            setSearchingComps(false);
            return;
          }
        }
      }

      // Fallback to parametric search
      const params = new URLSearchParams();
      if (form.city) params.set("city", form.city);
      if (criteria.status) params.set("status", criteria.status);
      if (criteria.status === "U") params.set("lastStatus", "Sld");
      if (criteria.minBeds) params.set("minBedrooms", criteria.minBeds);
      if (criteria.maxBeds) params.set("maxBedrooms", criteria.maxBeds);
      if (criteria.minBaths) params.set("minBaths", criteria.minBaths);
      if (criteria.minSqft) params.set("minSqft", criteria.minSqft);
      if (criteria.maxSqft) params.set("maxSqft", criteria.maxSqft);
      if (criteria.propertyType) params.set("propertyType", criteria.propertyType);
      if (criteria.minPrice) {
        if (criteria.status === "U") {
          params.set("minSoldPrice", criteria.minPrice);
        } else {
          params.set("minPrice", criteria.minPrice);
        }
      }
      if (criteria.maxPrice) {
        if (criteria.status === "U") {
          params.set("maxSoldPrice", criteria.maxPrice);
        } else {
          params.set("maxPrice", criteria.maxPrice);
        }
      }
      if (criteria.soldWithinMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() - parseInt(criteria.soldWithinMonths, 10));
        params.set("minSoldDate", d.toISOString().split("T")[0]);
      }
      // Geo search if we have coordinates
      if (form.latitude && form.longitude) {
        params.set("lat", String(form.latitude));
        params.set("long", String(form.longitude));
        params.set("radius", criteria.radius);
      }
      params.set("resultsPerPage", "20");
      params.set("sortBy", "soldDateDesc");

      const res = await fetch(`/api/properties/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCompResults(data.listings || []);
      }
    } catch (error) {
      console.error("Comp search error:", error);
    } finally {
      setSearchingComps(false);
    }
  };

  const toggleComp = (listing: Record<string, unknown>) => {
    const mls = listing.mlsNumber as string;
    setSelectedComps((prev) => {
      const next = new Set(prev);
      if (next.has(mls)) {
        next.delete(mls);
      } else if (next.size < 6) {
        next.add(mls);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Build comp data from selected comps
      const selectedCompData = compResults
        .filter((listing) => selectedComps.has(listing.mlsNumber as string))
        .map((listing) => {
          const addr = listing.address as Record<string, string>;
          const det = listing.details as Record<string, unknown>;
          const mp = listing.map as Record<string, number>;
          const lot = listing.lot as Record<string, string>;

          const streetAddr = [
            addr?.unitNumber ? `${addr.unitNumber}-` : "",
            addr?.streetNumber,
            addr?.streetName,
            addr?.streetSuffix,
          ]
            .filter(Boolean)
            .join(" ");

          let compSqft: number | null = null;
          if (det?.sqft) {
            const parts = (det.sqft as string).split("-").map((s: string) => parseInt(s.trim(), 10));
            compSqft = parts.length === 2 ? Math.round((parts[0] + parts[1]) / 2) : parts[0] || null;
          }

          let lotSqft: number | null = null;
          if (lot?.depth && lot?.width) {
            const d = parseFloat(lot.depth);
            const w = parseFloat(lot.width);
            if (d && w) lotSqft = Math.round(d * w);
          }

          return {
            mlsNumber: (listing.mlsNumber as string) || null,
            streetAddress: streetAddr,
            city: addr?.city || "",
            state: addr?.state || "",
            zip: addr?.zip || "",
            latitude: mp?.latitude || null,
            longitude: mp?.longitude || null,
            propertyType: (det?.propertyType as string) || null,
            style: (det?.style as string) || null,
            bedrooms: (det?.numBedrooms as number) ?? null,
            bedroomsPlus: (det?.numBedroomsPlus as number) ?? null,
            bathrooms: (det?.numBathrooms as number) ?? null,
            bathroomsHalf: (det?.numBathroomsHalf as number) ?? null,
            sqft: compSqft,
            lotSqft,
            yearBuilt: det?.yearBuilt ? parseInt(det.yearBuilt as string, 10) : null,
            garage: (det?.garage as string) || null,
            garageSpaces: (listing.numGarageSpaces as number) ?? null,
            basement: (det?.basement1 as string) || null,
            heating: (det?.heating as string) || null,
            cooling: (det?.airConditioning as string) || null,
            pool: (det?.swimmingPool as string) || null,
            soldPrice: listing.soldPrice ? Number(listing.soldPrice) : null,
            listPrice: listing.listPrice ? Number(listing.listPrice) : null,
            soldDate: (listing.soldDate as string) || null,
            daysOnMarket: (listing.daysOnMarket as number) ?? null,
            images: (listing.images as string[]) || [],
            dataJson: listing,
          };
        });

      const res = await fetch("/api/cma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `CMA - ${form.streetAddress}`,
          subjectProperty: form,
          comparables: selectedCompData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/cma/${data.id}`);
      }
    } catch (error) {
      console.error("Create error:", error);
    } finally {
      setCreating(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New CMA Report</h1>
        <p className="text-muted-foreground mt-1">
          {step === "search" && "Start by finding the subject property"}
          {step === "details" && "Review and edit property details"}
          {step === "criteria" &&
            "Set criteria for finding comparable properties"}
          {step === "comps" && "Select comparable properties for your analysis"}
          {step === "confirm" && "Review everything and create your CMA"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <button
              onClick={() => i <= stepIndex && setStep(s.key)}
              disabled={i > stepIndex}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                s.key === step
                  ? "bg-primary text-primary-foreground"
                  : i < stepIndex
                  ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center bg-white/20 text-[10px]">
                {i < stepIndex ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-4 h-0.5 bg-muted" />
            )}
          </div>
        ))}
      </div>

      {/* Step: Search */}
      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Find Subject Property</CardTitle>
            <CardDescription>
              Enter an MLS number or search by address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter MLS# or address..."
                value={mlsSearch}
                onChange={(e) => setMlsSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMlsLookup()}
                className="flex-1"
              />
              <Button onClick={handleMlsLookup} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a property:
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map((listing) => (
                    <PropertyCard
                      key={listing.mlsNumber as string}
                      listing={listing}
                      selectable
                      onSelect={selectFromResults}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Button variant="outline" onClick={() => setStep("details")}>
                Or enter details manually
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Property Details</CardTitle>
            <CardDescription>
              Review and adjust the property information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="CMA Report Title"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={form.streetAddress}
                  onChange={(e) =>
                    setForm({ ...form, streetAddress: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input
                    id="zip"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  value={form.bedrooms ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bedrooms: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  value={form.bathrooms ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bathrooms: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Sqft</Label>
                <Input
                  type="number"
                  value={form.sqft ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sqft: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Year Built</Label>
                <Input
                  type="number"
                  value={form.yearBuilt ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      yearBuilt: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Lot Size (sqft)</Label>
                <Input
                  type="number"
                  value={form.lotSqft ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lotSqft: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Garage Spaces</Label>
                <Input
                  type="number"
                  value={form.garageSpaces ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      garageSpaces: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>List Price</Label>
                <Input
                  type="number"
                  value={form.listPrice ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      listPrice: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Property Type</Label>
                <Input
                  value={form.propertyType}
                  onChange={(e) =>
                    setForm({ ...form, propertyType: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Basement</Label>
                <Input
                  value={form.basement}
                  onChange={(e) =>
                    setForm({ ...form, basement: e.target.value })
                  }
                  placeholder="e.g., Finished, Unfinished"
                />
              </div>
              <div>
                <Label>Heating</Label>
                <Input
                  value={form.heating}
                  onChange={(e) =>
                    setForm({ ...form, heating: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Pool</Label>
                <Input
                  value={form.pool}
                  onChange={(e) => setForm({ ...form, pool: e.target.value })}
                  placeholder="None"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("search")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep("criteria")}>
                Continue to Comp Criteria
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Comp Criteria */}
      {step === "criteria" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Comparable Search Criteria</CardTitle>
                <CardDescription>
                  These filters have been auto-populated based on your subject
                  property. Adjust them to refine your comp search.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject Property Summary */}
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">
                Subject Property
              </p>
              <p className="font-semibold">
                {form.streetAddress}, {form.city}, {form.state}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {form.bedrooms ? (
                  <span className="flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    {form.bedrooms} beds
                  </span>
                ) : null}
                {form.bathrooms ? (
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {form.bathrooms} baths
                  </span>
                ) : null}
                {form.sqft ? (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" />
                    {form.sqft.toLocaleString()} sqft
                  </span>
                ) : null}
                {form.yearBuilt ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Built {form.yearBuilt}
                  </span>
                ) : null}
                {form.listPrice ? (
                  <span className="font-medium text-foreground">
                    ${form.listPrice.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Location & Time */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location & Timeframe
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Search Radius (miles)</Label>
                  <Select
                    value={criteria.radius}
                    onValueChange={(v) =>
                      setCriteria({ ...criteria, radius: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5 miles</SelectItem>
                      <SelectItem value="1">1 mile</SelectItem>
                      <SelectItem value="2">2 miles</SelectItem>
                      <SelectItem value="3">3 miles</SelectItem>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Distance from subject property
                  </p>
                </div>
                <div>
                  <Label>Sold Within</Label>
                  <Select
                    value={criteria.soldWithinMonths}
                    onValueChange={(v) =>
                      setCriteria({ ...criteria, soldWithinMonths: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Last 3 months</SelectItem>
                      <SelectItem value="6">Last 6 months</SelectItem>
                      <SelectItem value="9">Last 9 months</SelectItem>
                      <SelectItem value="12">Last 12 months</SelectItem>
                      <SelectItem value="18">Last 18 months</SelectItem>
                      <SelectItem value="24">Last 24 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How far back to search for sales
                  </p>
                </div>
              </div>
            </div>

            {/* Property Characteristics */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                Property Characteristics
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Min Bedrooms</Label>
                  <Input
                    type="number"
                    value={criteria.minBeds}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minBeds: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>
                <div>
                  <Label>Max Bedrooms</Label>
                  <Input
                    type="number"
                    value={criteria.maxBeds}
                    onChange={(e) =>
                      setCriteria({ ...criteria, maxBeds: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>
                <div>
                  <Label>Min Bathrooms</Label>
                  <Input
                    type="number"
                    value={criteria.minBaths}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minBaths: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>
                <div>
                  <Label>Min Sqft</Label>
                  <Input
                    type="number"
                    value={criteria.minSqft}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minSqft: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>
                <div>
                  <Label>Max Sqft</Label>
                  <Input
                    type="number"
                    value={criteria.maxSqft}
                    onChange={(e) =>
                      setCriteria({ ...criteria, maxSqft: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Input
                    value={criteria.propertyType}
                    onChange={(e) =>
                      setCriteria({
                        ...criteria,
                        propertyType: e.target.value,
                      })
                    }
                    placeholder="Any type"
                  />
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                $ Price Range
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Min Price</Label>
                  <Input
                    type="number"
                    value={criteria.minPrice}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minPrice: e.target.value })
                    }
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <Label>Max Price</Label>
                  <Input
                    type="number"
                    value={criteria.maxPrice}
                    onChange={(e) =>
                      setCriteria({ ...criteria, maxPrice: e.target.value })
                    }
                    placeholder="No maximum"
                  />
                </div>
                <div>
                  <Label>Listing Status</Label>
                  <Select
                    value={criteria.status}
                    onValueChange={(v) =>
                      setCriteria({ ...criteria, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U">Sold</SelectItem>
                      <SelectItem value="A">Active</SelectItem>
                      <SelectItem value="A,U">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("details")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => {
                  setStep("comps");
                  searchForComps();
                }}
              >
                Find Comparables
                <Search className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Select Comps */}
      {step === "comps" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Comparable Properties</CardTitle>
                  <CardDescription>
                    {searchingComps
                      ? "Searching for comparable properties..."
                      : `${compResults.length} properties found — select up to 6 comps`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedComps.size > 0 && (
                    <Badge variant="default">
                      {selectedComps.size} selected
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep("criteria")}
                  >
                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                    Adjust Criteria
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {searchingComps ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-muted-foreground">
                    Searching for comparable properties...
                  </p>
                </div>
              ) : compResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No properties found matching your criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setStep("criteria")}
                  >
                    Adjust Search Criteria
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {compResults.map((listing) => (
                    <PropertyCard
                      key={listing.mlsNumber as string}
                      listing={listing}
                      selectable
                      selected={selectedComps.has(
                        listing.mlsNumber as string
                      )}
                      onSelect={() => toggleComp(listing)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Comps Summary */}
          {selectedComps.size > 0 && (
            <Card className="border-primary">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">
                      {selectedComps.size} comparable
                      {selectedComps.size !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedComps(new Set())}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("criteria")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Criteria
            </Button>
            <Button onClick={() => setStep("confirm")}>
              {selectedComps.size > 0
                ? `Continue with ${selectedComps.size} Comp${selectedComps.size !== 1 ? "s" : ""}`
                : "Skip Comps & Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Create CMA</CardTitle>
            <CardDescription>
              Confirm everything looks good before creating your report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject Property Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Subject Property
              </p>
              <h3 className="font-semibold text-lg">
                {title || form.streetAddress}
              </h3>
              <p className="text-muted-foreground">
                {form.streetAddress}, {form.city}, {form.state} {form.zip}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                {form.bedrooms ? <span>{form.bedrooms} Beds</span> : null}
                {form.bathrooms ? <span>{form.bathrooms} Baths</span> : null}
                {form.sqft ? (
                  <span>{form.sqft.toLocaleString()} sqft</span>
                ) : null}
                {form.yearBuilt ? <span>Built {form.yearBuilt}</span> : null}
                {form.listPrice ? (
                  <span className="font-medium">
                    ${form.listPrice.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Comp Criteria Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Search Criteria Used
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{criteria.radius} mi radius</Badge>
                <Badge variant="outline">
                  Last {criteria.soldWithinMonths} months
                </Badge>
                {criteria.minBeds && (
                  <Badge variant="outline">
                    {criteria.minBeds}-{criteria.maxBeds || "+"} beds
                  </Badge>
                )}
                {criteria.minSqft && (
                  <Badge variant="outline">
                    {Number(criteria.minSqft).toLocaleString()}-
                    {criteria.maxSqft
                      ? Number(criteria.maxSqft).toLocaleString()
                      : "+"}{" "}
                    sqft
                  </Badge>
                )}
                {criteria.propertyType && (
                  <Badge variant="outline">{criteria.propertyType}</Badge>
                )}
              </div>
            </div>

            {/* Selected Comps Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Comparables
              </p>
              {selectedComps.size > 0 ? (
                <p className="text-sm">
                  {selectedComps.size} comparable propert
                  {selectedComps.size !== 1 ? "ies" : "y"} selected
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No comps pre-selected — you can add them after creating the
                  report
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("comps")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                size="lg"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create CMA Report"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
