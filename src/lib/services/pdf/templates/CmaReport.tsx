import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const BLUE = "#1e3a5f";
const ACCENT = "#2563eb";
const LIGHT_BLUE = "#f0f9ff";
const GRAY = "#64748b";
const LIGHT_GRAY = "#f1f5f9";
const BORDER = "#e2e8f0";
const GREEN = "#16a34a";
const RED = "#dc2626";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  coverPage: { padding: 0, fontFamily: "Helvetica" },
  coverBg: {
    backgroundColor: BLUE,
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverTitle: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    opacity: 0.7,
    marginTop: 30,
  },
  coverBrand: {
    fontSize: 10,
    color: "#fff",
    textAlign: "center",
    opacity: 0.5,
    marginTop: 60,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
  },
  subTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 14,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: {
    width: 120,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
  },
  value: { fontSize: 10, color: "#1a1a1a", flex: 1 },
  propertyImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 4,
    marginBottom: 12,
  },
  compImage: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    borderRadius: 4,
    marginBottom: 8,
  },
  statsGrid: { flexDirection: "row", gap: 10, marginVertical: 14 },
  statCard: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ACCENT },
  statLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: "uppercase",
    marginTop: 3,
  },
  priceBox: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  priceRange: { fontSize: 12, color: GRAY, marginBottom: 4 },
  priceMid: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    marginBottom: 4,
  },
  priceLabel: { fontSize: 10, color: GRAY },
  // Side-by-side comparison table
  table: { marginVertical: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#fafbfc",
  },
  tableRowTotal: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderTopColor: BLUE,
    backgroundColor: LIGHT_GRAY,
  },
  thCell: {
    padding: 6,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  tdCell: { padding: 6, fontSize: 8 },
  tdSubject: { padding: 6, fontSize: 8, backgroundColor: LIGHT_BLUE },
  textGreen: { color: GREEN },
  textRed: { color: RED },
  // Comp card
  compCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    marginBottom: 16,
    overflow: "hidden",
  },
  compCardHeader: {
    backgroundColor: LIGHT_GRAY,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compCardBody: { padding: 12 },
  compGrid: { flexDirection: "row", gap: 16 },
  compGridLeft: { flex: 1 },
  compGridRight: { flex: 1 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  disclaimer: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 24,
    textAlign: "center",
    lineHeight: 1.4,
  },
  // Neighborhood styles
  scoreCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  scoreBig: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
  },
  scoreLabel: {
    fontSize: 8,
    color: GRAY,
    textTransform: "uppercase",
    marginTop: 4,
    textAlign: "center",
  },
  scoreDesc: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 2,
    textAlign: "center",
  },
  schoolRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  amenityChip: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 8,
    color: "#374151",
  },
});

export interface NeighborhoodPdfData {
  schools: Array<{
    name: string;
    type: string;
    rating?: number;
    distance?: string;
  }>;
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
}

export interface CmaPdfProps {
  report: Record<string, unknown>;
  subject: Record<string, unknown> | null;
  comparables: Array<
    Record<string, unknown> & { adjustments: Record<string, unknown>[] }
  >;
  marketSnapshots: Record<string, unknown>[];
  neighborhoodData?: NeighborhoodPdfData | null;
}

const fmt = (val: unknown) =>
  val ? `$${Number(val).toLocaleString()}` : "N/A";

const fmtNum = (val: unknown) =>
  val != null ? Number(val).toLocaleString() : "N/A";

function PropertyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Footer() {
  return <Text style={styles.footer}>Canva CMA — Comparative Market Analysis</Text>;
}

function scoreColor(score: number): string {
  if (score >= 80) return GREEN;
  if (score >= 50) return "#f59e0b"; // amber
  return RED;
}

function SchoolTypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    elementary: { bg: "#dbeafe", text: "#1d4ed8" },
    middle: { bg: "#fef3c7", text: "#92400e" },
    high: { bg: "#dcfce7", text: "#166534" },
    private: { bg: "#f3e8ff", text: "#7c3aed" },
    other: { bg: LIGHT_GRAY, text: GRAY },
  };
  const c = colors[type] || colors.other;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text style={{ fontSize: 7, color: c.text, textTransform: "capitalize" }}>
        {type}
      </Text>
    </View>
  );
}

