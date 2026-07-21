'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, Square } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const OPENERS = [
  'I keep second-guessing a decision I made.',
  'What does the Gita say about doing work you resent?',
  "I'm anxious about something I can't control.",
  'What does it mean to act without attachment to results?',
];

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Abort any in-flight stream when the panel unmounts, so a half-written reply
  // isn't left writing into state that no longer exists.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const next: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only the last 20 turns go back — the server caps at 40, and long
        // threads cost tokens without improving the answer.
        body: JSON.stringify({ messages: next.slice(-20) }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error || 'Could not reach the chat companion');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      toast.error((error as Error).message);
      // Drop the empty assistant bubble rather than leaving a blank reply.
      setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.content === '')));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div ref={scrollRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400">
              <MessageCircle className="h-6 w-6" />
            </span>
            <h2 className="font-display text-2xl font-semibold text-gray-800 dark:text-white">
              What's on your mind?
            </h2>
            <p className="mt-1 max-w-md text-theme-sm text-gray-500 dark:text-gray-400">
              Say what you're sitting with, and I'll point to what the Gita has to say about it —
              chapter and verse. I won't tell you what to do.
            </p>
            <div className="mt-6 flex w-full max-w-lg flex-col gap-2">
              {OPENERS.map((opener) => (
                <button
                  key={opener}
                  onClick={() => send(opener)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-left text-theme-sm text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-white/5"
                >
                  {opener}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-2">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-theme-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : 'border border-gray-200 bg-card text-gray-700 dark:border-gray-800 dark:text-gray-300'
                  )}
                >
                  {message.content || (
                    <span className="flex gap-1" aria-label="Thinking">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-typing" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-typing [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-typing [animation-delay:0.4s]" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 pt-4">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-card p-2 focus-within:border-gray-300 dark:border-gray-800 dark:focus-within:border-gray-700">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={4000}
            placeholder="Say what's on your mind…"
            aria-label="Message"
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-white"
          />
          {isStreaming ? (
            <Button size="icon" variant="secondary" onClick={stop} aria-label="Stop generating">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-theme-xs text-gray-500 dark:text-gray-400">
          Explains what the Gita says. Not advice, and not a substitute for professional help.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
