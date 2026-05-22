"use client";

import { useState, useCallback } from 'react';
import { useAppStore, type RouteResult } from '@/store/locationStore';
import type { GeoPoint } from '@/store/locationStore';

interface UseRouteReturn {
  result: RouteResult | null;
  isLoading: boolean;
  error: string | null;
  calculateRoute: (origin: GeoPoint, destination: GeoPoint) => Promise<void>;
  clearRoute: () => void;
}

/**
 * Hook for calculating routes via the /api/route proxy (OSRM under the hood).
 * Writes the result to the global Zustand store (activeRoute).
 */
export function useRoute(): UseRouteReturn {
  const { activeRoute, setActiveRoute } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(
    async (origin: GeoPoint, destination: GeoPoint) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          originLat: String(origin.lat),
          originLng: String(origin.lng),
          destLat: String(destination.lat),
          destLng: String(destination.lng),
        });

        const res = await fetch(`/api/route?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Gagal menghitung rute');
        }

        const route: RouteResult = {
          distanceKm: data.distanceKm,
          durationMin: data.durationMin,
          geometry: data.geometry,
          originLabel: origin.label,
          destinationLabel: destination.label,
        };

        setActiveRoute(route);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setActiveRoute(null);
      } finally {
        setIsLoading(false);
      }
    },
    [setActiveRoute]
  );

  const clearRoute = useCallback(() => {
    setActiveRoute(null);
    setError(null);
  }, [setActiveRoute]);

  return {
    result: activeRoute,
    isLoading,
    error,
    calculateRoute,
    clearRoute,
  };
}
