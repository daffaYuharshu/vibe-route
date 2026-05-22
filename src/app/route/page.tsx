"use client";

import { useState } from "react";
import { Navigation, Loader2, AlertCircle, LocateFixed, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RouteStep {
  distance: number;
  duration: number;
  instruction?: string;
}

interface RouteResult {
  distanceKm: number;
  durationMin: number;
  steps: RouteStep[];
  geometry: GeoJSON.LineString;
}

const OSRM_BASE = process.env.NEXT_PUBLIC_OSRM_BASE_URL ?? "https://router.project-osrm.org";

async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Tidak ada rute ditemukan");
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    steps: (route.legs?.[0]?.steps ?? []).map((s: { distance: number; duration: number }) => ({
      distance: s.distance,
      duration: s.duration,
    })),
    geometry: route.geometry as GeoJSON.LineString,
  };
}

export default function RoutePage() {
  const [originLat, setOriginLat] = useState("");
  const [originLng, setOriginLng] = useState("");
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser Anda tidak mendukung geolokasi.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginLat(pos.coords.latitude.toFixed(6));
        setOriginLng(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      () => {
        setError("Gagal mendapatkan lokasi Anda.");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if ([oLat, oLng, dLat, dLng].some(isNaN)) {
      setError("Pastikan semua koordinat diisi dengan benar.");
      return;
    }

    setIsLoading(true);
    try {
      const route = await fetchRoute(oLat, oLng, dLat, dLng);
      setResult(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const sidebar = (
    <div className="flex flex-col gap-0">
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        {/* Origin */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold text-[#0F172A] mb-1">Titik Asal</legend>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="origin-lat" className="text-[10px] text-[#64748B] font-medium">
                Latitude
              </label>
              <Input
                id="origin-lat"
                type="number"
                step="any"
                value={originLat}
                onChange={(e) => setOriginLat(e.target.value)}
                placeholder="-6.1751"
                className="h-9 text-sm border-[#E2E8F0]"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="origin-lng" className="text-[10px] text-[#64748B] font-medium">
                Longitude
              </label>
              <Input
                id="origin-lng"
                type="number"
                step="any"
                value={originLng}
                onChange={(e) => setOriginLng(e.target.value)}
                placeholder="106.8272"
                className="h-9 text-sm border-[#E2E8F0]"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] gap-1.5"
            onClick={useMyLocation}
            disabled={isLocating}
            aria-label="Gunakan lokasi saya saat ini sebagai titik asal"
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="size-3.5" aria-hidden="true" />
            )}
            Gunakan lokasi saya
          </Button>
        </fieldset>

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <ArrowRight className="size-4 text-[#94A3B8] shrink-0" aria-hidden="true" />
          <Separator className="flex-1" />
        </div>

        {/* Destination */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold text-[#0F172A] mb-1">Titik Tujuan</legend>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="dest-lat" className="text-[10px] text-[#64748B] font-medium">
                Latitude
              </label>
              <Input
                id="dest-lat"
                type="number"
                step="any"
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                placeholder="-6.2000"
                className="h-9 text-sm border-[#E2E8F0]"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="dest-lng" className="text-[10px] text-[#64748B] font-medium">
                Longitude
              </label>
              <Input
                id="dest-lng"
                type="number"
                step="any"
                value={destLng}
                onChange={(e) => setDestLng(e.target.value)}
                placeholder="106.8166"
                className="h-9 text-sm border-[#E2E8F0]"
              />
            </div>
          </div>
        </fieldset>

        <Button
          type="submit"
          id="btn-calculate-route"
          disabled={isLoading}
          className="w-full bg-[#1D4ED8] text-white hover:bg-[#1E40AF] h-10 text-sm font-medium gap-2"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Navigation className="size-4" aria-hidden="true" />
          )}
          {isLoading ? "Menghitung rute…" : "Hitung Rute"}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <Separator />
          <h2 className="text-sm font-semibold text-[#0F172A]">Hasil Rute</h2>
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Jarak</p>
              <p className="text-lg font-bold text-[#0F172A] mt-0.5">
                {result.distanceKm.toFixed(1)}{" "}
                <span className="text-sm font-normal text-[#475569]">km</span>
              </p>
            </Card>
            <Card className="p-3 border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Estimasi</p>
              <p className="text-lg font-bold text-[#0F172A] mt-0.5">
                {Math.round(result.durationMin)}{" "}
                <span className="text-sm font-normal text-[#475569]">menit</span>
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppShell sidebar={sidebar} pageTitle="Rute">
      <MapView routeGeometry={result?.geometry ?? null} />
    </AppShell>
  );
}
