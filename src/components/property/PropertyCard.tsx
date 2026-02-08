"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bed,
  Bath,
  Ruler,
  Calendar,
  MapPin,
  Heart,
  Building2,
  ImageIcon,
} from "lucide-react";

interface PropertyCardProps {
  listing: Record<string, unknown>;
  onSelect?: (listing: Record<string, unknown>) => void;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export function PropertyCard({
  listing,
  onSelect,
  selectable,
  selected,
  disabled,
}: PropertyCardProps) {
  const address = listing.address as Record<string, string>;
  const details = listing.details as Record<string, unknown>;
  const images = listing.images as string[];

  const fullAddress = [
    address?.unitNumber ? `${address.unitNumber}-` : "",
    address?.streetNumber,
    address?.streetName,
    address?.streetSuffix,
  ]
    .filter(Boolean)
    .join(" ");

  const price = listing.soldPrice || listing.listPrice;
  const isSold = !!listing.soldPrice;
  const photoCount = (listing.photoCount as number) || images?.length || 0;

  return (
    <div
      className={`group relative rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-border/50 hover:shadow-xl transition-all duration-300 ${
        selectable && !disabled
          ? "cursor-pointer hover:border-primary/40"
          : ""
      } ${selected ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""} ${
        disabled && !selected ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={() => selectable && !disabled && onSelect?.(listing)}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {images && images.length > 0 ? (
          <img
            src={images[0]}
            alt={fullAddress}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 gap-2">
            <Building2 className="h-10 w-10" />
            <span className="text-xs">No Photo</span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isSold ? (
            <Badge className="bg-red-500/90 text-white hover:bg-red-500 border-0 text-[11px] font-semibold tracking-wide uppercase">
              Sold
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-500 border-0 text-[11px] font-semibold tracking-wide uppercase">
              For Sale
            </Badge>
          )}
        </div>

        {/* Photo count */}
        {photoCount > 1 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-md">
            <ImageIcon className="h-3 w-3" />
            {photoCount}
          </div>
        )}

        {/* Price on image */}
        <div className="absolute bottom-3 left-3">
          <span className="text-2xl font-bold text-white drop-shadow-lg">
            ${Number(price).toLocaleString()}
          </span>
          {isSold && Boolean(listing.soldDate) && (
            <span className="block text-[11px] text-white/80 mt-0.5">
              Sold {String(listing.soldDate).slice(0, 10)}
            </span>
          )}
        </div>

        {/* DOM badge */}
        {listing.daysOnMarket && Number(listing.daysOnMarket) > 0 ? (
          <div className="absolute bottom-3 right-3 text-[11px] text-white/80 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
            {Number(listing.daysOnMarket)} days
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Property specs */}
        <div className="flex items-center gap-1 text-sm mb-2">
          {details?.numBedrooms != null && (
            <>
              <span className="font-semibold">{Number(details.numBedrooms)}</span>
              <span className="text-muted-foreground text-xs">bd</span>
              <span className="text-muted-foreground mx-1">|</span>
            </>
          )}
          {details?.numBathrooms != null && (
            <>
              <span className="font-semibold">{Number(details.numBathrooms)}</span>
              <span className="text-muted-foreground text-xs">ba</span>
              <span className="text-muted-foreground mx-1">|</span>
            </>
          )}
          {Boolean(details?.sqft) && (
            <>
              <span className="font-semibold">{String(details.sqft)}</span>
              <span className="text-muted-foreground text-xs">sqft</span>
            </>
          )}
          {Boolean(details?.propertyType) && (
            <>
              <span className="text-muted-foreground mx-1">-</span>
              <span className="text-muted-foreground text-xs">{String(details.propertyType)}</span>
            </>
          )}
        </div>

        {/* Address */}
        <p className="text-sm font-medium truncate">{fullAddress}</p>
        <p className="text-xs text-muted-foreground truncate">
          {address?.city}, {address?.state} {address?.zip}
        </p>

        {/* MLS # */}
        <p className="text-[11px] text-muted-foreground/60 mt-1.5">
          MLS# {String(listing.mlsNumber)}
        </p>

        {/* CTA */}
        {!selectable && (
          <div className="mt-3">
            <Link href={`/cma/new?mls=${listing.mlsNumber}`} className="block">
              <Button
                size="sm"
                className="w-full rounded-lg text-xs h-8"
              >
                Start CMA
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
