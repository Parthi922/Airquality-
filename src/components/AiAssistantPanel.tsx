import { Send, Square } from 'lucide-react';
import React, { useId, useRef, useState } from 'react';
import { SafeMarkdown } from '@/src/components/SafeMarkdown';
import { streamAssistantChat } from '@/src/lib/api/client';
import type {
  AdvisoryOutput,
  AirQualityReport,
  ChatMessage,
  UserProfile,
} from '@/src/types/airQuality';

interface AiAssistantPanelProps {
  report: AirQualityReport;
  advisory: AdvisoryOutput;
  profile: UserProfile;
}

const SUGGESTED_QUESTIONS = [
  'Is it safe to run outdoors at 6am?',
  'Why is the AQI at this level today?',
  'Should I keep my windows open or closed?',
  'Which pollutant is the main concern right now?',
];

export default function AiAssistantPanel({ report, advisory, profile }: AiAssistantPanelProps) {
  const inputId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `assistant-${Date.now()}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    const historyForRequest = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg, placeholderAssistant]);
    setDraft('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAssistantChat({
        message: trimmed,
        profile,
        history: historyForRequest,
        report,
        advisory,
        signal: controller.signal,
        onDelta: (delta) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
          );
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errMessage =
        err instanceof Error ? err.message : 'Unable to reach the AI assistant right now.';
      setError(errMessage);
      setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content === '')));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(draft);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <section
      aria-labelledby="assistant-heading"
      className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h2
          id="assistant-heading"
          className="text-xl font-bold tracking-tight text-slate-950 dark:text-white"
        >
          Air Quality Assistant
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Ask questions grounded directly in {report.location.name}&apos;s current readings (US AQI{' '}
          <span className="font-mono tabular-nums">{report.current.usAqi}</span>) and your{' '}
          {advisory.profileLabel.toLowerCase()} advisory. Responses cite observed metrics and are
          informational only, not medical diagnoses.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested questions">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isStreaming}
            onClick={() => void sendQuestion(q)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {q}
          </button>
        ))}
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Assistant conversation"
        className="mt-4 max-h-96 space-y-4 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask a question below or pick a prompt above to interpret {report.location.name}&apos;s
            forecast and health guidance.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border p-3.5 ${
                msg.role === 'user'
                  ? 'ml-auto max-w-2xl border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-900 dark:bg-sky-950/60 dark:text-slate-100'
                  : 'mr-auto max-w-3xl border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <div className="mt-1">
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : msg.content ? (
                  <SafeMarkdown content={msg.content} />
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Analyzing data…</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Ask a question about air quality in {report.location.name}
        </label>
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder={`Ask about ${report.location.name}'s air quality (max 500 chars)…`}
          className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-rose-300 bg-rose-50 px-5 text-sm font-medium text-rose-900 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-sky-700 px-5 text-sm font-medium text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Ask Assistant</span>
          </button>
        )}
      </form>
    </section>
  );
}
