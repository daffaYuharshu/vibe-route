"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, MapPin, MessageCircle, ChevronUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";
import { PlaceCard } from "@/components/PlaceCard";
import { AssistantPanel } from "@/components/AssistantPanel";
import { SearchBox } from "@/components/SearchBox";
import { usePlaces } from "@/hooks/usePlaces";
import { useLocationStore } from "@/store/locationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { FoursquarePlace } from "@/lib/foursquare";

export default function Home() {
  const [query, setQuery] = useState("");
  const { places, isLoading, error, searchPlaces, clearPlaces } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<FoursquarePlace | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Global location state from Zustand
  const { origin, setOrigin } = useLocationStore();

  // Default center: Jakarta (or from stored origin)
  const centerLat = origin?.lat ?? -6.1751;
  const centerLng = origin?.lng ?? 106.8272;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) searchPlaces(query.trim(), centerLat, centerLng);
  };

  const locationContext = {
    lat: centerLat,
    lng: centerLng,
    places: places.length > 0 ? places : undefined,
  };

  const sidebar = (
    <>
      {/* Location SearchBox — sets global origin */}
      <div className="p-4 border-b border-[#E2E8F0]">
        <SearchBox
          id="home-location"
          label="Lokasi Saya"
          value={origin}
          onChange={setOrigin}
          placeholder="Set lokasi kamu…"
          showGeolocate
        />
      </div>

      <Separator />

      {/* Place search form */}
      <form onSubmit={handleSearch} className="p-4 border-b border-[#E2E8F0] flex gap-2">
        <div className="flex-1">
          <label htmlFor="place-search" className="sr-only">
            Cari tempat
          </label>
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
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && places.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#DBEAFE]">
              <MapPin className="size-7 text-[#1D4ED8]" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">Temukan tempat di sekitar Anda</p>
            <p className="text-xs text-[#475569]">
              {origin ? `Mencari di sekitar ${origin.label}` : "Set lokasi atau ketik kata kunci"}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-2" aria-label="Memuat tempat…" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading &&
          places.map((place) => (
            <PlaceCard key={place.fsq_id} place={place} onRoute={setSelectedPlace} />
          ))}

        {places.length > 0 && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] h-9"
            onClick={() => {
              clearPlaces();
              setQuery("");
            }}
          >
            Hapus hasil
          </Button>
        )}
      </div>

      {/* Selected route banner */}
      {selectedPlace && (
        <div className="border-t border-[#E2E8F0] p-4 bg-[#DBEAFE] shrink-0">
          <p className="text-xs font-semibold text-[#1D4ED8] mb-0.5">Rute ke:</p>
          <p className="text-sm font-medium text-[#0F172A] truncate">{selectedPlace.name}</p>
          <button
            className="mt-1 text-xs text-[#475569] underline tap-sm"
            onClick={() => setSelectedPlace(null)}
            aria-label="Batalkan pilihan rute"
          >
            Batalkan
          </button>
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
    </>
  );

  return (
    <AppShell sidebar={sidebar} pageTitle="Eksplorasi">
      <MapView />
    </AppShell>
  );
}
