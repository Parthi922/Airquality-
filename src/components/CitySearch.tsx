import { LocateFixed, Search } from 'lucide-react';
import React, { useId, useState } from 'react';
import { useCitySearch } from '@/src/hooks/useCitySearch';
import { fetchReverseCity } from '@/src/lib/api/client';
import type { GeoLocation } from '@/src/types/airQuality';

interface CitySearchProps {
  label: string;
  placeholder?: string;
  selectedLocation: GeoLocation | null;
  onSelectLocation: (location: GeoLocation) => void;
  showGeolocation?: boolean;
}

export function CitySearch({
  label,
  placeholder = 'Search any city (e.g., Tokyo, London, Mexico City)',
  selectedLocation,
  onSelectLocation,
  showGeolocation = true,
}: CitySearchProps) {
  const inputId = useId();
  const listboxId = useId();
  const errorId = useId();

  const { query, setQuery, suggestions, isSearching, searchError, clearSuggestions } =
    useCitySearch(280);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const combinedError = geoError ?? searchError;
  const showDropdown = isOpen && (suggestions.length > 0 || isSearching);

  const handleSelect = (loc: GeoLocation) => {
    setQuery(`${loc.name}${loc.country ? `, ${loc.country}` : ''}`);
    setIsOpen(false);
    setActiveIndex(-1);
    setGeoError(null);
    clearSuggestions();
    onSelectLocation(loc);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleUseMyLocation = () => {
    setGeoError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser. Search for a city instead.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const resolved = await fetchReverseCity(
            position.coords.latitude,
            position.coords.longitude,
          );
          handleSelect(resolved);
        } catch {
          setGeoError('Unable to resolve your location name. Please search for a city manually.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Location permission was denied. You can search for any city using the search box.',
          );
        } else {
          setGeoError('Unable to determine your GPS coordinates. Please search for a city.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-800 dark:text-slate-200"
      >
        {label}
      </label>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
              setGeoError(null);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLocation
                ? `${selectedLocation.name}${selectedLocation.country ? `, ${selectedLocation.country}` : ''}`
                : placeholder
            }
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            aria-invalid={Boolean(combinedError)}
            aria-describedby={combinedError ? errorId : undefined}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          {showDropdown && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Matching cities"
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {isSearching && suggestions.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400">
                  Searching cities…
                </li>
              ) : (
                suggestions.map((loc, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={loc.id}
                      id={`${listboxId}-option-${idx}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(loc);
                      }}
                      className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-950 dark:bg-sky-950/60 dark:text-sky-100'
                          : 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-medium">
                        {loc.name}
                        {loc.admin1 ? `, ${loc.admin1}` : ''}
                      </span>
                      <span className="ml-3 shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {loc.country}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {showGeolocation && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
            <span>{geoLoading ? 'Locating…' : 'Use my location'}</span>
          </button>
        )}
      </div>

      {combinedError && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">
          {combinedError}
        </p>
      )}
    </div>
  );
}
