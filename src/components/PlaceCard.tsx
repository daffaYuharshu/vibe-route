"use client";

import { MapPin, Star, Navigation } from 'lucide-react';
import type { FoursquarePlace } from '@/lib/foursquare';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PlaceCardProps {
  place: FoursquarePlace;
  onRoute?: (place: FoursquarePlace) => void;
}

export function PlaceCard({ place, onRoute }: PlaceCardProps) {
  const category = place.categories?.[0];
  const iconUrl = category
    ? `${category.icon.prefix}64${category.icon.suffix}`
    : null;

  const distanceText =
    place.distance != null
      ? place.distance < 1000
        ? `${place.distance} m`
        : `${(place.distance / 1000).toFixed(1)} km`
      : null;

  return (
    <article
      className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 card-hover"
      aria-label={`Tempat: ${place.name}`}
    >
      {/* Header: icon + name + badge */}
      <div className="flex items-start gap-3">
        {iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="mt-0.5 rounded-md"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate leading-tight">
            {place.name}
          </p>
          {category && (
            <Badge
              variant="secondary"
              className="mt-1 text-xs font-medium bg-primary-light text-primary border-0 px-2"
            >
              {category.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Address */}
      {place.location.formatted_address && (
        <p className="flex items-start gap-1.5 text-xs text-text-secondary leading-relaxed">
          <MapPin className="mt-0.5 size-3 shrink-0 text-text-disabled" aria-hidden="true" />
          {place.location.formatted_address}
        </p>
      )}

      {/* Rating + Distance */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        {place.rating != null ? (
          <span className="flex items-center gap-1">
            <Star className="size-3 text-yellow-500" aria-hidden="true" />
            <span>{place.rating.toFixed(1)}</span>
          </span>
        ) : (
          <span />
        )}
        {distanceText && (
          <span className="text-text-disabled">{distanceText}</span>
        )}
      </div>

      {/* Action */}
      {onRoute && (
        <Button
          size="sm"
          variant="outline"
          className="mt-1 w-full h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => onRoute(place)}
          aria-label={`Buat rute ke ${place.name}`}
        >
          <Navigation className="mr-1.5 size-3" aria-hidden="true" />
          Buat rute ke sini
        </Button>
      )}
    </article>
  );
}
