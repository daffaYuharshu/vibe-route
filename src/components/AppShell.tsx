"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Navigation, MapPin, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface AppShellProps {
  /** Sidebar content */
  sidebar: React.ReactNode;
  /** Main content (map or other) */
  children: React.ReactNode;
  /** Page title shown in mobile header */
  pageTitle?: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Eksplorasi", icon: Map },
  { href: "/route", label: "Rute", icon: Navigation },
  { href: "/places", label: "Tempat", icon: MapPin },
] as const;

/** Desktop: sidebar-left + main-right split view.
 *  Mobile:  full-screen main + bottom-sheet sidebar toggled via header button.
 */
export function AppShell({ sidebar, children, pageTitle = "Vibe Route" }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F8FAFC]">
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside
        className="hidden md:flex md:w-[320px] md:flex-col md:flex-shrink-0 border-r border-[#E2E8F0] bg-white h-full z-10"
        style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.06)" }}
        aria-label="Panel samping"
      >
        {/* Sidebar Header + Nav */}
        <SidebarHeader pathname={pathname} />
        <Separator />
        {/* Sidebar content slot */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {sidebar}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-[#E2E8F0] bg-white shrink-0 z-20">
          <div>
            <span className="text-base font-bold text-[#0F172A]">Vibe Route</span>
            {pageTitle !== "Vibe Route" && (
              <span className="ml-2 text-sm text-[#475569]">/ {pageTitle}</span>
            )}
          </div>

          {/* Mobile Sheet trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center justify-center size-11 rounded-lg text-[#475569] hover:bg-[#F1F5F9] transition-colors tap-sm"
                aria-label="Buka panel"
              >
                {mobileOpen ? (
                  <X className="size-5" aria-hidden="true" />
                ) : (
                  <Menu className="size-5" aria-hidden="true" />
                )}
              </button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="h-[85dvh] p-0 rounded-t-2xl border-t border-[#E2E8F0] bg-white flex flex-col"
              aria-label="Panel navigasi"
            >
              <SheetTitle className="sr-only">Panel Navigasi</SheetTitle>
              <SidebarHeader pathname={pathname} onNavClick={() => setMobileOpen(false)} />
              <Separator />
              <div className="flex-1 overflow-y-auto flex flex-col">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main content (map / page) */}
        <main className="flex-1 overflow-hidden relative" aria-label="Konten utama">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden flex border-t border-[#E2E8F0] bg-white shrink-0"
          aria-label="Navigasi halaman"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors tap-sm ${
                  active
                    ? "text-[#1D4ED8]"
                    : "text-[#94A3B8] hover:text-[#475569]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={`size-5 ${active ? "text-[#1D4ED8]" : "text-[#94A3B8]"}`}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* ── Sidebar Header sub-component ── */
function SidebarHeader({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick?: () => void;
}) {
  return (
    <div className="shrink-0">
      {/* Brand */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#1D4ED8] shrink-0">
          <Map className="size-4 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-base font-bold text-[#0F172A] leading-tight">Vibe Route</p>
          <p className="text-[10px] text-[#94A3B8] leading-tight">Eksplorasi tempat &amp; rute</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex px-4 pb-3 gap-1" aria-label="Navigasi utama">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors tap-sm ${
                active
                  ? "bg-[#DBEAFE] text-[#1D4ED8]"
                  : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
