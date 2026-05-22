"use client";

import { useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import type { ChatMessage, LocationContext } from '@/lib/gemini';
import { useState } from 'react';

interface AssistantPanelProps {
  locationContext?: LocationContext;
  isOpen: boolean;
  onClose: () => void;
}

export function AssistantPanel({ locationContext, isOpen, onClose }: AssistantPanelProps) {
  const { messages, streamingText, isLoading, sendMessage, clearChat } =
    useChat(locationContext);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col border-t border-[#E2E8F0] bg-white"
      style={{ height: '380px' }}
      role="region"
      aria-label="Asisten perjalanan AI"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-[#1D4ED8]">
            <Sparkles className="size-3 text-white" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-[#0F172A]">Asisten Perjalanan</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="tap-sm rounded p-1 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Hapus percakapan"
            title="Hapus percakapan"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={onClose}
            className="tap-sm rounded p-1 text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Tutup panel asisten"
            title="Tutup"
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {isLoading && streamingText && (
          <MessageBubble message={{ role: 'assistant', content: streamingText }} isStreaming />
        )}

        {isLoading && !streamingText && (
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE]">
              <Bot className="size-3.5 text-[#1D4ED8]" aria-hidden="true" />
            </div>
            <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-[#F1F5F9] px-3 py-2">
              <span className="inline-block size-1.5 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block size-1.5 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block size-1.5 rounded-full bg-[#94A3B8] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan… (Enter untuk kirim)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-0 disabled:opacity-60"
            style={{ maxHeight: '80px', minHeight: '36px' }}
            aria-label="Pesan ke asisten"
          />
          <Button
            id="btn-send-chat"
            size="sm"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 p-0 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg shrink-0"
            aria-label="Kirim pesan"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-[#94A3B8] text-center">
          Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const renderContent = (text: string) =>
    text.split('\n').map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((p, j) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={j}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{p}</span>
        )
      );
      return (
        <span key={i}>
          {rendered}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#1D4ED8] px-3 py-2 text-xs text-white">
          {renderContent(message.content)}
        </div>
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0]">
          <User className="size-3.5 text-[#475569]" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE]">
        <Bot className="size-3.5 text-[#1D4ED8]" aria-hidden="true" />
      </div>
      <div
        className={`max-w-[85%] rounded-2xl rounded-tl-sm bg-[#F1F5F9] px-3 py-2 text-xs text-[#0F172A] ${
          isStreaming ? 'after:content-["▋"] after:animate-pulse after:text-[#1D4ED8] after:ml-0.5' : ''
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
