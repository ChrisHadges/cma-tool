"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Ruler, Calendar, MapPin } from "lucide-react";

interface PropertyCardProps {
  listing: Record<string, unknown>;
  onSelect?: (listing: Record<string, unknown>) => void;
  selectable?: boolean;
  selected?: boolean;
}

export function PropertyCard({ listing, onSelect, selectable, selected }: PropertyCardProps) {
  const address = listing.address as Record<string, string>;
  const details = listing.details as Record<string, unknown>;
  const images = listing.images as string[];
  const map = listing.map as Record<string, number>;

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

  return (
    <Card
      className={`overflow-hidden transition-all ${
        selectable ? "cursor-pointer hover:ring-2 hover:ring-primary" : ""
      } ${selected ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onClick={() => selectable && onSelect?.(listing)}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted">
        {images && images.length > 0 ? (
          <img
            src={images[0]}
            alt={fullAddress}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant={isSold ? "secondary" : "default"}>
            {isSold ? "Sold" : "Active"}
          </Badge>
          {listing.daysOnMarket ? (
            <Badge variant="outline" className="bg-background/80">
              {Number(listing.daysOnMarket)} DOM
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold">
            ${Number(price).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            MLS# {String(listing.mlsNumber)}
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{fullAddress}</p>
            <p className="text-xs text-muted-foreground">
              {address?.city}, {address?.state} {address?.zip}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {details?.numBedrooms != null ? (
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              <span>
                {Number(details.numBedrooms)}
                {Number(details.numBedroomsPlus) > 0
                  ? `+${String(details.numBedroomsPlus)}`
                  : ""}
              </span>
            </div>
          ) : null}
          {details?.numBathrooms != null ? (
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              <span>{Number(details.numBathrooms)}</span>
            </div>
          ) : null}
          {details?.sqft ? (
            <div className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              <span>{String(details.sqft)} sqft</span>
            </div>
          ) : null}
          {details?.yearBuilt ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{String(details.yearBuilt)}</span>
            </div>
          ) : null}
        </div>

        {/* Property Type */}
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">
            {String(details?.propertyType || "")} {details?.style ? `- ${String(details.style)}` : ""}
          </span>
        </div>

        {/* Action buttons */}
        {!selectable && (
          <div className="mt-3 flex gap-2">
            <Link href={`/cma/new?mls=${listing.mlsNumber}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Use as Subject
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
