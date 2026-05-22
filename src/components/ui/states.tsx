"use client";

import { AlertCircle, RefreshCw, MapPin, Navigation, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────
   SKELETON COMPONENTS
   ───────────────────────────────────────────────────── */

/** Single place card skeleton */
export function PlaceCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-md bg-[#E2E8F0] shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3.5 w-2/3 rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/3 rounded bg-[#E2E8F0]" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-[#E2E8F0]" />
      <div className="h-3 w-3/4 rounded bg-[#E2E8F0]" />
      <div className="flex justify-between mt-1">
        <div className="h-3 w-10 rounded bg-[#E2E8F0]" />
        <div className="h-3 w-12 rounded bg-[#E2E8F0]" />
      </div>
      <div className="h-8 w-full rounded-lg bg-[#E2E8F0] mt-1" />
    </div>
  );
}

/** List of place card skeletons */
export function PlaceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-label="Memuat daftar tempat…"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PlaceCardSkeleton key={i} />
      ))}
      <span className="sr-only">Memuat…</span>
    </div>
  );
}

/** Route result skeleton */
export function RouteSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 animate-pulse"
      role="status"
      aria-label="Menghitung rute…"
      aria-busy="true"
    >
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <div className="h-2.5 w-14 rounded bg-[#E2E8F0]" />
            <div className="h-6 w-20 rounded bg-[#E2E8F0] mt-2" />
          </div>
        ))}
      </div>
      <span className="sr-only">Menghitung rute…</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   EMPTY STATE COMPONENTS
   ───────────────────────────────────────────────────── */

interface EmptyStateProps {
  title: string;
  description: string;
  variant?: "places" | "route" | "search";
}

/** Inline SVG icons for empty state — flat, no gradients */
const EmptyIllustration = ({ variant }: { variant: EmptyStateProps["variant"] }) => {
  if (variant === "route") {
    return (
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden="true"
        className="mx-auto"
      >
        <circle cx="28" cy="28" r="28" fill="#DBEAFE" />
        <path
          d="M18 38 Q28 20 38 28"
          stroke="#1D4ED8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="18" cy="38" r="3" fill="#1D4ED8" />
        <circle cx="38" cy="28" r="3" fill="#1D4ED8" />
        <circle cx="28" cy="20" r="2" fill="#93C5FD" />
      </svg>
    );
  }

  if (variant === "search") {
    return (
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden="true"
        className="mx-auto"
      >
        <circle cx="28" cy="28" r="28" fill="#DBEAFE" />
        <circle cx="26" cy="25" r="8" stroke="#1D4ED8" strokeWidth="2.5" />
        <path d="M32 31l6 6" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Default: places
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      <circle cx="28" cy="28" r="28" fill="#DBEAFE" />
      <path
        d="M28 16c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9z"
        fill="#93C5FD"
        stroke="#1D4ED8"
        strokeWidth="2"
      />
      <circle cx="28" cy="25" r="3" fill="#1D4ED8" />
    </svg>
  );
};

export function EmptyState({ title, description, variant = "places" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-4">
      <EmptyIllustration variant={variant} />
      <div>
        <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
        <p className="text-xs text-[#475569] mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   ERROR STATE COMPONENT
   ───────────────────────────────────────────────────── */

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 mx-1"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
        <p className="text-sm text-[#DC2626] leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8 gap-1.5 border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#DC2626] text-xs"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

/** Inline error banner (small, no retry) */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
      <span className="text-sm text-[#DC2626]">{message}</span>
    </div>
  );
}
