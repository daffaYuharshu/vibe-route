"use client";

import { useState } from "react";
import { Search, Loader2, MessageCircle, ChevronUp, X, Navigation } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";
import { PlaceCard } from "@/components/PlaceCard";
import { AssistantPanel } from "@/components/AssistantPanel";
import { SearchBox } from "@/components/SearchBox";
import { usePlaces } from "@/hooks/usePlaces";
import { useRoute } from "@/hooks/useRoute";
import { useAppStore, useLocationStore } from "@/store/locationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PlaceListSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import type { FoursquarePlace } from "@/lib/foursquare";
import type { GeoPoint } from "@/store/locationStore";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Global location state
  const { origin, setOrigin } = useLocationStore();
  const { destination, setDestination } = useAppStore();

  // Places search
  const { places, isLoading, error, searchPlaces, clearPlaces } = usePlaces();

  // In-page route calculation
  const { result: routeResult, isLoading: isRoutingLoading, error: routeError, calculateRoute, clearRoute } = useRoute();

  const centerLat = origin?.lat ?? -6.1751;
  const centerLng = origin?.lng ?? 106.8272;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) searchPlaces(query.trim(), centerLat, centerLng);
  };

  /** Called when user clicks "Buat Rute ke Sini" on a PlaceCard */
  const handleRouteToPlace = async (place: FoursquarePlace) => {
    if (!origin) return; // button is disabled when no origin — but guard anyway
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

  const locationContext = {
    lat: centerLat,
    lng: centerLng,
    places: places.length > 0 ? places : undefined,
  };

  const sidebar = (
    <div className="flex flex-col h-full animate-fade-in">
      {/* h1 — accessible page title, visually hidden */}
      <h1 className="sr-only">Eksplorasi — Vibe Route</h1>

      {/* Location SearchBox — sets global origin */}
      <div className="p-4 border-b border-[#E2E8F0]">
        <SearchBox
          id="home-location"
          label="Lokasi Saya"
          value={origin}
          onChange={(pt) => { setOrigin(pt); handleClearRoute(); }}
          placeholder="Set lokasi kamu…"
          showGeolocate
        />
        {!origin && (
          <p className="mt-1.5 text-[10px] text-[#94A3B8]">
            ⚠ Set lokasi untuk mengaktifkan fitur Buat Rute
          </p>
        )}
      </div>

      <Separator />

      {/* Place search form */}
      <form onSubmit={handleSearch} className="p-4 border-b border-[#E2E8F0] flex gap-2">
        <div className="flex-1">
          <label htmlFor="place-search" className="sr-only">Cari tempat</label>
          <Input
            id="place-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tempat, mis. kopi, restoran…"
            className="h-9 text-sm border-[#E2E8F0] bg-white focus-visible:ring-[#1D4ED8]"
          />
        </div>
        <Button
          type="submit"
          id="btn-search-places"
          disabled={isLoading || !query.trim()}
          className="bg-[#1D4ED8] text-white hover:bg-[#1E40AF] rounded-lg h-9 px-3 shrink-0"
          aria-label="Cari tempat"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {error && !isLoading && (
          <ErrorState message={error} onRetry={() => query.trim() && searchPlaces(query.trim(), centerLat, centerLng)} />
        )}
        {!isLoading && !error && places.length === 0 && (
          <EmptyState
            variant="search"
            title="Temukan tempat di sekitar Anda"
            description={origin ? `Mencari di sekitar ${origin.label}` : "Set lokasi atau ketik kata kunci"}
          />
        )}
        {isLoading && <PlaceListSkeleton count={3} />}

        {/* Place cards — onRoute only active when origin is set */}
        {!isLoading &&
          places.map((place) => (
            <PlaceCard
              key={place.fsq_id}
              place={place}
              onRoute={origin ? handleRouteToPlace : undefined}
              isRoutingLoading={isRoutingLoading && destination?.label === place.name}
            />
          ))}

        {places.length > 0 && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] h-9"
            onClick={() => { clearPlaces(); setQuery(""); }}
          >
            Hapus hasil
          </Button>
        )}
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

      {/* AI Assistant */}
      <div className="border-t border-[#E2E8F0] shrink-0">
        {!isChatOpen && (
          <button
            id="btn-toggle-chat"
            onClick={() => setIsChatOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-[#1D4ED8] hover:bg-[#DBEAFE] transition-colors tap-sm"
            aria-expanded={false}
            aria-label="Buka asisten AI"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="size-4" aria-hidden="true" />
              Asisten Perjalanan AI
            </span>
            <ChevronUp className="size-3.5 rotate-180" aria-hidden="true" />
          </button>
        )}
        <AssistantPanel
          locationContext={locationContext}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );

  return (
    <AppShell sidebar={sidebar} pageTitle="Eksplorasi">
      <MapView
        routeGeometry={routeResult?.geometry ?? null}
        origin={origin}
        destination={destination}
      />
    </AppShell>
  );
}
