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
import { Loader2, Palette, CheckCircle2, AlertCircle } from "lucide-react";

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

interface CanvaTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: number | string;
  onDesignCreated?: (design: {
    id: string;
    editUrl: string;
    title: string;
  }) => void;
}

export function CanvaTemplatePicker({
  open,
  onOpenChange,
  reportId,
  onDesignCreated,
}: CanvaTemplatePickerProps) {
  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates when dialog opens
  useEffect(() => {
    if (!open) return;

    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/canva/templates?dataset=non_empty");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.items || []);
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

    fetchTemplates();
  }, [open]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/canva/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: typeof reportId === "string" ? parseInt(reportId) : reportId,
          templateId: selectedTemplate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.design?.editUrl) {
          onDesignCreated?.({
            id: data.design.id,
            editUrl: data.design.editUrl,
            title: data.design.title,
          });
          window.open(data.design.editUrl, "_blank");
          onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg canva-gradient">
              <Palette className="h-4 w-4 text-white" />
            </div>
            Choose a Brand Template
          </DialogTitle>
          <DialogDescription>
            Select a Canva Brand Template to auto-fill with your CMA data, photos, and pricing.
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
            <p className="text-sm text-muted-foreground">Loading your Brand Templates...</p>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`relative text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md group ${
                  selectedTemplate === template.id
                    ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                    : "border-border hover:border-purple-300"
                }`}
              >
                {/* Selected indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full canva-gradient">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={template.thumbnail.url}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Title */}
                <div className="p-2.5">
                  <p className="text-xs font-medium truncate">{template.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Palette className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-sm">No Brand Templates Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a Brand Template with autofill data fields in Canva, then come back here to use it.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {!loading && templates.length > 0 && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplate || generating}
              className="rounded-xl canva-gradient border-0 text-white hover:opacity-90"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Design...
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  Create Design
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
