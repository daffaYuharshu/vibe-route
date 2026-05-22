import type { FoursquarePlace } from './foursquare';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LocationContext {
  lat: number;
  lng: number;
  places?: FoursquarePlace[];
}

/**
 * Build a system prompt that gives Gemini geographic + place context
 * so its recommendations are geographically relevant.
 */
export function buildSystemPrompt(locationContext?: LocationContext): string {
  const base = `Kamu adalah asisten perjalanan cerdas untuk aplikasi Vibe Route.
Tugasmu adalah membantu pengguna menemukan destinasi wisata, merekomendasikan tempat menarik,
merangkum informasi tempat, dan memberi saran rute perjalanan yang efisien.
Jawab dengan ramah, ringkas, dan informatif dalam Bahasa Indonesia.
Gunakan format bullet point atau angka untuk daftar rekomendasi agar mudah dibaca.`;

  if (!locationContext) return base;

  const { lat, lng, places } = locationContext;
  let contextBlock = `\n\nKonteks lokasi pengguna saat ini:
- Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  if (places && places.length > 0) {
    const placeList = places
      .slice(0, 8)
      .map((p, i) => {
        const cat = p.categories?.[0]?.name ?? 'Tempat';
        const dist = p.distance != null
          ? p.distance < 1000
            ? `${p.distance} m`
            : `${(p.distance / 1000).toFixed(1)} km`
          : '';
        const addr = p.location.formatted_address ?? '';
        return `  ${i + 1}. ${p.name} (${cat})${dist ? ` — ${dist}` : ''}${addr ? `\n     Alamat: ${addr}` : ''}`;
      })
      .join('\n');

    contextBlock += `\n- Tempat yang sudah ditemukan pengguna:\n${placeList}`;
  }

  contextBlock += `\n\nGunakan konteks ini untuk memberikan rekomendasi yang relevan secara geografis.`;
  return base + contextBlock;
}
