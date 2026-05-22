"use client";

import { useState, useCallback } from 'react';
import type { FoursquarePlace } from '@/lib/foursquare';

interface UsePlacesReturn {
  places: FoursquarePlace[];
  isLoading: boolean;
  error: string | null;
  searchPlaces: (query: string, lat: number, lng: number) => Promise<void>;
  clearPlaces: () => void;
}

export function usePlaces(): UsePlacesReturn {
  const [places, setPlaces] = useState<FoursquarePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (query: string, lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        lat: String(lat),
        lng: String(lng),
        radius: '2000',
        limit: '10',
      });

      const res = await fetch(`/api/places?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data tempat');
      }

      setPlaces(data.places ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPlaces = useCallback(() => {
    setPlaces([]);
    setError(null);
  }, []);

  return { places, isLoading, error, searchPlaces, clearPlaces };
}
