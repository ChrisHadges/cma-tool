"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  BarChart3,
  Download,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Palette,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { CanvaTemplatePicker } from "@/components/canva-template-picker";

interface CmaReport {
  id: number;
  title: string;
  status: string;
  priceLow: string | null;
  priceMid: string | null;
  priceHigh: string | null;
  subjectProperty: Record<string, unknown> | null;
  comparables: Record<string, unknown>[];
  marketSnapshots: Record<string, unknown>[];
  canvaDesignId: string | null;
  canvaDesignUrl: string | null;
  isPublished: boolean;
  publicToken: string | null;
}

export default function CmaReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<CmaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCanva, setCreatingCanva] = useState(false);
  const [canvaSuccess, setCanvaSuccess] = useState(false);
  const [publishingWebsite, setPublishingWebsite] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

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

  const handleCreateInCanva = async () => {
    // If already has a Canva design, open it
    if (report?.canvaDesignUrl) {
      window.open(report.canvaDesignUrl, "_blank");
      return;
    }

    // Check Canva connection first
    try {
      const statusRes = await fetch("/api/canva/status");
      const statusData = await statusRes.json();

      if (!statusData.connected) {
        window.location.href = `/api/canva/auth?returnTo=/cma/${reportId}`;
        return;
      }

      // Connected — open template picker
      setShowTemplatePicker(true);
    } catch {
      // If status check fails, try auth anyway
      window.location.href = `/api/canva/auth?returnTo=/cma/${reportId}`;
    }
  };

  const handleCanvaDesignCreated = (design: { id: string; editUrl: string; title: string }) => {
    setReport((prev) =>
      prev
        ? { ...prev, canvaDesignId: design.id, canvaDesignUrl: design.editUrl }
        : prev
    );
    setCanvaSuccess(true);
    setTimeout(() => setCanvaSuccess(false), 5000);
  };

  const handleCreateWebsite = async () => {
    // If already published, just show URL
    if (report?.isPublished && report?.publicToken) {
      const baseUrl = window.location.origin;
      setWebsiteUrl(`${baseUrl}/site/${report.publicToken}`);
      return;
    }

    setPublishingWebsite(true);
    try {
      const res = await fetch(`/api/cma/${reportId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setWebsiteUrl(data.siteUrl);
        setReport((prev) =>
          prev
            ? { ...prev, isPublished: true, publicToken: data.token }
            : prev
        );
      }
    } catch {
      // Silently fail
    } finally {
      setPublishingWebsite(false);
    }
  };

  const handleCopyUrl = () => {
    if (websiteUrl) {
      navigator.clipboard.writeText(websiteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading report...</div>;
  }

  if (!report) {
    return <div className="text-center py-12 text-muted-foreground">Report not found</div>;
  }

  const subject = report.subjectProperty;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
          <p className="text-muted-foreground mt-1">
            {subject
              ? `${subject.streetAddress}, ${subject.city}, ${subject.state}`
              : "No subject property"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={
              report.status === "completed"
                ? "default"
                : report.status === "in_progress"
                ? "default"
                : "secondary"
            }
          >
            {report.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      {report.priceMid && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Suggested Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(report.priceMid).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Price Range</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                ${Number(report.priceLow).toLocaleString()} -{" "}
                ${Number(report.priceHigh).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comparables</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.comparables.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">List Price</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subject?.listPrice
                  ? `$${Number(subject.listPrice).toLocaleString()}`
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href={`/cma/${reportId}/subject`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Home className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Subject Property</CardTitle>
              <CardDescription>View and edit subject property details</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/cma/${reportId}/comps`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Comparables</CardTitle>
              <CardDescription>
                {report.comparables.length} comps selected — view adjustments
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/cma/${reportId}/neighborhood`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Neighborhood</CardTitle>
              <CardDescription>Schools, walk scores, crime data &amp; demographics</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/cma/${reportId}/market`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Market Trends</CardTitle>
              <CardDescription>Price history, DOM, and inventory charts</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/cma/${reportId}/export`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Download className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Export</CardTitle>
              <CardDescription>Advanced export options &amp; Canva templates</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* ─── Export Actions ─────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Create in Canva */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 canva-gradient" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl canva-gradient shrink-0">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">
                    {report.canvaDesignUrl ? "Open in Canva" : "Create in Canva"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {report.canvaDesignUrl
                      ? "Edit your CMA presentation in Canva"
                      : "Editable presentation with all CMA data"}
                  </p>
                </div>
                <Button
                  onClick={handleCreateInCanva}
                  disabled={creatingCanva}
                  size="sm"
                  className="rounded-xl shrink-0 canva-gradient border-0 text-white hover:opacity-90"
                >
                  {creatingCanva ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : canvaSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : report.canvaDesignUrl ? (
                    <>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Create CMA Website */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shrink-0">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">
                    {websiteUrl || report.isPublished
                      ? "CMA Website"
                      : "Create Website"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {websiteUrl
                      ? "Shareable link ready"
                      : "Beautiful shareable property website"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {websiteUrl && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-8 px-2"
                        onClick={handleCopyUrl}
                      >
                        {copiedUrl ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white hover:opacity-90"
                        onClick={() => window.open(websiteUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </>
                  )}
                  {!websiteUrl && (
                    <Button
                      onClick={handleCreateWebsite}
                      disabled={publishingWebsite}
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white hover:opacity-90"
                    >
                      {publishingWebsite ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Canva Template Picker Modal */}
      <CanvaTemplatePicker
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        reportId={reportId}
        onDesignCreated={handleCanvaDesignCreated}
      />
    </div>
  );
}
