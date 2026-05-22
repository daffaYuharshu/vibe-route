"use client";

import { useState, useRef, useCallback } from 'react';
import type { ChatMessage, LocationContext } from '@/lib/gemini';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Halo! Saya asisten perjalanan Vibe Route. Saya bisa membantu Anda:\n\n• 🗺️ Rekomendasi destinasi wisata\n• ☕ Saran tempat makan & kafe\n• 🛤️ Tips rute perjalanan\n• 📍 Ringkasan informasi tempat\n\nMau ke mana hari ini?',
};

interface UseChatReturn {
  messages: ChatMessage[];
  streamingText: string;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

/**
 * Hook for streaming chat via the /api/chat proxy (Gemini under the hood).
 * All Gemini API calls stay server-side; client only talks to /api/chat.
 */
export function useChat(locationContext?: LocationContext): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);
      setStreamingText('');

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, locationContext }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        if (!reader) throw new Error('No response body');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as { text: string };
              accumulated += parsed.text;
              setStreamingText(accumulated);
            } catch {
              // ignore partial JSON chunks
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: accumulated || '...' },
        ]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${msg}` },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingText('');
      }
    },
    [isLoading, messages, locationContext]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([WELCOME_MESSAGE]);
    setStreamingText('');
    setIsLoading(false);
  }, []);

  return { messages, streamingText, isLoading, sendMessage, clearChat };
}
