import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCityAirQuality } from '@/src/lib/api/client';
import type { AirQualityReport, GeoLocation } from '@/src/types/airQuality';

export function useAirQuality(initialLocation: GeoLocation | null = null) {
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(initialLocation);
  const [report, setReport] = useState<AirQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadLocation = useCallback(async (location: GeoLocation) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSelectedLocation(location);
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCityAirQuality(location, controller.signal);
      setReport(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load air quality data.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (initialLocation) {
      void loadLocation(initialLocation);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [initialLocation, loadLocation]);

  const refresh = useCallback(() => {
    if (selectedLocation) {
      void loadLocation(selectedLocation);
    }
  }, [selectedLocation, loadLocation]);

  return {
    selectedLocation,
    report,
    isLoading,
    error,
    loadLocation,
    refresh,
  };
}
