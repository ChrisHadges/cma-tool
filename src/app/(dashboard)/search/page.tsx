"use client";

import { useState, useCallback } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Bed, Bath, Ruler, Calendar } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";

interface SearchFilters {
  search: string;
  city: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minBaths: string;
  minSqft: string;
  maxSqft: string;
  status: string;
  lastStatus: string;
  sortBy: string;
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    city: "",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    minBedrooms: "",
    minBaths: "",
    minSqft: "",
    maxSqft: "",
    status: "A",
    lastStatus: "",
    sortBy: "createdOnDesc",
  });
  const [results, setResults] = useState<{ listings: unknown[]; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.city) params.set("city", filters.city);
      if (filters.propertyType) params.set("propertyType", filters.propertyType);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.minBedrooms) params.set("minBedrooms", filters.minBedrooms);
      if (filters.minBaths) params.set("minBaths", filters.minBaths);
      if (filters.minSqft) params.set("minSqft", filters.minSqft);
      if (filters.maxSqft) params.set("maxSqft", filters.maxSqft);
      if (filters.status) params.set("status", filters.status);
      if (filters.lastStatus) params.set("lastStatus", filters.lastStatus);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      params.set("resultsPerPage", "20");

      const res = await fetch(`/api/properties/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Property Search</h1>
        <p className="text-muted-foreground mt-1">
          Search MLS listings to find subject properties and comparables
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Text Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search">Address / Keyword</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by address, MLS#, or keyword..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city">City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  placeholder="City"
                  className="pl-10"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                />
              </div>
            </div>

            {/* Property Type */}
            <div>
              <Label>Property Type</Label>
              <Select
                value={filters.propertyType}
                onValueChange={(v) => updateFilter("propertyType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Type</SelectItem>
                  <SelectItem value="Detached">Detached</SelectItem>
                  <SelectItem value="Semi-Detached">Semi-Detached</SelectItem>
                  <SelectItem value="Condo Apt">Condo Apt</SelectItem>
                  <SelectItem value="Condo Townhouse">Condo Townhouse</SelectItem>
                  <SelectItem value="Freehold Townhouse">Freehold Townhouse</SelectItem>
                  <SelectItem value="Link">Link</SelectItem>
                  <SelectItem value="Multiplex">Multiplex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <Label>Min Price</Label>
              <Input
                type="number"
                placeholder="$0"
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
              />
            </div>
            <div>
              <Label>Max Price</Label>
              <Input
                type="number"
                placeholder="No max"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
              />
            </div>

            {/* Beds, Baths */}
            <div>
              <Label>Min Bedrooms</Label>
              <Select
                value={filters.minBedrooms}
                onValueChange={(v) => updateFilter("minBedrooms", v)}
              >
                <SelectTrigger>
                  <Bed className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Bathrooms</Label>
              <Select
                value={filters.minBaths}
                onValueChange={(v) => updateFilter("minBaths", v)}
              >
                <SelectTrigger>
                  <Bath className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => updateFilter("status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Active</SelectItem>
                  <SelectItem value="U">Sold/Unavailable</SelectItem>
                  <SelectItem value="A,U">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sold Status */}
            <div>
              <Label>Sold Status</Label>
              <Select
                value={filters.lastStatus}
                onValueChange={(v) => updateFilter("lastStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="Sld">Sold</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Exp">Expired</SelectItem>
                  <SelectItem value="Ter">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => updateFilter("sortBy", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdOnDesc">Newest First</SelectItem>
                  <SelectItem value="listPriceAsc">Price: Low to High</SelectItem>
                  <SelectItem value="listPriceDesc">Price: High to Low</SelectItem>
                  <SelectItem value="soldDateDesc">Recently Sold</SelectItem>
                  <SelectItem value="sqftDesc">Largest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  search: "",
                  city: "",
                  propertyType: "",
                  minPrice: "",
                  maxPrice: "",
                  minBedrooms: "",
                  minBaths: "",
                  minSqft: "",
                  maxSqft: "",
                  status: "A",
                  lastStatus: "",
                  sortBy: "createdOnDesc",
                })
              }
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {results.count.toLocaleString()} Results
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(results.listings as Record<string, unknown>[]).map((listing: Record<string, unknown>) => (
              <PropertyCard key={listing.mlsNumber as string} listing={listing} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
