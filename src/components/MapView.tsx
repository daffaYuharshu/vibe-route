"use client";

import React from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  children?: React.ReactNode;
  routeGeometry?: GeoJSON.LineString | null;
}

export function MapView({ children, routeGeometry }: MapViewProps) {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  if (!mapTilerKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
        MapTiler API Key is missing. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env.local file.
      </div>
    );
  }

  const mapStyle = `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerKey}`;

  const routeGeoJson: GeoJSON.FeatureCollection | undefined = routeGeometry
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: routeGeometry,
          },
        ],
      }
    : undefined;

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={{
          longitude: 106.8272,
          latitude: -6.1751,
          zoom: 12,
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Route polyline rendered from OSRM GeoJSON */}
        {routeGeoJson && (
          <Source id="route-source" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#1D4ED8',
                'line-width': 5,
                'line-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Markers and overlays passed as children */}
        {children}
      </Map>
    </div>
  );
}
