"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  Footprints,
  Bus,
  Bike,
  Shield,
  MapPin,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface SchoolInfo {
  name: string;
  type: string;
  rating?: number;
  distance?: string;
}

interface NeighborhoodData {
  schools: SchoolInfo[];
  avgSchoolRating: number | null;
  walkScore: number | null;
  walkScoreDescription: string | null;
  transitScore: number | null;
  transitScoreDescription: string | null;
  bikeScore: number | null;
  bikeScoreDescription: string | null;
  crimeIndex: number | null;
  crimeDescription: string | null;
  nearbyAmenities: string[];
  medianHouseholdIncome: number | null;
  population: number | null;
  medianAge: number | null;
  dataSource: string;
  fetchedAt: string;
}

function ScoreGauge({
  score,
  label,
  description,
  icon: Icon,
}: {
  score: number;
  label: string;
  description: string | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const color =
    score >= 80
      ? "text-green-600 bg-green-50 border-green-200"
      : score >= 50
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-red-600 bg-red-50 border-red-200";

  return (
    <Card className={`border-2 ${color.split(" ")[2]}`}>
      <CardContent className="pt-6 text-center">
        <Icon className={`h-8 w-8 mx-auto mb-2 ${color.split(" ")[0]}`} />
        <div
          className={`text-4xl font-bold ${color.split(" ")[0]}`}
        >
          {score}
        </div>
        <div className="text-sm font-medium mt-1">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function NeighborhoodPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectAddress, setSubjectAddress] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        // First get the report to find subject property coordinates
        const reportRes = await fetch(`/api/cma/${reportId}`);
        if (!reportRes.ok) {
          setError("Failed to load report");
          return;
        }
        const report = await reportRes.json();
        const subject = report.subjectProperty;
        if (!subject) {
          setError("No subject property found");
          return;
        }

        setSubjectAddress(
          `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`
        );

        if (!subject.latitude || !subject.longitude) {
          setError(
            "Subject property is missing location coordinates. Neighborhood data requires lat/lng."
          );
          return;
        }

        // Fetch neighborhood data
        const neighborhoodRes = await fetch(
          `/api/neighborhood?lat=${subject.latitude}&lng=${subject.longitude}&zip=${
            subject.zip || ""
          }`
        );

        if (!neighborhoodRes.ok) {
          setError("Failed to fetch neighborhood data");
          return;
        }

        const neighborhoodData = await neighborhoodRes.json();
        setData(neighborhoodData);
      } catch {
        setError("Failed to load neighborhood data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">
          Loading neighborhood data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No neighborhood data available
      </div>
    );
  }

  const hasScores =
    data.walkScore != null ||
    data.transitScore != null ||
    data.bikeScore != null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/cma/${reportId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Report
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Neighborhood Overview
        </h1>
        <p className="text-muted-foreground mt-1">{subjectAddress}</p>
      </div>

      {/* Livability Scores */}
      {hasScores && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Livability Scores</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {data.walkScore != null && (
              <ScoreGauge
                score={data.walkScore}
                label="Walk Score"
                description={data.walkScoreDescription}
                icon={Footprints}
              />
            )}
            {data.transitScore != null && (
              <ScoreGauge
                score={data.transitScore}
                label="Transit Score"
                description={data.transitScoreDescription}
                icon={Bus}
              />
            )}
            {data.bikeScore != null && (
              <ScoreGauge
                score={data.bikeScore}
                label="Bike Score"
                description={data.bikeScoreDescription}
                icon={Bike}
              />
            )}
          </div>
        </div>
      )}

      {/* Crime / Safety */}
      {data.crimeIndex != null && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`flex items-center gap-4 p-4 rounded-lg ${
                data.crimeIndex <= 100
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div>
                <div
                  className={`text-2xl font-bold ${
                    data.crimeIndex <= 100
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {data.crimeIndex}
                </div>
                <div className="text-sm text-muted-foreground">
                  Crime Index
                </div>
              </div>
              <div>
                <div
                  className={`font-medium ${
                    data.crimeIndex <= 100
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {data.crimeDescription}
                </div>
                <div className="text-sm text-muted-foreground">
                  National Average = 100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schools */}
      {data.schools.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle>Nearby Schools</CardTitle>
              </div>
              {data.avgSchoolRating && (
                <Badge variant="secondary">
                  Avg Rating: {data.avgSchoolRating}/10
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.schools.map((school, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-sm">
                        {school.name}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs mt-1 capitalize"
                      >
                        {school.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {school.distance && (
                      <span className="text-muted-foreground">
                        {school.distance}
                      </span>
                    )}
                    {school.rating ? (
                      <Badge
                        variant={
                          school.rating >= 7
                            ? "default"
                            : school.rating >= 4
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {school.rating}/10
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demographics */}
      {(data.medianHouseholdIncome ||
        data.population ||
        data.medianAge) && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Demographics</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {data.medianHouseholdIncome && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Median Income
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    $
                    {Number(
                      data.medianHouseholdIncome
                    ).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.population && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Population
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Number(data.population).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.medianAge && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Median Age
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.medianAge}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Nearby Amenities */}
      {data.nearbyAmenities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Nearby Amenities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.nearbyAmenities.map((amenity, idx) => (
                <Badge key={idx} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Source */}
      <div className="text-xs text-muted-foreground text-center">
        Data sourced from {data.dataSource} — Last updated{" "}
        {new Date(data.fetchedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
