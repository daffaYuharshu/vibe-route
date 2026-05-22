"use client";

import { AlertCircle, ArrowRight, Navigation, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/locationStore";
import { useRoute } from "@/hooks/useRoute";

export default function RoutePage() {
  const { origin, destination, setOrigin, setDestination } = useAppStore();
  const { result, isLoading, error, calculateRoute, clearRoute } = useRoute();

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    await calculateRoute(origin, destination);
  };

  const sidebar = (
    <div className="flex flex-col gap-0">
      <form onSubmit={handleCalculate} className="p-4 flex flex-col gap-4">
        <SearchBox
          id="route-origin"
          label="Titik Asal"
          value={origin}
          onChange={(pt) => { setOrigin(pt); clearRoute(); }}
          placeholder="Cari lokasi asal…"
          showGeolocate
        />

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <ArrowRight className="size-4 text-[#94A3B8] shrink-0" aria-hidden="true" />
          <Separator className="flex-1" />
        </div>

        <SearchBox
          id="route-destination"
          label="Titik Tujuan"
          value={destination}
          onChange={(pt) => { setDestination(pt); clearRoute(); }}
          placeholder="Cari lokasi tujuan…"
        />

        <Button
          type="submit"
          id="btn-calculate-route"
          disabled={isLoading || !origin || !destination}
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

      {error && (
        <div
          role="alert"
          className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {result && !isLoading && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <Separator />
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Hasil Rute</h2>
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
              {result.originLabel} → {result.destinationLabel}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">
                Jarak
              </p>
              <p className="text-lg font-bold text-[#0F172A] mt-0.5">
                {result.distanceKm.toFixed(1)}{" "}
                <span className="text-sm font-normal text-[#475569]">km</span>
              </p>
            </Card>
            <Card className="p-3 border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">
                Estimasi
              </p>
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
