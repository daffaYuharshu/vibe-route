"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, LayoutGrid, List } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";
import { PlaceCard } from "@/components/PlaceCard";
import { usePlaces } from "@/hooks/usePlaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { FoursquarePlace } from "@/lib/foursquare";

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

// Jakarta center
const CENTER_LAT = -6.1751;
const CENTER_LNG = 106.8272;

export default function PlacesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<FoursquarePlace | null>(null);
  const { places, isLoading, error, searchPlaces, clearPlaces } = usePlaces();

  const triggerSearch = (q: string) => {
    if (q.trim()) searchPlaces(q.trim(), CENTER_LAT, CENTER_LNG);
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

  const sidebar = (
    <div className="flex flex-col gap-0">
      {/* Search */}
      <form onSubmit={handleSearch} className="p-4 border-b border-[#E2E8F0] flex gap-2">
        <div className="flex-1">
          <label htmlFor="places-search" className="sr-only">
            Cari tempat
          </label>
          <Input
            id="places-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nama tempat atau kategori…"
            className="h-9 text-sm border-[#E2E8F0] bg-white"
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
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      {/* Category filters */}
      <div
        className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-[#E2E8F0]"
        role="group"
        aria-label="Filter kategori"
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

      {/* Results count */}
      {places.length > 0 && !isLoading && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">
            {places.length} tempat ditemukan
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-[#94A3B8] hover:text-[#475569] tap-sm"
            onClick={() => { clearPlaces(); setQuery(""); setActiveCategory(""); }}
          >
            Hapus
          </Button>
        </div>
      )}

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
              <LayoutGrid className="size-7 text-[#1D4ED8]" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">Eksplorasi Tempat</p>
            <p className="text-xs text-[#475569]">
              Pilih kategori atau ketik pencarian untuk menemukan tempat
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-2" aria-label="Memuat tempat…" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading &&
          places.map((place) => (
            <PlaceCard
              key={place.fsq_id}
              place={place}
              onRoute={setSelectedPlace}
            />
          ))}
      </div>

      {/* Selected place banner */}
      {selectedPlace && (
        <div className="border-t border-[#E2E8F0] p-4 bg-[#DBEAFE] shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1D4ED8]">Dipilih:</p>
              <p className="text-sm font-medium text-[#0F172A] truncate">{selectedPlace.name}</p>
              {selectedPlace.location.formatted_address && (
                <p className="text-xs text-[#475569] truncate mt-0.5">
                  {selectedPlace.location.formatted_address}
                </p>
              )}
            </div>
            <button
              className="shrink-0 text-xs text-[#475569] underline tap-sm"
              onClick={() => setSelectedPlace(null)}
              aria-label="Batalkan pilihan tempat"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppShell sidebar={sidebar} pageTitle="Tempat">
      <MapView />
    </AppShell>
  );
}
