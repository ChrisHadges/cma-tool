"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  ExternalLink,
  Loader2,
  Palette,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  ArrowLeft,
  Link2,
  Unlink,
  Image as ImageIcon,
  Layers,
  PenTool,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────

interface CanvaConnection {
  connected: boolean;
  user?: { displayName: string };
  reason?: string;
}

interface CanvaDesignResult {
  success: boolean;
  design: {
    id: string;
    title: string;
    editUrl: string;
    viewUrl: string;
  };
  assets: Array<{ id: string; name: string }>;
  mcpPrompt: string;
  cmaData: {
    reportTitle: string;
    subjectProperty: {
      address: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      sqft: number;
      listPrice: string;
      images: string[];
    };
    pricing: {
      suggestedPrice: string;
      priceLow: string;
      priceHigh: string;
    };
    comparables: Array<{
      number: number;
      fullAddress: string;
      soldPrice: string;
      adjustedPrice: string;
      bedrooms: number;
      bathrooms: number;
      sqft: number;
    }>;
  };
}

// ─── Progress Steps ───────────────────────────────────────────────

type StepStatus = "pending" | "active" | "complete" | "error";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: "connect", label: "Connect Canva", icon: <Link2 className="h-4 w-4" /> },
  { id: "create", label: "Create Design", icon: <Palette className="h-4 w-4" /> },
  { id: "upload", label: "Upload Images", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "populate", label: "Add CMA Data", icon: <Layers className="h-4 w-4" /> },
  { id: "edit", label: "Edit in Canva", icon: <PenTool className="h-4 w-4" /> },
];

// ─── Component ────────────────────────────────────────────────────

