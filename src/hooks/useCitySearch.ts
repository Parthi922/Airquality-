import { useEffect, useRef, useState } from 'react';
import { fetchCitySuggestions } from '@/src/lib/api/client';
import type { GeoLocation } from '@/src/types/airQuality';

export function useCitySearch(debounceMs = 280) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setSuggestions([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await fetchCitySuggestions(trimmed, controller.signal);
        setSuggestions(results);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setSearchError(err instanceof Error ? err.message : 'Unable to search cities.');
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  const clearSuggestions = () => {
    abortRef.current?.abort();
    setSuggestions([]);
    setSearchError(null);
  };

  return {
    query,
    setQuery,
    suggestions,
    isSearching,
    searchError,
    clearSuggestions,
  };
}
