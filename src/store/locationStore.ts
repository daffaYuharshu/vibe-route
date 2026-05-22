import { create } from 'zustand';
import type { FoursquarePlace } from '@/lib/foursquare';

/* ── Shared Types ────────────────────────────────── */

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string; // human-readable place name
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  geometry: GeoJSON.LineString;
  originLabel: string;
  destinationLabel: string;
}

/* ── Store Shape ─────────────────────────────────── */

interface AppState {
  // ── Location ──
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  setOrigin: (point: GeoPoint | null) => void;
  setDestination: (point: GeoPoint | null) => void;

  // ── Active Route ──
  activeRoute: RouteResult | null;
  setActiveRoute: (route: RouteResult | null) => void;

  // ── Places ──
  places: FoursquarePlace[];
  setPlaces: (places: FoursquarePlace[]) => void;
  clearPlaces: () => void;

  // ── Reset all ──
  clearAll: () => void;
}

/* ── Store ───────────────────────────────────────── */

export const useAppStore = create<AppState>((set) => ({
  // Location
  origin: null,
  destination: null,
  setOrigin: (point) => set({ origin: point }),
  setDestination: (point) => set({ destination: point }),

  // Active Route
  activeRoute: null,
  setActiveRoute: (route) => set({ activeRoute: route }),

  // Places
  places: [],
  setPlaces: (places) => set({ places }),
  clearPlaces: () => set({ places: [] }),

  // Reset
  clearAll: () =>
    set({ origin: null, destination: null, activeRoute: null, places: [] }),
}));

/* ── Backwards-compat re-export (used by SearchBox, etc.) ── */
export const useLocationStore = useAppStore;