export default function ExportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  // Report state
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // PDF state
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Canva state
  const [canvaConnection, setCanvaConnection] = useState<CanvaConnection | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [generatingDesign, setGeneratingDesign] = useState(false);
  const [designResult, setDesignResult] = useState<CanvaDesignResult | null>(null);
  const [canvaError, setCanvaError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    connect: "pending",
    create: "pending",
    upload: "pending",
    populate: "pending",
    edit: "pending",
  });

  // ─── Data Fetching ──────────────────────────────────────────────

  const checkCanvaConnection = useCallback(async () => {
    setCheckingConnection(true);
    try {
      const res = await fetch("/api/canva/status");
      if (res.ok) {
        const data = await res.json();
        setCanvaConnection(data);
        if (data.connected) {
          setStepStatuses((prev) => ({ ...prev, connect: "complete" }));
        }
      }
    } catch {
      setCanvaConnection({ connected: false });
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/cma/${reportId}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);

          // If report already has a Canva design, show it
          if (data.canvaDesignUrl) {
            setDesignResult({
              success: true,
              design: {
                id: data.canvaDesignId || "",
                title: data.title || "CMA Report",
                editUrl: data.canvaDesignUrl,
                viewUrl: data.canvaDesignUrl,
              },
              assets: [],
              mcpPrompt: "",
              cmaData: {} as CanvaDesignResult["cmaData"],
            });
            setStepStatuses({
              connect: "complete",
              create: "complete",
              upload: "complete",
              populate: "complete",
              edit: "complete",
            });
          }
        }
      } catch {
        // Report fetch error
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
    checkCanvaConnection();
  }, [reportId, checkCanvaConnection]);

  // ─── Actions ────────────────────────────────────────────────────

  const connectToCanva = () => {
    // Navigate to auth endpoint with returnTo so user comes back here after auth.
    // The PKCE code_verifier is encoded in the state param (no cookies needed).
    window.location.href = `/api/canva/auth?returnTo=/cma/${reportId}/export`;
  };

  const generatePdf = async () => {
    setGeneratingPdf(true);
    setPdfError(null);
    setPdfSuccess(false);
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
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 5000);
      } else {
        const data = await res.json().catch(() => ({}));
        setPdfError(data.error || "Failed to generate PDF.");
      }
    } catch {
      setPdfError("Network error while generating PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const createCmaInCanva = async () => {
    setGeneratingDesign(true);
    setCanvaError(null);
    setDesignResult(null);

    // Step: Creating design
    setStepStatuses((prev) => ({
      ...prev,
      create: "active",
      upload: "pending",
      populate: "pending",
      edit: "pending",
    }));

    try {
      const res = await fetch("/api/canva/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: parseInt(reportId) }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setCanvaConnection({ connected: false });
          setStepStatuses((prev) => ({ ...prev, connect: "error", create: "pending" }));
          setCanvaError("Canva session expired. Please reconnect your account.");
        } else {
          setStepStatuses((prev) => ({ ...prev, create: "error" }));
          setCanvaError(errorData.error || "Failed to create Canva design.");
        }
        setGeneratingDesign(false);
        return;
      }

      const data: CanvaDesignResult = await res.json();
      setDesignResult(data);

      // Update steps based on result
      setStepStatuses({
        connect: "complete",
        create: "complete",
        upload: data.assets.length > 0 ? "complete" : "complete",
        populate: "complete",
        edit: "complete",
      });
    } catch {
      setCanvaError("Network error creating Canva design.");
      setStepStatuses((prev) => ({ ...prev, create: "error" }));
    } finally {
      setGeneratingDesign(false);
    }
  };

  const copyMcpPrompt = async () => {
    if (!designResult?.mcpPrompt) return;
    try {
      await navigator.clipboard.writeText(designResult.mcpPrompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = designResult.mcpPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // ─── Render Helpers ─────────────────────────────────────────────

  const isConnected = canvaConnection?.connected === true;

  const renderStepIndicator = (stepId: string, index: number) => {
    const status = stepStatuses[stepId];
    const step = STEPS[index];
    const isActive = status === "active";
    const isComplete = status === "complete";
    const isError = status === "error";

    return (
      <div key={stepId} className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all
            ${isComplete ? "canva-gradient text-white" : ""}
            ${isActive ? "canva-gradient text-white animate-pulse" : ""}
            ${isError ? "bg-red-500 text-white" : ""}
            ${status === "pending" ? "bg-muted text-muted-foreground" : ""}
          `}
        >
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            step.icon
          )}
        </div>
        <span
          className={`text-sm transition-colors
            ${isComplete ? "text-foreground font-medium" : ""}
            ${isActive ? "text-foreground font-medium" : ""}
            ${isError ? "text-red-600 font-medium" : ""}
            ${status === "pending" ? "text-muted-foreground" : ""}
          `}
        >
          {step.label}
          {isActive && generatingDesign && "..."}
        </span>
      </div>
    );
  };

  // ─── Loading State ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/cma/${reportId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Report
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Export Report</h1>
        <p className="text-muted-foreground mt-1">
          Download as PDF or create an editable Canva design with all your CMA data
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── PDF Export Card ──────────────────────────────────── */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>PDF Report</CardTitle>
                <CardDescription>Generate a client-ready PDF document</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Creates a professional PDF with property photos, comparable analysis,
              adjustment table, neighborhood data, and price recommendation.
            </p>
            {pdfError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">{pdfError}</p>
              </div>
            )}
            {pdfSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">PDF downloaded!</span>
              </div>
            )}
            <Button
              onClick={generatePdf}
              disabled={generatingPdf}
              className="w-full rounded-xl"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Canva Design Card ───────────────────────────────── */}
        <Card className="border-0 shadow-md overflow-hidden">
          {/* Gradient header bar */}
          <div className="h-1.5 canva-gradient" />

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl canva-gradient">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle>Canva Design</CardTitle>
                <CardDescription>
                  Create an editable CMA presentation in Canva
                </CardDescription>
              </div>
              {/* Connection badge */}
              {!checkingConnection && (
                <Badge
                  variant={isConnected ? "default" : "outline"}
                  className={`shrink-0 ${isConnected ? "canva-gradient border-0 text-white" : ""}`}
                >
                  {isConnected ? (
                    <>
                      <Link2 className="h-3 w-3 mr-1" />
                      {canvaConnection?.user?.displayName || "Connected"}
                    </>
                  ) : (
                    <>
                      <Unlink className="h-3 w-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Error display */}
            {canvaError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Error</p>
                  <p className="text-xs mt-0.5">{canvaError}</p>
                </div>
              </div>
            )}

            {/* ── Not Connected State ────────────────────────── */}
            {!isConnected && !checkingConnection && (
              <div className="space-y-4">
                <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium">
                    Connect your Canva account to create professional CMA presentations
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      Editable Canva presentation with all your CMA data
                    </li>
                    <li className="flex items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      Property images automatically uploaded
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                      Apply your Brand Kit styles and colors
                    </li>
                    <li className="flex items-center gap-2">
                      <PenTool className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      Edit, customize, and share directly from Canva
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={connectToCanva}
                  className="w-full rounded-xl canva-gradient border-0 text-white hover:opacity-90 h-12 text-base"
                >
                  <Link2 className="mr-2 h-5 w-5" />
                  Connect Canva Account
                </Button>
              </div>
            )}

            {/* Loading connection */}
            {checkingConnection && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">
                  Checking Canva connection...
                </span>
              </div>
            )}

            {/* ── Connected State ────────────────────────────── */}
            {isConnected && !checkingConnection && (
              <div className="space-y-5">
                {/* Progress Steps */}
                <div className="bg-muted/30 border rounded-xl p-4">
                  <div className="space-y-3">
                    {STEPS.map((step, idx) => renderStepIndicator(step.id, idx))}
                  </div>
                </div>

                {/* ── Design Not Created Yet ──────────────────── */}
                {!designResult && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This will create a Canva presentation with all your CMA data:
                      subject property, comparables, adjustments, pricing, and
                      neighborhood data. Property images will be uploaded to your
                      Canva account automatically.
                    </p>
                    <Button
                      onClick={createCmaInCanva}
                      disabled={generatingDesign}
                      className="w-full rounded-xl canva-gradient border-0 text-white hover:opacity-90 h-12 text-base font-semibold"
                    >
                      {generatingDesign ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating CMA in Canva...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Create CMA in Canva
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* ── Design Created Successfully ────────────── */}
                {designResult?.success && (
                  <div className="space-y-4">
                    {/* Success Banner */}
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          CMA Design Created!
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mb-3">
                        Your CMA presentation &quot;{designResult.design.title}&quot; is ready in
                        Canva. Property images have been uploaded and all CMA data
                        is available.
                      </p>
                      <Button
                        onClick={() =>
                          window.open(designResult.design.editUrl, "_blank")
                        }
                        className="w-full rounded-xl canva-gradient border-0 text-white hover:opacity-90 h-11 font-semibold"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open & Edit in Canva
                      </Button>
                    </div>

                    {/* Design details */}
                    {designResult.cmaData?.subjectProperty && (
                      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Data included in design
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {designResult.cmaData.subjectProperty.address}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {designResult.cmaData.subjectProperty.bedrooms} bed /{" "}
                            {designResult.cmaData.subjectProperty.bathrooms} bath
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {designResult.cmaData.subjectProperty.sqft.toLocaleString()} sqft
                          </Badge>
                          <Badge variant="default" className="text-[10px]">
                            {designResult.cmaData.pricing.suggestedPrice}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {designResult.cmaData.comparables.length} comps
                          </Badge>
                          {designResult.assets.length > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              {designResult.assets.length} photos uploaded
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* MCP Prompt for Claude-assisted editing */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">
                          Enhance with Claude AI
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Optional
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Copy the CMA data prompt below and paste it into Claude
                        with the Canva MCP to automatically populate your
                        presentation slides with formatted content.
                      </p>
                      <Button
                        onClick={copyMcpPrompt}
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl"
                      >
                        {copiedPrompt ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                            Copied to Clipboard!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy CMA Prompt for Claude
                          </>
                        )}
                      </Button>
                    </div>

                    <Separator />

                    {/* Regenerate */}
                    <Button
                      onClick={createCmaInCanva}
                      disabled={generatingDesign}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      {generatingDesign ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Palette className="mr-2 h-4 w-4" />
                          Create New Design
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
