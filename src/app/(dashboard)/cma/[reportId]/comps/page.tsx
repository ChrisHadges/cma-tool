"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Calculator,
  Loader2,
  Trash2,
  ArrowUpDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { PropertyCard } from "@/components/property/PropertyCard";

interface Adjustment {
  category: string;
  label: string;
  subjectValue: string;
  compValue: string;
  autoAmount: number;
  adjustmentAmount: number;
  isManual: boolean;
}

interface CompAnalysis {
  property: Record<string, unknown>;
  distanceKm: number;
  adjustments: Adjustment[];
  totalAdjustment: number;
  adjustedPrice: number;
  weight: number;
}

interface CmaResult {
  subjectProperty: Record<string, unknown>;
  comparables: CompAnalysis[];
  priceRecommendation: {
    low: number;
    mid: number;
    high: number;
    weightedAvg: number;
    confidence: number;
  };
}

export default function CompsPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [cmaResult, setCmaResult] = useState<CmaResult | null>(null);
  const [similarListings, setSimilarListings] = useState<Record<string, unknown>[]>([]);
  const [selectedComps, setSelectedComps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch report data
  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/cma/${reportId}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);

          // Load similar listings if subject has MLS number
          if (data.subjectProperty?.mlsNumber) {
            loadSimilarListings(data.subjectProperty.mlsNumber);
          }
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  const loadSimilarListings = async (mlsNumber: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/properties/${mlsNumber}/similar?radius=5`);
      if (res.ok) {
        const data = await res.json();
        setSimilarListings(data.listings || []);
      }
    } catch {
      // Handle error
    } finally {
      setSearching(false);
    }
  };

  const searchComps = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const subject = report?.subjectProperty as Record<string, unknown>;
      const params = new URLSearchParams({
        search: searchQuery,
        status: "U",
        lastStatus: "Sld",
        resultsPerPage: "20",
        sortBy: "soldDateDesc",
      });
      if (subject?.city) params.set("city", subject.city as string);

      const res = await fetch(`/api/properties/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarListings(data.listings || []);
      }
    } catch {
      // Handle error
    } finally {
      setSearching(false);
    }
  };

  const MAX_COMPS = 4;

  const toggleComp = (mlsNumber: string) => {
    setSelectedComps((prev) => {
      const next = new Set(prev);
      if (next.has(mlsNumber)) {
        next.delete(mlsNumber);
      } else {
        // Enforce max of 4 comps
        if (next.size >= MAX_COMPS) return prev;
        next.add(mlsNumber);
      }
      return next;
    });
  };

  const addSelectedComps = async () => {
    // TODO: Save selected comps to database
    // For now, run calculation with selected listings
    await runCalculation();
  };

  const runCalculation = async () => {
    setCalculating(true);
    try {
      const res = await fetch(`/api/cma/${reportId}/calculate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setCmaResult(data);
      }
    } catch {
      // Handle error
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const subject = report?.subjectProperty as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/cma/${reportId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Report
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Comparable Properties</h1>
          <p className="text-muted-foreground mt-1">
            Select and analyze comparable properties
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={selectedComps.size === MAX_COMPS ? "default" : "secondary"}>
            {selectedComps.size} / {MAX_COMPS} comps selected
          </Badge>
          <Button onClick={runCalculation} disabled={calculating || selectedComps.size !== MAX_COMPS}>
            {calculating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            {calculating ? "Calculating..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      {/* Price Recommendation */}
      {cmaResult && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Price Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-red-500">
                  ${cmaResult.priceRecommendation.low.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Suggested</p>
                <p className="text-3xl font-bold text-primary">
                  ${cmaResult.priceRecommendation.mid.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-green-500">
                  ${cmaResult.priceRecommendation.high.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(cmaResult.priceRecommendation.confidence * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Table */}
      {cmaResult && cmaResult.comparables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Analysis</CardTitle>
            <CardDescription>
              Side-by-side comparison with calculated adjustments
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Feature</TableHead>
                  <TableHead className="bg-primary/5">Subject</TableHead>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableHead key={i}>Comp {i + 1}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Address Row */}
                <TableRow>
                  <TableCell className="font-medium">Address</TableCell>
                  <TableCell className="bg-primary/5">
                    {cmaResult.subjectProperty.streetAddress as string}
                  </TableCell>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableCell key={i}>{comp.property.streetAddress as string}</TableCell>
                  ))}
                </TableRow>

                {/* Sold Price Row */}
                <TableRow>
                  <TableCell className="font-medium">Sale Price</TableCell>
                  <TableCell className="bg-primary/5">
                    {cmaResult.subjectProperty.listPrice
                      ? `$${Number(cmaResult.subjectProperty.listPrice).toLocaleString()}`
                      : "N/A"}
                  </TableCell>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableCell key={i}>
                      {comp.property.soldPrice
                        ? `$${Number(comp.property.soldPrice).toLocaleString()}`
                        : "N/A"}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Distance Row */}
                <TableRow>
                  <TableCell className="font-medium">Distance</TableCell>
                  <TableCell className="bg-primary/5">—</TableCell>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableCell key={i}>{comp.distanceKm.toFixed(1)} km</TableCell>
                  ))}
                </TableRow>

                {/* Adjustment Rows */}
                {cmaResult.comparables[0]?.adjustments.map((adj, adjIdx) => (
                  <TableRow key={adjIdx}>
                    <TableCell className="font-medium">{adj.label}</TableCell>
                    <TableCell className="bg-primary/5">{adj.subjectValue}</TableCell>
                    {cmaResult.comparables.map((comp, i) => {
                      const compAdj = comp.adjustments[adjIdx];
                      return (
                        <TableCell key={i}>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {compAdj?.compValue}
                            </span>
                            <span
                              className={`font-medium ${
                                compAdj?.adjustmentAmount > 0
                                  ? "text-green-600"
                                  : compAdj?.adjustmentAmount < 0
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {compAdj?.adjustmentAmount > 0 ? "+" : ""}
                              ${compAdj?.adjustmentAmount.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Total Adjustment Row */}
                <TableRow className="font-bold border-t-2">
                  <TableCell>Total Adjustment</TableCell>
                  <TableCell className="bg-primary/5">—</TableCell>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableCell
                      key={i}
                      className={
                        comp.totalAdjustment > 0
                          ? "text-green-600"
                          : comp.totalAdjustment < 0
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {comp.totalAdjustment > 0 ? "+" : ""}$
                      {comp.totalAdjustment.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Adjusted Price Row */}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Adjusted Price</TableCell>
                  <TableCell className="bg-primary/5">—</TableCell>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableCell key={i}>
                      ${comp.adjustedPrice.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Weight Row */}
                <TableRow>
                  <TableCell className="font-medium">Weight</TableCell>
                  <TableCell className="bg-primary/5">—</TableCell>
                  {cmaResult.comparables.map((comp, i) => (
                    <TableCell key={i}>
                      <Badge variant="outline">
                        {(comp.weight * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Search for Comps */}
      <Card>
        <CardHeader>
          <CardTitle>Find Comparables</CardTitle>
          <CardDescription>
            Search for sold properties to use as comparables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by address, area, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchComps()}
            />
            <Button onClick={searchComps} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {similarListings.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {similarListings.map((listing) => {
                const mlsNum = listing.mlsNumber as string;
                const isSelected = selectedComps.has(mlsNum);
                return (
                  <PropertyCard
                    key={mlsNum}
                    listing={listing}
                    selectable
                    selected={isSelected}
                    disabled={!isSelected && selectedComps.size >= MAX_COMPS}
                    onSelect={() => toggleComp(mlsNum)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
