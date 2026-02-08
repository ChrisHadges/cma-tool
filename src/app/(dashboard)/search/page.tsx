"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Building2,
  Loader2,
  MapPin,
  Sparkles,
  Navigation,
} from "lucide-react";
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

const INITIAL_FILTERS: SearchFilters = {
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
};

interface AutocompleteSuggestion {
  name: string;
  type: string;
  map?: { latitude: number; longitude: number };
  address?: {
    state?: string;
    country?: string;
    city?: string;
    area?: string;
  };
}

const PRICE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "100000", label: "$100K" },
  { value: "200000", label: "$200K" },
  { value: "300000", label: "$300K" },
  { value: "400000", label: "$400K" },
  { value: "500000", label: "$500K" },
  { value: "600000", label: "$600K" },
  { value: "750000", label: "$750K" },
  { value: "1000000", label: "$1M" },
  { value: "1500000", label: "$1.5M" },
  { value: "2000000", label: "$2M" },
  { value: "3000000", label: "$3M" },
  { value: "5000000", label: "$5M" },
];

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [results, setResults] = useState<{
    listings: unknown[];
    count: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount = [
    filters.city,
    filters.propertyType,
    filters.minPrice,
    filters.maxPrice,
    filters.minBedrooms,
    filters.minBaths,
    filters.minSqft,
    filters.maxSqft,
    filters.lastStatus,
    filters.status !== "A" ? filters.status : "",
  ].filter(Boolean).length;

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/properties/autocomplete?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        // Take top 8 suggestions
        const items = (Array.isArray(data) ? data : data.suggestions || []).slice(0, 8);
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
        setHighlightedIndex(-1);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Handle search input changes with debounced autocomplete
  const handleSearchInputChange = (value: string) => {
    updateFilter("search", value);
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }
    autocompleteTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 250);
  };

  // Handle selecting an autocomplete suggestion
  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);

    // Determine if it's a city — set city filter; otherwise use as search term
    if (suggestion.type === "city" || suggestion.type === "community") {
      updateFilter("search", "");
      updateFilter("city", suggestion.name);
    } else if (suggestion.type === "neighborhood" || suggestion.type === "area") {
      updateFilter("search", suggestion.name);
      updateFilter("city", "");
    } else {
      // Address or other — use as search
      updateFilter("search", suggestion.name);
    }

    // Trigger search after a tick so state is updated
    setTimeout(() => {
      handleSearch();
    }, 50);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation in suggestions
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === "Enter") {
      setShowSuggestions(false);
      handleSearch();
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "city":
      case "community":
        return <Building2 className="h-4 w-4 text-muted-foreground" />;
      case "neighborhood":
      case "area":
        return <Navigation className="h-4 w-4 text-muted-foreground" />;
      default:
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.city) params.set("city", filters.city);
      if (filters.propertyType && filters.propertyType !== "all")
        params.set("propertyType", filters.propertyType);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.minBedrooms && filters.minBedrooms !== "any")
        params.set("minBedrooms", filters.minBedrooms);
      if (filters.minBaths && filters.minBaths !== "any")
        params.set("minBaths", filters.minBaths);
      if (filters.minSqft) params.set("minSqft", filters.minSqft);
      if (filters.maxSqft) params.set("maxSqft", filters.maxSqft);
      if (filters.status) params.set("status", filters.status);
      if (filters.lastStatus && filters.lastStatus !== "any")
        params.set("lastStatus", filters.lastStatus);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      params.set("resultsPerPage", "24");

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

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => ({ ...prev, [key]: INITIAL_FILTERS[key] }));
  };

  // Quick-search on filter changes after initial search
  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    filters.propertyType,
    filters.minPrice,
    filters.maxPrice,
    filters.minBedrooms,
    filters.minBaths,
    filters.status,
    filters.lastStatus,
    filters.sortBy,
    filters.city,
  ]);

  // Build active filter badges
  const getActiveFilterBadges = () => {
    const badges: { key: keyof SearchFilters; label: string }[] = [];
    if (filters.city) badges.push({ key: "city", label: `City: ${filters.city}` });
    if (filters.propertyType && filters.propertyType !== "all")
      badges.push({ key: "propertyType", label: filters.propertyType });
    if (filters.minPrice)
      badges.push({
        key: "minPrice",
        label: `Min: $${Number(filters.minPrice).toLocaleString()}`,
      });
    if (filters.maxPrice)
      badges.push({
        key: "maxPrice",
        label: `Max: $${Number(filters.maxPrice).toLocaleString()}`,
      });
    if (filters.minBedrooms && filters.minBedrooms !== "any")
      badges.push({ key: "minBedrooms", label: `${filters.minBedrooms}+ beds` });
    if (filters.minBaths && filters.minBaths !== "any")
      badges.push({ key: "minBaths", label: `${filters.minBaths}+ baths` });
    if (filters.lastStatus && filters.lastStatus !== "any")
      badges.push({ key: "lastStatus", label: `Status: ${filters.lastStatus}` });
    if (filters.status !== "A")
      badges.push({
        key: "status",
        label: filters.status === "U" ? "Sold" : "All Statuses",
      });
    return badges;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Hero Search Bar ─────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl canva-gradient flex items-center justify-center">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Find Properties
            </h1>
            <p className="text-sm text-muted-foreground">
              Search MLS listings by address, MLS#, or keyword
            </p>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              ref={searchInputRef}
              placeholder="Enter an address, MLS#, neighborhood, or city..."
              className="h-12 pl-12 pr-4 text-base rounded-xl border-border/60 bg-white dark:bg-gray-900 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              value={filters.search}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-border/60 shadow-lg z-50 overflow-hidden max-h-[340px] overflow-y-auto"
              >
                {loadingSuggestions && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.name}-${suggestion.type}-${index}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                      index === highlightedIndex
                        ? "bg-primary/5 text-primary"
                        : ""
                    }`}
                  >
                    <div className="shrink-0">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {suggestion.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.address?.state && (
                          <span>{suggestion.address.state}</span>
                        )}
                        {suggestion.address?.country && (
                          <span>
                            {suggestion.address.state ? ", " : ""}
                            {suggestion.address.country}
                          </span>
                        )}
                        {!suggestion.address?.state &&
                          !suggestion.address?.country && (
                            <span className="capitalize">
                              {suggestion.type}
                            </span>
                          )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] px-1.5 py-0 h-5 capitalize rounded-md"
                    >
                      {suggestion.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              setShowSuggestions(false);
              handleSearch();
            }}
            disabled={loading}
            className="h-12 px-8 rounded-xl text-base font-semibold canva-gradient border-0 text-white hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Quick Filters Row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Status Toggle */}
          <div className="flex rounded-lg border border-border/60 overflow-hidden bg-white dark:bg-gray-900">
            {[
              { value: "A", label: "For Sale" },
              { value: "U", label: "Sold" },
              { value: "A,U", label: "All" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("status", opt.value)}
                className={`px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  filters.status === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border/60" />

          {/* Price Quick Select */}
          <Select
            value={filters.minPrice}
            onValueChange={(v) => updateFilter("minPrice", v === "none" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-lg border-border/60 bg-white dark:bg-gray-900 text-sm px-3">
              <span className="text-muted-foreground">Min</span>
              <SelectValue placeholder="No Min" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Min</SelectItem>
              {PRICE_OPTIONS.filter((p) => p.value).map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground text-xs">–</span>

          <Select
            value={filters.maxPrice}
            onValueChange={(v) => updateFilter("maxPrice", v === "none" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-lg border-border/60 bg-white dark:bg-gray-900 text-sm px-3">
              <span className="text-muted-foreground">Max</span>
              <SelectValue placeholder="No Max" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Max</SelectItem>
              {PRICE_OPTIONS.filter((p) => p.value).map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border/60" />

          {/* Beds */}
          <Select
            value={filters.minBedrooms || "any"}
            onValueChange={(v) =>
              updateFilter("minBedrooms", v === "any" ? "" : v)
            }
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-lg border-border/60 bg-white dark:bg-gray-900 text-sm px-3">
              <SelectValue placeholder="Beds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Beds</SelectItem>
              <SelectItem value="1">1+ Beds</SelectItem>
              <SelectItem value="2">2+ Beds</SelectItem>
              <SelectItem value="3">3+ Beds</SelectItem>
              <SelectItem value="4">4+ Beds</SelectItem>
              <SelectItem value="5">5+ Beds</SelectItem>
            </SelectContent>
          </Select>

          {/* Baths */}
          <Select
            value={filters.minBaths || "any"}
            onValueChange={(v) =>
              updateFilter("minBaths", v === "any" ? "" : v)
            }
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-lg border-border/60 bg-white dark:bg-gray-900 text-sm px-3">
              <SelectValue placeholder="Baths" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Baths</SelectItem>
              <SelectItem value="1">1+ Baths</SelectItem>
              <SelectItem value="2">2+ Baths</SelectItem>
              <SelectItem value="3">3+ Baths</SelectItem>
              <SelectItem value="4">4+ Baths</SelectItem>
            </SelectContent>
          </Select>

          {/* Property Type */}
          <Select
            value={filters.propertyType || "all"}
            onValueChange={(v) =>
              updateFilter("propertyType", v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-lg border-border/60 bg-white dark:bg-gray-900 text-sm px-3">
              <Building2 className="h-3.5 w-3.5" />
              <SelectValue placeholder="Home Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Detached">Detached</SelectItem>
              <SelectItem value="Semi-Detached">Semi-Detached</SelectItem>
              <SelectItem value="Condo Apt">Condo Apt</SelectItem>
              <SelectItem value="Condo Townhouse">Condo Townhouse</SelectItem>
              <SelectItem value="Freehold Townhouse">Freehold Townhouse</SelectItem>
              <SelectItem value="Link">Link</SelectItem>
              <SelectItem value="Multiplex">Multiplex</SelectItem>
            </SelectContent>
          </Select>

          {/* More Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 rounded-lg border-border/60 bg-white dark:bg-gray-900 text-sm gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            More
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Extended Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-border/60 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* City */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Any city"
                    className="h-9 pl-9 text-sm rounded-lg"
                    value={filters.city}
                    onChange={(e) => updateFilter("city", e.target.value)}
                  />
                </div>
              </div>

              {/* Sqft Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Sqft Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    className="h-9 text-sm rounded-lg"
                    value={filters.minSqft}
                    onChange={(e) => updateFilter("minSqft", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    className="h-9 text-sm rounded-lg"
                    value={filters.maxSqft}
                    onChange={(e) => updateFilter("maxSqft", e.target.value)}
                  />
                </div>
              </div>

              {/* Sold Status */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Sold Status
                </label>
                <Select
                  value={filters.lastStatus || "any"}
                  onValueChange={(v) =>
                    updateFilter("lastStatus", v === "any" ? "" : v)
                  }
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg">
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
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => updateFilter("sortBy", v)}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdOnDesc">Newest First</SelectItem>
                    <SelectItem value="listPriceAsc">Price: Low → High</SelectItem>
                    <SelectItem value="listPriceDesc">Price: High → Low</SelectItem>
                    <SelectItem value="soldDateDesc">Recently Sold</SelectItem>
                    <SelectItem value="sqftDesc">Largest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        )}

        {/* Active Filter Badges */}
        {getActiveFilterBadges().length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {getActiveFilterBadges().map((badge) => (
              <Badge
                key={badge.key}
                variant="secondary"
                className="pl-2.5 pr-1 py-1 text-xs rounded-full gap-1 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
              >
                {badge.label}
                <button
                  onClick={() => removeFilter(badge.key)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {getActiveFilterBadges().length > 1 && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      {loading && !results && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm font-medium">Searching properties...</p>
        </div>
      )}

      {results && (
        <div>
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {results.count.toLocaleString()} {results.count === 1 ? "Result" : "Results"}
              </h2>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => updateFilter("sortBy", v)}
            >
              <SelectTrigger className="h-8 w-[170px] text-sm rounded-lg border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdOnDesc">Newest First</SelectItem>
                <SelectItem value="listPriceAsc">Price: Low → High</SelectItem>
                <SelectItem value="listPriceDesc">Price: High → Low</SelectItem>
                <SelectItem value="soldDateDesc">Recently Sold</SelectItem>
                <SelectItem value="sqftDesc">Largest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results grid */}
          {(results.listings as Record<string, unknown>[]).length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(results.listings as Record<string, unknown>[]).map(
                (listing: Record<string, unknown>) => (
                  <PropertyCard
                    key={listing.mlsNumber as string}
                    listing={listing}
                  />
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No properties found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Try adjusting your filters or search for a different area. You
                can also try broadening the price range or reducing the minimum
                bedroom count.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-lg"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State — Before Search */}
      {!hasSearched && !results && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-2xl canva-gradient flex items-center justify-center opacity-90">
              <Search className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-white dark:bg-gray-900 border border-border/60 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-xl mb-2">
            Search the MLS
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Enter an address, MLS number, or keyword above to find properties.
            Use filters to narrow your results and find the perfect comps for
            your CMA report.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Toronto", "Mississauga", "Brampton", "Vaughan", "Oakville", "Markham"].map(
              (city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-8 border-border/60"
                  onClick={() => {
                    updateFilter("city", city);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {city}
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
