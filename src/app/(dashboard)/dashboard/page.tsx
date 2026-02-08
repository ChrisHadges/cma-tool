"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  PlusCircle,
  FileText,
  TrendingUp,
  Trash2,
  Sparkles,
  ArrowRight,
  Bed,
  Bath,
  Ruler,
  MessageSquareText,
  ImageOff,
  Palette,
  Download,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface CmaReport {
  id: number;
  title: string;
  status: string;
  priceLow: string | null;
  priceMid: string | null;
  priceHigh: string | null;
  createdAt: string;
  updatedAt: string;
  subjectImage: string | null;
  subjectAddress: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  canvaDesignId: string | null;
  canvaDesignUrl: string | null;
  isPublished: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<CmaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [creatingCanva, setCreatingCanva] = useState<number | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/cma");
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch {
        // DB might not be set up yet
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleDelete = async (reportId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this CMA report? This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(reportId);
    try {
      const res = await fetch(`/api/cma/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {
      // Handle error
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateInCanva = async (reportId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCreatingCanva(reportId);
    try {
      // Check if Canva is connected
      const statusRes = await fetch("/api/canva/status");
      const statusData = await statusRes.json();

      if (!statusData.connected) {
        // Redirect to Canva auth, then come back to the export page for this report
        window.location.href = `/api/canva/auth?returnTo=/cma/${reportId}/export`;
        return;
      }

      // Create the design
      const res = await fetch("/api/canva/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.design?.editUrl) {
          // Update the report in local state
          setReports((prev) =>
            prev.map((r) =>
              r.id === reportId
                ? { ...r, canvaDesignId: data.design.id, canvaDesignUrl: data.design.editUrl }
                : r
            )
          );
          window.open(data.design.editUrl, "_blank");
        }
      } else if (res.status === 401) {
        // Token expired — re-auth
        window.location.href = `/api/canva/auth?returnTo=/cma/${reportId}/export`;
      } else {
        // Navigate to export page for more details
        router.push(`/cma/${reportId}/export`);
      }
    } catch {
      router.push(`/cma/${reportId}/export`);
    } finally {
      setCreatingCanva(null);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  const handleDownloadPdf = async (reportId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloadingPdf(reportId);
    try {
      // Step 1: Check Canva connection
      const statusRes = await fetch("/api/canva/status");
      const statusData = await statusRes.json();

      if (!statusData.connected) {
        window.location.href = `/api/canva/auth?returnTo=/dashboard`;
        return;
      }

      // Step 2: Generate Canva design
      const genRes = await fetch("/api/canva/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (!genRes.ok) {
        if (genRes.status === 401) {
          window.location.href = `/api/canva/auth?returnTo=/dashboard`;
          return;
        }
        throw new Error("Failed to generate design");
      }

      const genData = await genRes.json();
      const designId = genData.design?.id;
      if (!designId) throw new Error("No design ID");

      // Step 3: Export as PDF
      const exportRes = await fetch("/api/canva/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, format: { type: "pdf" } }),
      });

      if (!exportRes.ok) throw new Error("Export failed");

      const exportData = await exportRes.json();
      const downloadUrl = exportData.downloadUrl || exportData.downloadUrls?.[0];
      if (!downloadUrl) throw new Error("No download URL");

      // Step 4: Download
      const pdfRes = await fetch(downloadUrl);
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CMA-Report-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: try the basic PDF endpoint
      try {
        const res = await fetch(`/api/cma/${reportId}/pdf`, { method: "POST" });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `CMA-Report-${reportId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch {
        // Silently fail
      }
    } finally {
      setDownloadingPdf(null);
    }
  };

  const statusStyles: Record<string, string> = {
    draft: "bg-amber-100 text-amber-700 border-amber-200",
    in_progress: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    archived: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    in_progress: "Published",
    completed: "Completed",
    archived: "Archived",
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl canva-gradient p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-white/80 mt-1 text-lg">
            Manage your Comparative Market Analyses
          </p>
          <div className="flex gap-3 mt-5">
            <Link href="/cma/new">
              <Button
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New CMA
              </Button>
            </Link>
            <Link href="/cma/ai">
              <Button
                variant="secondary"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
              >
                <MessageSquareText className="mr-2 h-4 w-4" />
                AI CMA Builder
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-3xl font-bold">
                  {reports.filter((r) => !r.isPublished).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-3xl font-bold">
                  {reports.filter((r) => r.isPublished).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Reports</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl canva-gradient mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No CMA reports yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first Comparative Market Analysis to get started.
                Choose manual wizard or let AI build it for you.
              </p>
              <div className="flex gap-3">
                <Link href="/cma/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create CMA
                  </Button>
                </Link>
                <Link href="/cma/ai">
                  <Button variant="outline">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    AI Builder
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <Link key={report.id} href={`/cma/${report.id}`} className="group">
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 h-full">
                  <div className="flex h-full">
                    {/* Property Image */}
                    <div className="relative w-36 min-h-[140px] shrink-0 bg-muted">
                      {report.subjectImage ? (
                        <img
                          src={report.subjectImage}
                          alt="Property"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                              statusStyles[report.status] ||
                              "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {statusLabels[report.status] || report.status.replace("_", " ")}
                          </span>
                        </div>

                        {report.subjectAddress && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {report.subjectAddress}
                          </p>
                        )}

                        {/* Quick Stats */}
                        <div className="flex gap-3 mt-2">
                          {report.beds != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Bed className="h-3 w-3" />
                              {report.beds}
                            </span>
                          )}
                          {report.baths != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Bath className="h-3 w-3" />
                              {report.baths}
                            </span>
                          )}
                          {report.sqft != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Ruler className="h-3 w-3" />
                              {Number(report.sqft).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {report.priceMid && (
                            <span className="text-sm font-bold text-primary">
                              ${Number(report.priceMid).toLocaleString()}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(report.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* PDF Download */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDownloadPdf(report.id, e)}
                            disabled={downloadingPdf === report.id}
                            title="Download PDF"
                          >
                            {downloadingPdf === report.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          {/* Create in Canva */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleCreateInCanva(report.id, e)}
                            disabled={creatingCanva === report.id}
                            title={report.canvaDesignUrl ? "Open in Canva" : "Create in Canva"}
                          >
                            {creatingCanva === report.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Palette className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(report.id, e)}
                            disabled={deleting === report.id}
                            title="Delete report"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
