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
import {
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  Car,
  Home,
  Thermometer,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function SubjectPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/cma/${reportId}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const subject = report?.subjectProperty as Record<string, unknown> | null;
  if (!subject) {
    return <div className="text-center py-12 text-muted-foreground">No subject property</div>;
  }

  const images = (subject.images as string[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/cma/${reportId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Report
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Subject Property</h1>
        <p className="text-muted-foreground mt-1">
          {String(subject.streetAddress)}, {String(subject.city)},{" "}
          {String(subject.state)}
        </p>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
          {images.slice(0, 8).map((img, i) => (
            <div key={i} className={`rounded-lg overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
              <img src={img} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <DetailItem icon={MapPin} label="Address" value={`${String(subject.streetAddress || "")}, ${String(subject.city || "")}, ${String(subject.state || "")} ${String(subject.zip || "")}`} />
              <DetailItem icon={Home} label="Property Type" value={String(subject.propertyType || "N/A")} />
              <DetailItem icon={Bed} label="Bedrooms" value={`${subject.bedrooms || 0}${subject.bedroomsPlus ? `+${String(subject.bedroomsPlus)}` : ""}`} />
              <DetailItem icon={Bath} label="Bathrooms" value={`${subject.bathrooms || 0}${subject.bathroomsHalf ? ` + ${String(subject.bathroomsHalf)} half` : ""}`} />
              <DetailItem icon={Ruler} label="Square Feet" value={subject.sqft ? `${Number(subject.sqft).toLocaleString()} sqft` : "N/A"} />
              <DetailItem icon={Calendar} label="Year Built" value={subject.yearBuilt ? String(subject.yearBuilt) : "N/A"} />
              <DetailItem icon={Car} label="Garage" value={`${String(subject.garage || "N/A")} (${subject.garageSpaces || 0} spaces)`} />
              <DetailItem icon={Home} label="Basement" value={String(subject.basement || "N/A")} />
              <DetailItem icon={Thermometer} label="Heating" value={String(subject.heating || "N/A")} />
              <DetailItem icon={Thermometer} label="Cooling" value={String(subject.cooling || "N/A")} />
              <DetailItem icon={Home} label="Lot Size" value={subject.lotSqft ? `${Number(subject.lotSqft).toLocaleString()} sqft` : "N/A"} />
              <DetailItem icon={Home} label="Pool" value={String(subject.pool || "None")} />
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <DetailItem
                icon={DollarSign}
                label="List Price"
                value={subject.listPrice ? `$${Number(subject.listPrice).toLocaleString()}` : "N/A"}
              />
              <DetailItem
                icon={DollarSign}
                label="Annual Taxes"
                value={subject.taxesAnnual ? `$${Number(subject.taxesAnnual).toLocaleString()}` : "N/A"}
              />
              <DetailItem
                icon={Calendar}
                label="Days on Market"
                value={subject.daysOnMarket ? String(subject.daysOnMarket) : "N/A"}
              />
              {subject.mlsNumber ? (
                <DetailItem icon={Home} label="MLS#" value={String(subject.mlsNumber)} />
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {subject.description ? (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {String(subject.description)}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "N/A"}</p>
      </div>
    </div>
  );
}
