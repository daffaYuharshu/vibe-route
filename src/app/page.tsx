import { MapView } from "@/components/MapView";

export default function Home() {
  return (
    <main className="flex h-screen w-full flex-col md:flex-row bg-background overflow-hidden">
      {/* Sidebar Placeholder */}
      <aside className="w-full md:w-[320px] h-auto md:h-full border-r border-border bg-surface p-4 flex-shrink-0 z-10 shadow-sm flex flex-col">
        <h1 className="text-2xl font-bold text-primary mb-2">Vibe Route</h1>
        <p className="text-sm text-muted-foreground">Eksplorasi peta dan rute perjalanan Anda.</p>
      </aside>
      
      {/* Main Map Content */}
      <section className="flex-1 h-full w-full relative">
        <MapView />
      </section>
    </main>
  );
}
