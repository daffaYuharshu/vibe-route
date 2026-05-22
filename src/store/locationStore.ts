import { create } from 'zustand';

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string; // human-readable place name
}

interface LocationState {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  setOrigin: (point: GeoPoint | null) => void;
  setDestination: (point: GeoPoint | null) => void;
  clearAll: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  origin: null,
  destination: null,
  setOrigin: (point) => set({ origin: point }),
  setDestination: (point) => set({ destination: point }),
  clearAll: () => set({ origin: null, destination: null }),
}));
