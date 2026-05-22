"use client";

import { useState, useRef } from 'react';
import { Search, Loader2, AlertCircle, MapPin, MessageCircle, ChevronUp } from 'lucide-react';
import { MapView } from "@/components/MapView";
import { PlaceCard } from "@/components/PlaceCard";
import { AssistantPanel } from "@/components/AssistantPanel";
import { usePlaces } from "@/hooks/usePlaces";
import { Button } from '@/components/ui/button';
import type { FoursquarePlace } from '@/lib/foursquare';

export default function Home() {
  const [query, setQuery] = useState('');
  const { places, isLoading, error, searchPlaces, clearPlaces } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<FoursquarePlace | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default center: Jakarta
  const centerLat = -6.1751;
  const centerLng = 106.8272;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchPlaces(query.trim(), centerLat, centerLng);
    }
  };

  const handleRoute = (place: FoursquarePlace) => {
    setSelectedPlace(place);
  };

  // Location context to send to Gemini
  const locationContext = {
    lat: centerLat,
    lng: centerLng,
    places: places.length > 0 ? places : undefined,
  };

  return (
    <main className="flex h-screen w-full flex-col md:flex-row bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className="w-full md:w-[320px] h-auto md:h-full border-r border-border bg-white flex-shrink-0 z-10 flex flex-col"
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] leading-tight">
              Vibe Route
            </h1>
            <p className="text-xs text-[#475569] mt-0.5">
              Eksplorasi tempat &amp; rute perjalanan
            </p>
          </div>
          {/* AI Assistant toggle button */}
          <button
            id="btn-toggle-chat"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isChatOpen
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE]'
            }`}
            aria-label={isChatOpen ? 'Tutup asisten AI' : 'Buka asisten AI'}
            aria-expanded={isChatOpen}
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            <span>Asisten</span>
            <ChevronUp
              className={`size-3 transition-transform ${isChatOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-4 border-b border-border flex gap-2">
          <div className="flex-1 relative">
            <label htmlFor="place-search" className="sr-only">
              Cari tempat
            </label>
            <input
              id="place-search"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tempat, mis. kopi, restoran…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-0"
            />
          </div>
          <Button
            type="submit"
            id="btn-search-places"
            disabled={isLoading || !query.trim()}
            className="bg-[#1D4ED8] text-white hover:bg-[#1E40AF] rounded-lg px-3 h-9"
            aria-label="Cari tempat"
          >
            {isLoading
              ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : <Search className="size-4" aria-hidden="true" />
            }
          </Button>
        </form>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {/* Error State */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && places.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#DBEAFE]">
                <MapPin className="size-7 text-[#1D4ED8]" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-[#0F172A]">Temukan tempat di sekitar Anda</p>
              <p className="text-xs text-[#475569]">Ketik kata kunci dan tekan cari</p>
            </div>
          )}

          {/* Skeleton Loading */}
          {isLoading && (
            <div className="flex flex-col gap-2" aria-label="Memuat tempat…" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-border bg-[#E2E8F0] animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Place Cards */}
          {!isLoading && places.map((place) => (
            <PlaceCard
              key={place.fsq_id}
              place={place}
              onRoute={handleRoute}
            />
          ))}

          {/* Clear results button */}
          {places.length > 0 && !isLoading && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full border-border text-[#475569] hover:text-[#0F172A]"
              onClick={() => { clearPlaces(); setQuery(''); }}
            >
              Hapus hasil
            </Button>
          )}
        </div>

        {/* Selected place for routing info */}
        {selectedPlace && (
          <div className="border-t border-border p-4 bg-[#DBEAFE]">
            <p className="text-xs font-semibold text-[#1D4ED8] mb-0.5">Rute ke:</p>
            <p className="text-sm font-medium text-[#0F172A] truncate">{selectedPlace.name}</p>
            <button
              className="mt-1 text-xs text-[#475569] underline"
              onClick={() => setSelectedPlace(null)}
              aria-label="Batalkan pilihan rute"
            >
              Batalkan
            </button>
          </div>
        )}

        {/* AI Assistant Panel */}
        <AssistantPanel
          locationContext={locationContext}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </aside>

      {/* ── Map ── */}
      <section className="flex-1 h-full w-full relative" aria-label="Peta interaktif">
        <MapView />
      </section>
    </main>
  );
}
