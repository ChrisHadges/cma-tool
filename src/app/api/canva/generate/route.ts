import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cmaReports,
  subjectProperties,
  comparableProperties,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  searchBrandTemplates,
  getTemplateDataset,
  autofillDesign,
  uploadAssetFromUrl,
} from "@/lib/services/canva/client";
import { mapCmaToAutofillData } from "@/lib/services/canva/autofill";
import { runCmaAnalysis } from "@/lib/services/cma/engine";
import type { PropertyData } from "@/lib/services/cma/types";

/**
 * POST /api/canva/generate
 *
 * Creates a Canva design using a Brand Template + Autofill API.
 *
 * Flow:
 * 1. Fetch all CMA data (subject, comps, adjustments, neighborhood)
 * 2. Search for a brand template (or use a specific template ID)
 * 3. Get the template's dataset schema
 * 4. Map CMA data to template fields
 * 5. Upload property images as Canva assets
 * 6. Create the autofilled design
 * 7. Return the design edit URL
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("canva_access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Canva. Please connect your Canva account first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId, templateId: requestedTemplateId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    // ── Fetch all CMA data ──────────────────────────────────────

    const [report] = await db
      .select()
      .from(cmaReports)
      .where(eq(cmaReports.id, reportId));

    if (!report || !report.subjectPropertyId) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const [subject] = await db
      .select()
      .from(subjectProperties)
      .where(eq(subjectProperties.id, report.subjectPropertyId));

    if (!subject) {
      return NextResponse.json(
        { error: "Subject property not found" },
        { status: 404 }
      );
    }

    // Fetch comparables
    const comps = await db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.cmaReportId, reportId));

    // ── Find or use template ────────────────────────────────────

    let templateId = requestedTemplateId;

    if (!templateId) {
      // Search for brand templates with autofill data
      try {
        const templates = await searchBrandTemplates(accessToken, {
          dataset: "non_empty",
        });
        if (templates.items && templates.items.length > 0) {
          // Use the first available template
          templateId = templates.items[0].id;
          console.log(`Using brand template: ${templates.items[0].title} (${templateId})`);
        }
      } catch (err) {
        console.error("Failed to search brand templates:", err);
      }
    }

    // If no template found, fall back to creating a blank design
    if (!templateId) {
      return await createBlankDesign(accessToken, report, subject, reportId);
    }

    // ── Get template dataset & map CMA data ─────────────────────

    const dataset = await getTemplateDataset(accessToken, templateId);

    // Build CMA result for the autofill mapper
    const subjectData: PropertyData = {
      streetAddress: subject.streetAddress,
      city: subject.city,
      state: subject.state,
      zip: subject.zip,
      latitude: subject.latitude ? Number(subject.latitude) : undefined,
      longitude: subject.longitude ? Number(subject.longitude) : undefined,
      propertyType: subject.propertyType || undefined,
      bedrooms: subject.bedrooms || undefined,
      bathrooms: subject.bathrooms || undefined,
      sqft: subject.sqft || undefined,
      lotSqft: subject.lotSqft || undefined,
      yearBuilt: subject.yearBuilt || undefined,
      garageSpaces: subject.garageSpaces || undefined,
      basement: subject.basement || undefined,
      pool: subject.pool || undefined,
      listPrice: subject.listPrice ? Number(subject.listPrice) : undefined,
      images: subject.images || undefined,
    };

    const compData: PropertyData[] = comps.map((c) => ({
      streetAddress: c.streetAddress,
      city: c.city,
      state: c.state,
      zip: c.zip,
      latitude: c.latitude ? Number(c.latitude) : undefined,
      longitude: c.longitude ? Number(c.longitude) : undefined,
      propertyType: c.propertyType || undefined,
      bedrooms: c.bedrooms || undefined,
      bathrooms: c.bathrooms || undefined,
      sqft: c.sqft || undefined,
      soldPrice: c.soldPrice ? Number(c.soldPrice) : undefined,
      soldDate: c.soldDate ? c.soldDate.toISOString().split("T")[0] : undefined,
      images: c.images || undefined,
    }));

    const cmaResult = runCmaAnalysis(subjectData, compData);

    // Map CMA data to template fields
    const autofillData = mapCmaToAutofillData(
      cmaResult,
      dataset,
      report.title
    );

    // ── Upload property images ──────────────────────────────────

    const images = subject.images as string[] | null;
    if (images && images.length > 0) {
      try {
        const asset = await uploadAssetFromUrl(
          accessToken,
          images[0],
          `${subject.streetAddress} - Property Photo`
        );
        // Add image asset to any image fields in the template
        for (const [fieldName, fieldDef] of Object.entries(dataset.fields)) {
          if (fieldDef.type === "image") {
            autofillData[fieldName] = { type: "image", asset_id: asset.id };
          }
        }
      } catch (err) {
        console.error("Image upload failed, continuing without it:", err);
      }
    }

    // ── Create autofilled design ────────────────────────────────

    const fullAddress = `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`;
    const designTitle = report.title || `CMA Report - ${fullAddress}`;

    const design = await autofillDesign(
      accessToken,
      templateId,
      autofillData,
      designTitle
    );

    // Save to database
    await db
      .update(cmaReports)
      .set({
        canvaDesignId: design.id,
        canvaDesignUrl: design.editUrl || design.url,
      })
      .where(eq(cmaReports.id, reportId));

    return NextResponse.json({
      success: true,
      design: {
        id: design.id,
        title: designTitle,
        editUrl: design.editUrl || design.url,
        viewUrl: design.url,
      },
    });
  } catch (error) {
    console.error("Canva generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate Canva design", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Create a blank design if no brand template is available.
 * Seeds with the first property image if possible.
 */
