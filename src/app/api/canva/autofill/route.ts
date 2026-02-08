import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cmaReports,
  subjectProperties,
  comparableProperties,
  adjustments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getTemplateDataset,
  autofillDesign,
  uploadAssetFromUrl,
} from "@/lib/services/canva/client";
import { mapCmaToAutofillData } from "@/lib/services/canva/autofill";
import { runCmaAnalysis } from "@/lib/services/cma/engine";
import type { PropertyData } from "@/lib/services/cma/types";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("canva_access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Canva" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId, templateId } = body;

    if (!reportId || !templateId) {
      return NextResponse.json(
        { error: "reportId and templateId are required" },
        { status: 400 }
      );
    }

    // Fetch report data
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

    const comps = await db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.cmaReportId, reportId));

    // Build CMA result for mapping
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

    // Get template dataset schema
    const dataset = await getTemplateDataset(accessToken, templateId);

    // Map CMA data to template fields
    const autofillData = mapCmaToAutofillData(
      cmaResult,
      dataset,
      report.title
    );

    // Upload subject property image as Canva asset if needed
    if (subject.images && subject.images.length > 0) {
      try {
        const asset = await uploadAssetFromUrl(
          accessToken,
          subject.images[0],
          "Subject Property"
        );
        // Add image asset to any image fields in the template
        for (const [fieldName, fieldDef] of Object.entries(dataset.fields)) {
          if (fieldDef.type === "image" && fieldName.toLowerCase().includes("subject")) {
            autofillData[fieldName] = { type: "image", asset_id: asset.id };
          }
        }
      } catch {
        // Image upload failed, continue without it
      }
    }

    // Create autofilled design
    const design = await autofillDesign(
      accessToken,
      templateId,
      autofillData,
      report.title
    );

    // Update report with Canva design info
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
        editUrl: design.editUrl || design.url,
        url: design.url,
      },
    });
  } catch (error) {
    console.error("Canva autofill error:", error);
    return NextResponse.json(
      { error: "Failed to create Canva design" },
      { status: 500 }
    );
  }
}
