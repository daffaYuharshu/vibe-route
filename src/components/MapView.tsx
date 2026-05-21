"use client";

import React from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  children?: React.ReactNode;
}

export function MapView({ children }: MapViewProps) {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  if (!mapTilerKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
        MapTiler API Key is missing. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env.local file.
      </div>
    );
  }

  const mapStyle = `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerKey}`;

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={{
          longitude: 106.8272, // Default: Jakarta
          latitude: -6.1751,
          zoom: 12
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        {/* Layer overlays and markers will be passed as children */}
        {children}
      </Map>
    </div>
  );
}
