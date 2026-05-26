"use client";

import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";
import { PlaceCard } from "@/components/PlaceCard";
import { usePlaces } from "@/hooks/usePlaces";
import { useRoute } from "@/hooks/useRoute";
import { useAppStore } from "@/store/locationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlaceListSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/ui/states";
import type { FoursquarePlace } from "@/lib/foursquare";
import type { GeoPoint } from "@/store/locationStore";

// Preset category filters
const CATEGORIES = [
  { label: "Semua", query: "" },
  { label: "☕ Kafe", query: "kafe" },
  { label: "🍜 Restoran", query: "restoran" },
  { label: "🏨 Hotel", query: "hotel" },
  { label: "🏥 Kesehatan", query: "rumah sakit" },
  { label: "🛍️ Belanja", query: "mall" },
  { label: "🎭 Hiburan", query: "hiburan" },
  { label: "⛽ SPBU", query: "SPBU" },
] as const;

export default function PlacesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  // Global state
  const { origin, destination, setDestination } = useAppStore();

  // Places search
  const { places, isLoading, error, searchPlaces, clearPlaces } = usePlaces();

  // In-page route calculation
  const { result: routeResult, isLoading: isRoutingLoading, error: routeError, calculateRoute, clearRoute } = useRoute();

  // Default search center: user's origin or Jakarta
  const centerLat = origin?.lat ?? -6.1751;
  const centerLng = origin?.lng ?? 106.8272;

  const triggerSearch = (q: string) => {
    if (q.trim()) searchPlaces(q.trim(), centerLat, centerLng);
    else clearPlaces();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCategory("");
    triggerSearch(query);
  };

  const handleCategory = (cat: { label: string; query: string }) => {
    setActiveCategory(cat.query);
    setQuery(cat.query);
    triggerSearch(cat.query);
  };

  /** Called when user clicks "Buat Rute ke Sini" on a PlaceCard */
  const handleRouteToPlace = async (place: FoursquarePlace) => {
    if (!origin) return;
    const dest: GeoPoint = {
      lat: place.geocodes.main.latitude,
      lng: place.geocodes.main.longitude,
      label: place.name,
    };
    setDestination(dest);
    await calculateRoute(origin, dest);
  };

  const handleClearRoute = () => {
    clearRoute();
    setDestination(null);
  };

  const sidebar = (
    <div className="flex flex-col gap-0 animate-fade-in">
      {/* Page heading (h1) — visually hidden but accessible */}
      <h1 className="sr-only">Eksplorasi Tempat</h1>

      {/* Origin hint when not set */}
      {!origin && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          <p className="text-xs text-amber-700">
            ⚠ Set lokasi di menu Eksplorasi untuk mengaktifkan Buat Rute
          </p>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="p-4 border-b border-[#E2E8F0] flex gap-2">
        <div className="flex-1">
          <label htmlFor="places-search" className="sr-only">Cari tempat</label>
          <Input
            id="places-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nama tempat atau kategori…"
            className="h-9 text-sm border-[#E2E8F0] bg-white focus-visible:ring-[#1D4ED8]"
          />
        </div>
        <Button
          type="submit"
          id="btn-search-places-page"
          disabled={isLoading || !query.trim()}
          className="bg-[#1D4ED8] text-white hover:bg-[#1E40AF] rounded-lg h-9 px-3 shrink-0"
          aria-label="Cari tempat"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-white" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      {/* Category filters */}
      <div
        className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-[#E2E8F0]"
        role="group"
        aria-label="Filter kategori tempat"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.query;
          return (
            <button
              key={cat.label}
              onClick={() => handleCategory(cat)}
              className={`tap-sm inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#1D4ED8] text-white"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#DBEAFE] hover:text-[#1D4ED8]"
              }`}
              aria-pressed={isActive}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results count bar */}
      {places.length > 0 && !isLoading && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">
            {places.length} tempat ditemukan
            {origin && <span className="text-[#94A3B8]"> · dekat {origin.label}</span>}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-[#94A3B8] hover:text-[#475569] tap-sm"
            onClick={() => { clearPlaces(); setQuery(""); setActiveCategory(""); handleClearRoute(); }}
          >
            Hapus
          </Button>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {error && !isLoading && (
          <ErrorState message={error} onRetry={() => triggerSearch(query)} />
        )}
        {!isLoading && !error && places.length === 0 && (
          <EmptyState
            variant="places"
            title="Eksplorasi Tempat"
            description="Pilih kategori atau ketik pencarian untuk menemukan tempat di sekitar Anda"
          />
        )}
        {isLoading && <PlaceListSkeleton count={4} />}

        {/* Place cards — Buat Rute only visible when origin is set */}
        {!isLoading &&
          places.map((place) => (
            <PlaceCard
              key={place.fsq_id}
              place={place}
              onRoute={origin ? handleRouteToPlace : undefined}
              isRoutingLoading={isRoutingLoading && destination?.label === place.name}
            />
          ))}
      </div>

      {/* ── Route result panel ─────────────────────────── */}
      {(routeResult || isRoutingLoading || routeError) && (
        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0 p-4">
          {isRoutingLoading && (
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <Loader2 className="size-4 animate-spin text-[#1D4ED8]" />
              Menghitung rute…
            </div>
          )}
          {routeError && !isRoutingLoading && (
            <p className="text-xs text-red-500">{routeError}</p>
          )}
          {routeResult && !isRoutingLoading && (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-[#1D4ED8] uppercase tracking-wide">Rute ke</p>
                  <p className="text-sm font-medium text-[#0F172A] line-clamp-1">{routeResult.destinationLabel}</p>
                </div>
                <button
                  onClick={handleClearRoute}
                  className="text-[#94A3B8] hover:text-[#475569] transition-colors"
                  aria-label="Hapus rute"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-2 text-center">
                  <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Jarak</p>
                  <p className="text-base font-bold text-[#0F172A]">
                    {routeResult.distanceKm.toFixed(1)}{" "}
                    <span className="text-xs font-normal text-[#475569]">km</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-2 text-center">
                  <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Estimasi</p>
                  <p className="text-base font-bold text-[#0F172A]">
                    {Math.round(routeResult.durationMin)}{" "}
                    <span className="text-xs font-normal text-[#475569]">menit</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <AppShell sidebar={sidebar} pageTitle="Tempat">
      <MapView
        routeGeometry={routeResult?.geometry ?? null}
        origin={origin}
        destination={destination}
      />
    </AppShell>
  );
}
