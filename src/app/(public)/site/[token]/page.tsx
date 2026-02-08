import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CmaSite } from "./CmaSite";
import type { CmaSiteData } from "./types";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getSiteData(token: string): Promise<CmaSiteData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
  try {
    const res = await fetch(`${baseUrl}/api/site/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getSiteData(token);

  if (!data) {
    return { title: "CMA Report" };
  }

  const title = `${data.subjectProperty.streetAddress} — CMA Report`;
  const description = `Comparative Market Analysis for ${data.subjectProperty.address}. ${
    data.pricing.suggestedPriceRaw
      ? `Suggested price: ${data.pricing.suggestedPrice}`
      : ""
  }`;
  const image = data.subjectProperty.images[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function CmaSitePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getSiteData(token);

  if (!data) {
    notFound();
  }

  return <CmaSite data={data} />;
}
