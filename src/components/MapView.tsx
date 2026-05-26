"use client";

import React, { useRef, useEffect } from 'react';
import Map, {
  NavigationControl,
  Source,
  Layer,
  Marker,
  type MapRef,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Navigation, MapPin } from 'lucide-react';
import type { GeoPoint } from '@/store/locationStore';

interface MapViewProps {
  children?: React.ReactNode;
  /** OSRM LineString geometry — triggers auto-fit when set */
  routeGeometry?: GeoJSON.LineString | null;
  /** Origin point — shown as green navigation marker */
  origin?: GeoPoint | null;
  /** Destination point — shown as red pin marker */
  destination?: GeoPoint | null;
}

export function MapView({ children, routeGeometry, origin, destination }: MapViewProps) {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const mapRef = useRef<MapRef>(null);

  // ── Auto-fit map to route bounds whenever geometry changes ─────────
  useEffect(() => {
    if (!routeGeometry || !mapRef.current) return;
    const coords = routeGeometry.coordinates as [number, number][];
    if (coords.length < 2) return;

    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];

    mapRef.current.fitBounds([sw, ne], {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      duration: 1200,
      maxZoom: 16,
    });
  }, [routeGeometry]);

  // ── Auto-fly to origin when destination not set yet ────────────────
  useEffect(() => {
    if (routeGeometry || !origin || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [origin.lng, origin.lat],
      zoom: 14,
      duration: 800,
    });
  }, [origin, routeGeometry]);

  if (!mapTilerKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
        MapTiler API Key tidak ditemukan. Tambahkan NEXT_PUBLIC_MAPTILER_API_KEY ke .env.local
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
        ref={mapRef}
        initialViewState={{
          longitude: 106.8272,
          latitude: -6.1751,
          zoom: 12,
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* ── Route polyline rendered from OSRM GeoJSON ─────────── */}
        {routeGeoJson && (
          <Source id="route-source" type="geojson" data={routeGeoJson}>
            {/* Casing (border) layer for contrast */}
            <Layer
              id="route-layer-casing"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 8,
                'line-opacity': 0.8,
              }}
            />
            {/* Main route line */}
            <Layer
              id="route-layer"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': '#1D4ED8',
                'line-width': 5,
                'line-opacity': 0.95,
              }}
            />
          </Source>
        )}

        {/* ── Origin marker (green) ──────────────────────────────── */}
        {origin && (
          <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
            <div className="flex flex-col items-center drop-shadow-lg">
              <div
                className="flex items-center justify-center bg-emerald-500 text-white rounded-full p-1.5 border-2 border-white"
                title={origin.label}
              >
                <Navigation className="size-3.5" />
              </div>
              <div className="w-0.5 h-2 bg-emerald-500" />
            </div>
          </Marker>
        )}

        {/* ── Destination marker (red) ───────────────────────────── */}
        {destination && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="flex flex-col items-center drop-shadow-lg">
              <div
                className="flex items-center justify-center bg-red-500 text-white rounded-full p-1.5 border-2 border-white"
                title={destination.label}
              >
                <MapPin className="size-3.5" />
              </div>
              <div className="w-0.5 h-2 bg-red-500" />
            </div>
          </Marker>
        )}

        {/* Markers and overlays passed as children */}
        {children}
      </Map>

      {/* ── Legend — shown only when a route is active ─────────── */}
      {routeGeometry && (origin || destination) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-[#E2E8F0] rounded-full px-4 py-2 shadow-md text-xs text-[#475569] pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
            Asal
          </span>
          <span className="w-6 border-t-2 border-dashed border-[#1D4ED8]" />
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-red-500" />
            Tujuan
          </span>
        </div>
      )}
    </div>
  );
}