export function CmaReportPdf({
  report,
  subject,
  comparables,
  marketSnapshots,
  neighborhoodData,
}: CmaPdfProps) {
  const address = subject
    ? `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`
    : "";

  const subjectImages = (subject?.images as string[]) || [];

  return (
    <Document>
      {/* ── 1. Cover Page ─────────────────────────────────────── */}
      <Page size="LETTER" style={styles.coverPage}>
        <View style={styles.coverBg}>
          <Text style={styles.coverTitle}>
            Comparative Market Analysis
          </Text>
          <Text style={styles.coverSubtitle}>{address}</Text>
          {subject?.listPrice ? (
            <Text
              style={{
                fontSize: 20,
                color: "#fff",
                textAlign: "center",
                marginTop: 12,
                fontFamily: "Helvetica-Bold",
              }}
            >
              List Price: {fmt(subject.listPrice)}
            </Text>
          ) : null}
          <Text style={styles.coverDate}>
            Prepared on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.coverBrand}>Generated by Canva CMA</Text>
        </View>
      </Page>

      {/* ── 2. Subject Property Page ──────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Subject Property</Text>

        {/* Subject photo */}
        {subjectImages.length > 0 ? (
          <Image src={subjectImages[0]} style={styles.propertyImage} />
        ) : null}

        {subject ? (
          <View>
            <PropertyRow label="Address" value={address} />
            <PropertyRow
              label="MLS #"
              value={String(subject.mlsNumber || "N/A")}
            />
            <PropertyRow
              label="Property Type"
              value={String(subject.propertyType || "N/A")}
            />
            <PropertyRow
              label="List Price"
              value={fmt(subject.listPrice)}
            />

            {/* Quick stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {String(subject.bedrooms || "–")}
                </Text>
                <Text style={styles.statLabel}>Bedrooms</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {String(subject.bathrooms || "–")}
                </Text>
                <Text style={styles.statLabel}>Bathrooms</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {subject.sqft ? fmtNum(subject.sqft) : "–"}
                </Text>
                <Text style={styles.statLabel}>Sqft</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {String(subject.yearBuilt || "–")}
                </Text>
                <Text style={styles.statLabel}>Year Built</Text>
              </View>
            </View>

            <PropertyRow
              label="Lot Size"
              value={
                subject.lotSqft
                  ? `${fmtNum(subject.lotSqft)} sqft`
                  : "N/A"
              }
            />
            <PropertyRow
              label="Garage"
              value={`${String(subject.garage || "N/A")} (${String(
                subject.garageSpaces || 0
              )} spaces)`}
            />
            <PropertyRow
              label="Basement"
              value={String(subject.basement || "N/A")}
            />
            <PropertyRow
              label="Days on Market"
              value={String(subject.daysOnMarket || "N/A")}
            />
          </View>
        ) : (
          <Text>No subject property data available.</Text>
        )}

        {/* Price Recommendation */}
        {report.priceMid ? (
          <View>
            <Text style={styles.subTitle}>Price Recommendation</Text>
            <View style={styles.priceBox}>
              <Text style={styles.priceRange}>
                {fmt(report.priceLow)} — {fmt(report.priceHigh)}
              </Text>
              <Text style={styles.priceMid}>{fmt(report.priceMid)}</Text>
              <Text style={styles.priceLabel}>
                Suggested Listing Price
              </Text>
            </View>
          </View>
        ) : null}

        <Footer />
      </Page>

      {/* ── 3. Individual Comparable Pages ────────────────────── */}
      {comparables.length > 0 ? (
        <Page size="LETTER" style={styles.page}>
          <Text style={styles.sectionTitle}>
            Comparable Properties ({comparables.length})
          </Text>

          {comparables.map((comp, idx) => {
            const compImages = (comp.images as string[]) || [];
            const compAddr = `${comp.streetAddress}, ${comp.city}, ${comp.state} ${comp.zip}`;

            return (
              <View key={idx} style={styles.compCard} wrap={false}>
                <View style={styles.compCardHeader}>
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      fontSize: 11,
                      color: BLUE,
                    }}
                  >
                    Comp #{idx + 1}: {String(comp.streetAddress || "")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      fontSize: 11,
                      color: ACCENT,
                    }}
                  >
                    {fmt(comp.soldPrice || comp.listPrice)}
                  </Text>
                </View>

                <View style={styles.compCardBody}>
                  <View style={styles.compGrid}>
                    {/* Left: photo or details */}
                    <View style={styles.compGridLeft}>
                      {compImages.length > 0 ? (
                        <Image
                          src={compImages[0]}
                          style={styles.compImage}
                        />
                      ) : (
                        <View
                          style={{
                            height: 140,
                            backgroundColor: LIGHT_GRAY,
                            borderRadius: 4,
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text style={{ color: GRAY, fontSize: 9 }}>
                            No Photo Available
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Right: property details */}
                    <View style={styles.compGridRight}>
                      <PropertyRow label="Address" value={compAddr} />
                      <PropertyRow
                        label="MLS #"
                        value={String(comp.mlsNumber || "N/A")}
                      />
                      <PropertyRow
                        label="Sold Price"
                        value={fmt(comp.soldPrice)}
                      />
                      <PropertyRow
                        label="List Price"
                        value={fmt(comp.listPrice)}
                      />
                      <PropertyRow
                        label="Sold Date"
                        value={
                          comp.soldDate
                            ? String(comp.soldDate).split("T")[0]
                            : "N/A"
                        }
                      />
                      <PropertyRow
                        label="Beds / Baths"
                        value={`${String(comp.bedrooms || "–")} / ${String(
                          comp.bathrooms || "–"
                        )}`}
                      />
                      <PropertyRow
                        label="Sqft"
                        value={
                          comp.sqft ? fmtNum(comp.sqft) : "N/A"
                        }
                      />
                      <PropertyRow
                        label="Year Built"
                        value={String(comp.yearBuilt || "N/A")}
                      />
                      <PropertyRow
                        label="DOM"
                        value={String(comp.daysOnMarket || "N/A")}
                      />
                      {comp.distanceKm ? (
                        <PropertyRow
                          label="Distance"
                          value={`${Number(comp.distanceKm).toFixed(
                            1
                          )} km`}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          <Footer />
        </Page>
      ) : null}

      {/* ── 4. Side-by-Side Comparison Table ──────────────────── */}
      {comparables.length > 0 ? (
        <Page size="LETTER" style={styles.page} orientation="landscape">
          <Text style={styles.sectionTitle}>
            Side-by-Side Comparison
          </Text>

          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { width: 80 }]}>Feature</Text>
              <Text
                style={[
                  styles.thCell,
                  { width: 95, backgroundColor: "#dbeafe" },
                ]}
              >
                Subject
              </Text>
              {comparables.map((_c, i) => (
                <Text key={i} style={[styles.thCell, { flex: 1 }]}>
                  Comp {i + 1}
                </Text>
              ))}
            </View>

            {/* Address */}
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Address
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {String(subject?.streetAddress || "")}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {String(c.streetAddress || "")}
                </Text>
              ))}
            </View>

            {/* Price */}
            <View style={styles.tableRowAlt}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Price
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {fmt(subject?.listPrice)}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {fmt(c.soldPrice || c.listPrice)}
                </Text>
              ))}
            </View>

            {/* Bedrooms */}
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Bedrooms
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {String(subject?.bedrooms || "–")}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {String(c.bedrooms || "–")}
                </Text>
              ))}
            </View>

            {/* Bathrooms */}
            <View style={styles.tableRowAlt}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Bathrooms
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {String(subject?.bathrooms || "–")}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {String(c.bathrooms || "–")}
                </Text>
              ))}
            </View>

            {/* Sqft */}
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Sqft
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {subject?.sqft ? fmtNum(subject.sqft) : "–"}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {c.sqft ? fmtNum(c.sqft) : "–"}
                </Text>
              ))}
            </View>

            {/* Year Built */}
            <View style={styles.tableRowAlt}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Year Built
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {String(subject?.yearBuilt || "–")}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {String(c.yearBuilt || "–")}
                </Text>
              ))}
            </View>

            {/* Lot Size */}
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Lot Size
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {subject?.lotSqft ? fmtNum(subject.lotSqft) : "–"}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {c.lotSqft ? fmtNum(c.lotSqft) : "–"}
                </Text>
              ))}
            </View>

            {/* Garage */}
            <View style={styles.tableRowAlt}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Garage
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {String(subject?.garageSpaces || "–")} spaces
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {String(c.garageSpaces || "–")} spaces
                </Text>
              ))}
            </View>

            {/* Days on Market */}
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Days on Market
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {String(subject?.daysOnMarket || "–")}
              </Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {String(c.daysOnMarket || "–")}
                </Text>
              ))}
            </View>

            {/* Sold Date */}
            <View style={styles.tableRowAlt}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                Sold Date
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>—</Text>
              {comparables.map((c, i) => (
                <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                  {c.soldDate
                    ? String(c.soldDate).split("T")[0]
                    : "–"}
                </Text>
              ))}
            </View>

            {/* $/Sqft */}
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tdCell,
                  { width: 80, fontFamily: "Helvetica-Bold" },
                ]}
              >
                $/Sqft
              </Text>
              <Text style={[styles.tdSubject, { width: 95 }]}>
                {subject?.listPrice && subject?.sqft
                  ? `$${Math.round(
                      Number(subject.listPrice) / Number(subject.sqft)
                    ).toLocaleString()}`
                  : "–"}
              </Text>
              {comparables.map((c, i) => {
                const price = Number(c.soldPrice || c.listPrice || 0);
                const sq = Number(c.sqft || 0);
                return (
                  <Text key={i} style={[styles.tdCell, { flex: 1 }]}>
                    {price && sq
                      ? `$${Math.round(price / sq).toLocaleString()}`
                      : "–"}
                  </Text>
                );
              })}
            </View>

            {/* Adjustment rows if any */}
            {comparables[0]?.adjustments?.length > 0 ? (
              <>
                {/* Separator */}
                <View
                  style={{
                    flexDirection: "row",
                    borderTopWidth: 2,
                    borderTopColor: ACCENT,
                    marginTop: 4,
                    paddingTop: 2,
                  }}
                >
                  <Text
                    style={[
                      styles.thCell,
                      { width: 80, fontSize: 7, color: ACCENT },
                    ]}
                  >
                    ADJUSTMENTS
                  </Text>
                </View>
                {comparables[0].adjustments.map(
                  (adj: Record<string, unknown>, adjIdx: number) => (
                    <View
                      key={adjIdx}
                      style={
                        adjIdx % 2 === 0
                          ? styles.tableRowAlt
                          : styles.tableRow
                      }
                    >
                      <Text
                        style={[
                          styles.tdCell,
                          { width: 80, fontFamily: "Helvetica-Bold" },
                        ]}
                      >
                        {String(adj.label || adj.category)}
                      </Text>
                      <Text style={[styles.tdSubject, { width: 95 }]}>
                        {String(adj.subjectValue || "")}
                      </Text>
                      {comparables.map((c, i) => {
                        const compAdj = c.adjustments[adjIdx] as Record<
                          string,
                          unknown
                        >;
                        const amt = Number(
                          compAdj?.adjustmentAmount || 0
                        );
                        return (
                          <Text
                            key={i}
                            style={[
                              styles.tdCell,
                              { flex: 1 },
                              amt > 0
                                ? styles.textGreen
                                : amt < 0
                                ? styles.textRed
                                : {},
                            ]}
                          >
                            {amt > 0 ? "+" : ""}
                            {fmt(amt)}
                          </Text>
                        );
                      })}
                    </View>
                  )
                )}

                {/* Total Adjustment */}
                <View style={styles.tableRowTotal}>
                  <Text
                    style={[
                      styles.tdCell,
                      { width: 80, fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    Total Adj.
                  </Text>
                  <Text style={[styles.tdSubject, { width: 95 }]}>
                    —
                  </Text>
                  {comparables.map((c, i) => {
                    const total = Number(c.totalAdjustment || 0);
                    return (
                      <Text
                        key={i}
                        style={[
                          styles.tdCell,
                          { flex: 1, fontFamily: "Helvetica-Bold" },
                          total > 0
                            ? styles.textGreen
                            : total < 0
                            ? styles.textRed
                            : {},
                        ]}
                      >
                        {total > 0 ? "+" : ""}
                        {fmt(total)}
                      </Text>
                    );
                  })}
                </View>

                {/* Adjusted Price */}
                <View
                  style={[styles.tableRow, { backgroundColor: LIGHT_GRAY }]}
                >
                  <Text
                    style={[
                      styles.tdCell,
                      { width: 80, fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    Adj. Price
                  </Text>
                  <Text style={[styles.tdSubject, { width: 95 }]}>
                    —
                  </Text>
                  {comparables.map((c, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.tdCell,
                        { flex: 1, fontFamily: "Helvetica-Bold" },
                      ]}
                    >
                      {fmt(c.adjustedPrice)}
                    </Text>
                  ))}
                </View>
              </>
            ) : null}
          </View>

          <Footer />
        </Page>
      ) : null}

      {/* ── 5. Listing Averages Summary ───────────────────────── */}
      {comparables.length > 0 ? (
        <Page size="LETTER" style={styles.page}>
          <Text style={styles.sectionTitle}>Comparable Averages</Text>

          {(() => {
            const prices = comparables
              .map((c) => Number(c.soldPrice || c.listPrice || 0))
              .filter((p) => p > 0);
            const sqfts = comparables
              .map((c) => Number(c.sqft || 0))
              .filter((s) => s > 0);
            const doms = comparables
              .map((c) => Number(c.daysOnMarket || 0))
              .filter((d) => d > 0);

            const avgPrice =
              prices.length > 0
                ? prices.reduce((a, b) => a + b, 0) / prices.length
                : 0;
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
            const avgSqft =
              sqfts.length > 0
                ? sqfts.reduce((a, b) => a + b, 0) / sqfts.length
                : 0;
            const avgDom =
              doms.length > 0
                ? doms.reduce((a, b) => a + b, 0) / doms.length
                : 0;
            const avgPpsf =
              avgPrice && avgSqft ? Math.round(avgPrice / avgSqft) : 0;

            return (
              <View>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {comparables.length}
                    </Text>
                    <Text style={styles.statLabel}>Total Comps</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {fmt(Math.round(avgPrice))}
                    </Text>
                    <Text style={styles.statLabel}>Avg Price</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      ${avgPpsf.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Avg $/Sqft</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {Math.round(avgDom)}
                    </Text>
                    <Text style={styles.statLabel}>Avg DOM</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {fmt(minPrice)}
                    </Text>
                    <Text style={styles.statLabel}>Lowest Price</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {fmt(maxPrice)}
                    </Text>
                    <Text style={styles.statLabel}>Highest Price</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {fmtNum(Math.round(avgSqft))}
                    </Text>
                    <Text style={styles.statLabel}>Avg Sqft</Text>
                  </View>
                </View>

                {/* Price comparison with subject */}
                {subject?.listPrice && avgPrice > 0 ? (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 16,
                      backgroundColor: LIGHT_BLUE,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#bfdbfe",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Helvetica-Bold",
                        color: BLUE,
                        marginBottom: 8,
                      }}
                    >
                      Subject vs. Comparable Averages
                    </Text>
                    <View style={styles.row}>
                      <Text style={styles.label}>Subject List Price</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontFamily: "Helvetica-Bold" },
                        ]}
                      >
                        {fmt(subject.listPrice)}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Avg Comp Sale Price</Text>
                      <Text
                        style={[
                          styles.value,
                          { fontFamily: "Helvetica-Bold" },
                        ]}
                      >
                        {fmt(Math.round(avgPrice))}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Difference</Text>
                      <Text
                        style={[
                          styles.value,
                          {
                            fontFamily: "Helvetica-Bold",
                            color:
                              Number(subject.listPrice) > avgPrice
                                ? RED
                                : GREEN,
                          },
                        ]}
                      >
                        {fmt(
                          Math.round(
                            Number(subject.listPrice) - avgPrice
                          )
                        )}{" "}
                        (
                        {(
                          ((Number(subject.listPrice) - avgPrice) /
                            avgPrice) *
                          100
                        ).toFixed(1)}
                        %)
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })()}

          <Footer />
        </Page>
      ) : null}

      {/* ── 6. Market Snapshot (if data available) ────────────── */}
      {marketSnapshots.length > 0 ? (
        <Page size="LETTER" style={styles.page}>
          <Text style={styles.sectionTitle}>Market Snapshot</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { width: 65 }]}>Period</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>Avg Price</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>
                Median Price
              </Text>
              <Text style={[styles.thCell, { width: 50 }]}>Avg DOM</Text>
              <Text style={[styles.thCell, { width: 50 }]}>Sold</Text>
              <Text style={[styles.thCell, { width: 50 }]}>Active</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>$/Sqft</Text>
            </View>
            {marketSnapshots.map(
              (snap: Record<string, unknown>, idx: number) => (
                <View
                  key={idx}
                  style={
                    idx % 2 === 0 ? styles.tableRowAlt : styles.tableRow
                  }
                >
                  <Text style={[styles.tdCell, { width: 65 }]}>
                    {String(snap.period || "")}
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1 }]}>
                    {fmt(snap.avgPrice)}
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1 }]}>
                    {fmt(snap.medianPrice)}
                  </Text>
                  <Text style={[styles.tdCell, { width: 50 }]}>
                    {String(snap.avgDom || "–")}
                  </Text>
                  <Text style={[styles.tdCell, { width: 50 }]}>
                    {String(snap.soldCount || "–")}
                  </Text>
                  <Text style={[styles.tdCell, { width: 50 }]}>
                    {String(snap.activeCount || "–")}
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1 }]}>
                    {fmt(snap.avgPricePerSqft)}
                  </Text>
                </View>
              )
            )}
          </View>

          <Footer />
        </Page>
      ) : null}

      {/* ── 7. Neighborhood Overview ──────────────────────────── */}
      {neighborhoodData ? (
        <Page size="LETTER" style={styles.page}>
          <Text style={styles.sectionTitle}>Neighborhood Overview</Text>
          <Text style={{ fontSize: 9, color: GRAY, marginBottom: 14 }}>
            {subject
              ? `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`
              : "Subject Property Area"}
          </Text>

          {/* Walk / Transit / Bike Scores */}
          {(neighborhoodData.walkScore != null ||
            neighborhoodData.transitScore != null ||
            neighborhoodData.bikeScore != null) ? (
            <View>
              <Text style={styles.subTitle}>Livability Scores</Text>
              <View style={styles.statsGrid}>
                {neighborhoodData.walkScore != null ? (
                  <View style={styles.scoreCard}>
                    <Text
                      style={[
                        styles.scoreBig,
                        { color: scoreColor(neighborhoodData.walkScore) },
                      ]}
                    >
                      {neighborhoodData.walkScore}
                    </Text>
                    <Text style={styles.scoreLabel}>Walk Score</Text>
                    {neighborhoodData.walkScoreDescription ? (
                      <Text style={styles.scoreDesc}>
                        {neighborhoodData.walkScoreDescription}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {neighborhoodData.transitScore != null ? (
                  <View style={styles.scoreCard}>
                    <Text
                      style={[
                        styles.scoreBig,
                        { color: scoreColor(neighborhoodData.transitScore) },
                      ]}
                    >
                      {neighborhoodData.transitScore}
                    </Text>
                    <Text style={styles.scoreLabel}>Transit Score</Text>
                    {neighborhoodData.transitScoreDescription ? (
                      <Text style={styles.scoreDesc}>
                        {neighborhoodData.transitScoreDescription}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {neighborhoodData.bikeScore != null ? (
                  <View style={styles.scoreCard}>
                    <Text
                      style={[
                        styles.scoreBig,
                        { color: scoreColor(neighborhoodData.bikeScore) },
                      ]}
                    >
                      {neighborhoodData.bikeScore}
                    </Text>
                    <Text style={styles.scoreLabel}>Bike Score</Text>
                    {neighborhoodData.bikeScoreDescription ? (
                      <Text style={styles.scoreDesc}>
                        {neighborhoodData.bikeScoreDescription}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Crime / Safety */}
          {neighborhoodData.crimeIndex != null ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subTitle}>Safety</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor:
                    neighborhoodData.crimeIndex <= 100
                      ? "#f0fdf4"
                      : "#fef2f2",
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor:
                    neighborhoodData.crimeIndex <= 100
                      ? "#bbf7d0"
                      : "#fecaca",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Helvetica-Bold",
                      color:
                        neighborhoodData.crimeIndex <= 100
                          ? GREEN
                          : RED,
                    }}
                  >
                    Crime Index: {neighborhoodData.crimeIndex}
                  </Text>
                  <Text style={{ fontSize: 9, color: GRAY, marginTop: 2 }}>
                    {neighborhoodData.crimeDescription || ""} (National Avg = 100)
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Schools */}
          {neighborhoodData.schools.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subTitle}>
                Nearby Schools
                {neighborhoodData.avgSchoolRating
                  ? ` — Avg Rating: ${neighborhoodData.avgSchoolRating}/10`
                  : ""}
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {/* School table header */}
                <View
                  style={[
                    styles.schoolRow,
                    {
                      backgroundColor: LIGHT_GRAY,
                      borderBottomWidth: 1,
                      borderBottomColor: BORDER,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.thCell,
                      { flex: 3, fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    School Name
                  </Text>
                  <Text
                    style={[
                      styles.thCell,
                      { flex: 1, textAlign: "center" },
                    ]}
                  >
                    Type
                  </Text>
                  <Text
                    style={[
                      styles.thCell,
                      { flex: 1, textAlign: "center" },
                    ]}
                  >
                    Rating
                  </Text>
                  <Text
                    style={[
                      styles.thCell,
                      { flex: 1, textAlign: "center" },
                    ]}
                  >
                    Distance
                  </Text>
                </View>
                {neighborhoodData.schools.map(
                  (school: { name: string; type: string; rating?: number; distance?: string }, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.schoolRow,
                        idx % 2 === 0
                          ? { backgroundColor: "#fff" }
                          : { backgroundColor: "#fafbfc" },
                      ]}
                    >
                      <Text style={{ flex: 3, fontSize: 8 }}>
                        {school.name}
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                        }}
                      >
                        <SchoolTypeBadge type={school.type} />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 9,
                          textAlign: "center",
                          fontFamily: "Helvetica-Bold",
                          color: school.rating
                            ? school.rating >= 7
                              ? GREEN
                              : school.rating >= 4
                              ? "#f59e0b"
                              : RED
                            : GRAY,
                        }}
                      >
                        {school.rating ? `${school.rating}/10` : "N/A"}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 8,
                          textAlign: "center",
                          color: GRAY,
                        }}
                      >
                        {school.distance || "N/A"}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          ) : null}

          {/* Demographics */}
          {(neighborhoodData.medianHouseholdIncome ||
            neighborhoodData.population ||
            neighborhoodData.medianAge) ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subTitle}>Demographics</Text>
              <View style={styles.statsGrid}>
                {neighborhoodData.medianHouseholdIncome ? (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      ${Number(
                        neighborhoodData.medianHouseholdIncome
                      ).toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Median Income</Text>
                  </View>
                ) : null}
                {neighborhoodData.population ? (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {Number(
                        neighborhoodData.population
                      ).toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Population</Text>
                  </View>
                ) : null}
                {neighborhoodData.medianAge ? (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {neighborhoodData.medianAge}
                    </Text>
                    <Text style={styles.statLabel}>Median Age</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Nearby Amenities */}
          {neighborhoodData.nearbyAmenities.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subTitle}>Nearby Amenities</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                }}
              >
                {neighborhoodData.nearbyAmenities.map(
                  (amenity: string, idx: number) => (
                    <View key={idx} style={styles.amenityChip}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          ) : null}

          <Footer />
        </Page>
      ) : null}

      {/* ── 8. Disclaimer Page ────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Disclaimer</Text>
        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6 }}>
          This Comparative Market Analysis (CMA) is intended for
          informational purposes only and does not constitute an appraisal.
          The information contained in this report is believed to be
          accurate but is not guaranteed. The suggested price range is based
          on available market data and comparable sales analysis and should
          not be considered a guarantee of actual selling price. Market
          conditions are subject to change, and actual results may vary from
          the estimates provided.
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: GRAY,
            lineHeight: 1.6,
            marginTop: 12,
          }}
        >
          This analysis was prepared using data from the Multiple Listing
          Service (MLS) and public records. It is recommended that buyers
          and sellers consult with a licensed real estate professional
          and/or certified appraiser for a comprehensive property
          evaluation.
        </Text>
        <Text style={styles.disclaimer}>
          Generated by Canva CMA — Comparative Market Analysis Tool
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}
