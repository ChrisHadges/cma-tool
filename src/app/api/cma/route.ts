import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cmaReports, subjectProperties, comparableProperties } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const reports = await db
      .select()
      .from(cmaReports)
      .orderBy(desc(cmaReports.updatedAt))
      .limit(50);

    // Enrich reports with subject property data (image, address)
    const enriched = await Promise.all(
      reports.map(async (report) => {
        let subjectImage: string | null = null;
        let subjectAddress: string | null = null;
        let beds: number | null = null;
        let baths: number | null = null;
        let sqft: number | null = null;

        if (report.subjectPropertyId) {
          const [subj] = await db
            .select({
              images: subjectProperties.images,
              streetAddress: subjectProperties.streetAddress,
              city: subjectProperties.city,
              state: subjectProperties.state,
              bedrooms: subjectProperties.bedrooms,
              bathrooms: subjectProperties.bathrooms,
              sqft: subjectProperties.sqft,
            })
            .from(subjectProperties)
            .where(eq(subjectProperties.id, report.subjectPropertyId));

          if (subj) {
            const imgs = subj.images as string[] | null;
            subjectImage = imgs && imgs.length > 0 ? imgs[0] : null;
            subjectAddress = `${subj.streetAddress}, ${subj.city}, ${subj.state}`;
            beds = subj.bedrooms;
            baths = subj.bathrooms;
            sqft = subj.sqft;
          }
        }

        return {
          ...report,
          subjectImage,
          subjectAddress,
          beds,
          baths,
          sqft,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("List CMA reports error:", error);
    return NextResponse.json(
      { error: "Failed to list CMA reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sp = body.subjectProperty;

    // Create subject property first
    const subjectResult = await db.insert(subjectProperties).values({
      mlsNumber: sp.mlsNumber || null,
      streetAddress: sp.streetAddress || "Unknown",
      city: sp.city || "Unknown",
      state: sp.state || "Unknown",
      zip: sp.zip || "00000",
      country: sp.country || "US",
      latitude: sp.latitude ? String(sp.latitude) : null,
      longitude: sp.longitude ? String(sp.longitude) : null,
      propertyType: sp.propertyType || null,
      style: sp.style || null,
      bedrooms: sp.bedrooms ?? null,
      bedroomsPlus: sp.bedroomsPlus ?? null,
      bathrooms: sp.bathrooms ?? null,
      bathroomsHalf: sp.bathroomsHalf ?? null,
      sqft: sp.sqft ?? null,
      lotSqft: sp.lotSqft ?? null,
      yearBuilt: sp.yearBuilt ?? null,
      garage: sp.garage || null,
      garageSpaces: sp.garageSpaces ?? null,
      basement: sp.basement || null,
      heating: sp.heating || null,
      cooling: sp.cooling || null,
      pool: sp.pool || null,
      listPrice: sp.listPrice ? String(sp.listPrice) : null,
      taxesAnnual: sp.taxesAnnual ? String(sp.taxesAnnual) : null,
      daysOnMarket: sp.daysOnMarket ?? null,
      maintenanceFee: sp.maintenanceFee ? String(sp.maintenanceFee) : null,
      description: sp.description || null,
      images: sp.images && sp.images.length > 0 ? sp.images : null,
      dataJson: sp.dataJson || null,
    });

    // mysql2 returns [ResultSetHeader, FieldPacket[]]
    const subjectId = (subjectResult as unknown as [{ insertId: number }])[0].insertId;

    // Create CMA report
    const reportResult = await db.insert(cmaReports).values({
      userId: body.userId || 1, // Default user for now
      title: body.title || `CMA - ${sp.streetAddress}`,
      status: "draft",
      subjectPropertyId: subjectId,
    });

    const reportId = (reportResult as unknown as [{ insertId: number }])[0].insertId;

    // Insert comparable properties if provided
    if (body.comparables && Array.isArray(body.comparables) && body.comparables.length > 0) {
      for (const comp of body.comparables) {
        await db.insert(comparableProperties).values({
          cmaReportId: reportId,
          mlsNumber: comp.mlsNumber || null,
          streetAddress: comp.streetAddress || "Unknown",
          city: comp.city || "Unknown",
          state: comp.state || "Unknown",
          zip: comp.zip || "00000",
          latitude: comp.latitude ? String(comp.latitude) : null,
          longitude: comp.longitude ? String(comp.longitude) : null,
          propertyType: comp.propertyType || null,
          style: comp.style || null,
          bedrooms: comp.bedrooms ?? null,
          bedroomsPlus: comp.bedroomsPlus ?? null,
          bathrooms: comp.bathrooms ?? null,
          bathroomsHalf: comp.bathroomsHalf ?? null,
          sqft: comp.sqft ?? null,
          lotSqft: comp.lotSqft ?? null,
          yearBuilt: comp.yearBuilt ?? null,
          garage: comp.garage || null,
          garageSpaces: comp.garageSpaces ?? null,
          basement: comp.basement || null,
          heating: comp.heating || null,
          cooling: comp.cooling || null,
          pool: comp.pool || null,
          soldPrice: comp.soldPrice ? String(comp.soldPrice) : null,
          listPrice: comp.listPrice ? String(comp.listPrice) : null,
          soldDate: comp.soldDate ? new Date(comp.soldDate) : null,
          daysOnMarket: comp.daysOnMarket ?? null,
          images: comp.images && comp.images.length > 0 ? comp.images : null,
          dataJson: comp.dataJson || null,
        });
      }
    }

    return NextResponse.json(
      { id: reportId, subjectPropertyId: subjectId },
      { status: 201 }
    );
  } catch (error) {
    const err = error as Error & { cause?: unknown };
    console.error("Create CMA report error:", err.message, err.cause);
    return NextResponse.json(
      { error: "Failed to create CMA report", details: err.message, cause: String(err.cause ?? "") },
      { status: 500 }
    );
  }
}
