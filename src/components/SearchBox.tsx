"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import { Search, LocateFixed, Loader2, X, MapPin } from "lucide-react";
import type { GeoPoint } from "@/store/locationStore";

/* ── MapTiler GeoJSON feature type ─────────────── */
interface GeoFeature {
  id: string;
  type: "Feature";
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

interface SearchBoxProps {
  /** Label shown above the input (and used for aria-label) */
  label: string;
  /** Currently selected location */
  value: GeoPoint | null;
  /** Called when user picks a suggestion or clears */
  onChange: (point: GeoPoint | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show "use my location" button */
  showGeolocate?: boolean;
  /** id for the input element */
  id?: string;
}

const DEBOUNCE_MS = 350;

export function SearchBox({
  label,
  value,
  onChange,
  placeholder = "Cari lokasi…",
  showGeolocate = false,
  id,
}: SearchBoxProps) {
  const [inputText, setInputText] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const inputId = id ?? listId + "-input";

  // Sync external value → input text
  useEffect(() => {
    setInputText(value?.label ?? "");
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      const features: GeoFeature[] = data.features ?? [];
      setSuggestions(features);
      setIsOpen(features.length > 0);
      setActiveIdx(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (value) onChange(null); // clear selection when typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS);
  };

  const handleSelect = (feature: GeoFeature) => {
    const [lng, lat] = feature.center;
    const point: GeoPoint = { lat, lng, label: feature.place_name };
    onChange(point);
    setInputText(feature.place_name);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setInputText("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode to get label
        try {
          const res = await fetch(
            `/api/geocode?q=${lat},${lng}&proximity=${lng},${lat}`
          );
          const data = await res.json();
          const label =
            data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          const point: GeoPoint = { lat, lng, label };
          onChange(point);
          setInputText(label);
        } catch {
          const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onChange({ lat, lng, label });
          setInputText(label);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIdx >= 0) handleSelect(suggestions[activeIdx]);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-xs font-medium text-[#0F172A] mb-1"
      >
        {label}
      </label>

      {/* Input row */}
      <div className="relative flex items-center">
        {/* Search icon / loading */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="size-4 text-[#94A3B8] animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4 text-[#94A3B8]" aria-hidden="true" />
          )}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 pl-9 pr-9 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-0 transition-shadow"
        />

        {/* Clear / geolocate button */}
        <div className="absolute right-2 flex items-center gap-0.5">
          {inputText && (
            <button
              type="button"
              onClick={handleClear}
              className="tap-sm flex items-center justify-center size-6 rounded text-[#94A3B8] hover:text-[#475569] transition-colors"
              aria-label="Hapus lokasi"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
          {showGeolocate && (
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={isLocating}
              className="tap-sm flex items-center justify-center size-6 rounded text-[#94A3B8] hover:text-[#1D4ED8] transition-colors disabled:opacity-50"
              aria-label="Gunakan lokasi saya"
              title="Gunakan lokasi saya"
            >
              {isLocating ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LocateFixed className="size-3.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Suggestion dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`Saran lokasi untuk ${label}`}
          className="absolute z-50 top-full mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white shadow-lg overflow-hidden"
        >
          {suggestions.map((feature, idx) => {
            const isActive = idx === activeIdx;
            return (
              <li
                key={feature.id}
                id={`${listId}-opt-${idx}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click
                  handleSelect(feature);
                }}
                className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                  isActive
                    ? "bg-[#DBEAFE] text-[#1D4ED8]"
                    : "hover:bg-[#F8FAFC] text-[#0F172A]"
                }`}
              >
                <MapPin
                  className={`mt-0.5 size-3.5 shrink-0 ${isActive ? "text-[#1D4ED8]" : "text-[#94A3B8]"}`}
                  aria-hidden="true"
                />
                <span className="line-clamp-2 leading-snug">{feature.place_name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
