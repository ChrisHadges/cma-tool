"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Palette,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";

// Only show this specific brand template
const ALLOWED_TEMPLATE_NAME = "Brix&Hart - CMA";

interface BrandTemplate {
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  createUrl: string;
}

interface CreatedDesign {
  id: string;
  editUrl: string;
  title: string;
}

interface CanvaTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: number | string;
  onDesignCreated?: (design: CreatedDesign) => void;
}

export function CanvaTemplatePicker({
  open,
  onOpenChange,
  reportId,
  onDesignCreated,
}: CanvaTemplatePickerProps) {
  const [template, setTemplate] = useState<BrandTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDesign, setCreatedDesign] = useState<CreatedDesign | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Fetch templates when dialog opens
  useEffect(() => {
    if (!open) return;

    // Reset state when opening (but preserve createdDesign if re-opening)
    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      setTemplate(null);
      try {
        const res = await fetch("/api/canva/templates?dataset=non_empty");
        if (res.ok) {
          const data = await res.json();
          const items: BrandTemplate[] = data.items || [];
          // Find the specific brand template
          const match = items.find((t) => t.title === ALLOWED_TEMPLATE_NAME);
          if (match) {
            setTemplate(match);
          } else {
            setError(
              `Could not find the "${ALLOWED_TEMPLATE_NAME}" brand template. Make sure it exists in your Canva account with autofill data fields.`
            );
          }
        } else if (res.status === 401) {
          setError("Not connected to Canva. Please connect your account first.");
        } else {
          setError("Failed to load templates.");
        }
      } catch {
        setError("Failed to connect to Canva.");
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we haven't already created a design
    if (!createdDesign) {
      fetchTemplates();
    }
  }, [open, createdDesign]);

  // Reset everything when dialog closes
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset all state when closing
      setCreatedDesign(null);
      setPdfDownloaded(false);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (!template) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/canva/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: typeof reportId === "string" ? parseInt(reportId) : reportId,
          templateId: template.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.design?.editUrl) {
          const design: CreatedDesign = {
            id: data.design.id,
            editUrl: data.design.editUrl,
            title: data.design.title,
          };
          setCreatedDesign(design);
          onDesignCreated?.(design);
        } else {
          setError("Design was created but no edit URL was returned.");
        }
      } else if (res.status === 401) {
        setError("Canva session expired. Please reconnect your account.");
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to generate design.");
      }
    } catch {
      setError("Failed to generate design. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!createdDesign) return;

    setDownloadingPdf(true);
    setError(null);

    try {
      const res = await fetch("/api/canva/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: createdDesign.id,
          format: { type: "pdf" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          // Open the download URL in a new tab to trigger download
          window.open(data.downloadUrl, "_blank");
          setPdfDownloaded(true);
          setTimeout(() => setPdfDownloaded(false), 3000);
        } else {
          setError("Export completed but no download URL was returned.");
        }
      } else if (res.status === 401) {
        setError("Canva session expired. Please reconnect your account.");
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to export PDF.");
      }
    } catch {
      setError("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleEditInCanva = () => {
    if (createdDesign?.editUrl) {
      window.open(createdDesign.editUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg canva-gradient">
              <Palette className="h-4 w-4 text-white" />
            </div>
            {createdDesign ? "Design Created!" : "Create in Canva"}
          </DialogTitle>
          <DialogDescription>
            {createdDesign
              ? "Your CMA presentation is ready. Download a PDF or edit it in Canva."
              : "Auto-fill your CMA data, photos, and pricing into your brand template."}
          </DialogDescription>
        </DialogHeader>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading brand template...</p>
          </div>
        )}

        {/* ─── Pre-generate: Template Preview ─────────────────────── */}
        {!loading && template && !createdDesign && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-purple-500 ring-2 ring-purple-500/20 overflow-hidden shadow-md">
              {/* Scrollable thumbnail */}
              <div className="bg-muted overflow-y-auto relative max-h-64">
                <img
                  src={template.thumbnail.url}
                  alt={template.title}
                  className="w-full h-auto"
                />
                <div className="absolute top-2 right-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full canva-gradient shadow-lg">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-semibold text-sm">{template.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your CMA data will be auto-filled into this template
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-xl canva-gradient border-0 text-white hover:opacity-90"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Design...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Design
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Generating State ───────────────────────────────────── */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl canva-gradient flex items-center justify-center">
                <Palette className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium">Creating your CMA presentation...</p>
            <p className="text-xs text-muted-foreground">
              Mapping data, uploading photos, and auto-filling your template
            </p>
          </div>
        )}

        {/* ─── Post-generate: Success with Actions ────────────────── */}
        {createdDesign && (
          <div className="space-y-4">
            {/* Success indicator */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-green-800 dark:text-green-200">
                  Design created successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  {createdDesign.title}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid gap-3">
              {/* Download PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-muted hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Download PDF</p>
                  <p className="text-xs text-muted-foreground">
                    Save a client-ready PDF of your CMA presentation
                  </p>
                </div>
                <div className="shrink-0">
                  {downloadingPdf ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : pdfDownloaded ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </button>

              {/* Edit in Canva */}
              <button
                onClick={handleEditInCanva}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-muted hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all text-left group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl canva-gradient shrink-0">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Edit in Canva</p>
                  <p className="text-xs text-muted-foreground">
                    Customize fonts, colors, and layout in Canva editor
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 transition-colors shrink-0" />
              </button>
            </div>

            {/* Done button */}
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