async function createBlankDesign(
  accessToken: string,
  report: { id: number; title: string; priceMid: string | null; priceLow: string | null; priceHigh: string | null },
  subject: { streetAddress: string; city: string; state: string; zip: string | null; images: unknown },
  reportId: number
) {
  const fullAddress = `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`;
  const designTitle = report.title || `CMA Report - ${fullAddress}`;

  const createDesignBody: Record<string, unknown> = {
    design_type: { type: "preset", name: "presentation" },
    title: designTitle,
  };

  // Upload first image as asset to seed the design
  const images = subject.images as string[] | null;
  if (images && images.length > 0) {
    try {
      const uploadRes = await fetch("https://api.canva.com/rest/v1/asset-uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: images[0],
          name: `${subject.streetAddress} - Property Photo`,
        }),
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const jobId = uploadData.job?.id;
        if (jobId) {
          for (let i = 0; i < 15; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            const pollRes = await fetch(
              `https://api.canva.com/rest/v1/asset-uploads/${jobId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.job?.asset?.id) {
                createDesignBody.asset_id = pollData.job.asset.id;
                break;
              }
              if (pollData.job?.status === "failed") break;
            }
          }
        }
      }
    } catch {
      // Skip if upload fails
    }
  }

  const createRes = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createDesignBody),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("Canva create design error:", createRes.status, errorText);
    return NextResponse.json(
      { error: "Failed to create Canva design", details: errorText },
      { status: 500 }
    );
  }

  const designResult = await createRes.json();
  const design = designResult.design;
  const designId = design?.id;
  const editUrl = design?.urls?.edit_url;
  const viewUrl = design?.urls?.view_url;

  if (designId) {
    const { db: database } = await import("@/lib/db");
    const { cmaReports: reports } = await import("@/lib/db/schema");
    await database
      .update(reports)
      .set({
        canvaDesignId: designId,
        canvaDesignUrl: editUrl || viewUrl || null,
      })
      .where(eq(reports.id, reportId));
  }

  return NextResponse.json({
    success: true,
    design: {
      id: designId,
      title: designTitle,
      editUrl,
      viewUrl,
    },
    note: "No brand template found — created blank design. Add a brand template with autofill fields for a fully populated CMA presentation.",
  });
}
