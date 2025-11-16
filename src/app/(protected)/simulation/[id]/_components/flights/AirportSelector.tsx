'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, Search, Globe, MapPin, Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { DropdownMenuSubTriggerNoArrow } from '@/components/ui/DropdownMenuCustom';
import Spinner from '@/components/ui/Spinner';
import airportHierarchy from '../../_json/airport_hierarchy.json';
import airportFlat from '../../_json/airport_flat.json';

interface AirportSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const SEARCH_INPUT_INDEX = -1;
const DEBOUNCE_DELAY_MS = 150;
const MAX_SEARCH_RESULTS = 20;

const TEXT = {
  SELECT: 'Select airport',
  SEARCH: 'Search airport',
  SEARCHING: 'Searching...',
  NO_RESULTS: 'No results found',
  AIRPORTS: 'Airports',
} as const;

interface AirportHierarchy {
  [region: string]: {
    [country: string]: {
      [city: string]: string[];
    };
  };
}

const hierarchy = airportHierarchy as AirportHierarchy;

export default function AirportSelector({ value, onChange }: AirportSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(SEARCH_INPUT_INDEX);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentAirport = airportFlat.find((a) => a.iata === value);

  const airportCounts = useMemo(() => {
    const regionCounts: Record<string, number> = {};
    const countryCounts: Record<string, Record<string, number>> = {};

    Object.entries(hierarchy).forEach(([region, countries]) => {
      let regionTotal = 0;
      countryCounts[region] = {};

      Object.entries(countries).forEach(([country, cities]) => {
        const countryTotal = Object.values(cities).reduce(
          (sum, airports) => sum + airports.length,
          0
        );
        countryCounts[region][country] = countryTotal;
        regionTotal += countryTotal;
      });

      regionCounts[region] = regionTotal;
    });

    return { regionCounts, countryCounts };
  }, []);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery) return [];

    const query = debouncedSearchQuery.toUpperCase();
    const iataMatches: typeof airportFlat = [];
    const otherMatches: typeof airportFlat = [];

    for (const airport of airportFlat) {
      if (airport.iata.includes(query)) {
        iataMatches.push(airport);
      } else if (
        airport.city.toUpperCase().includes(query) ||
        airport.country.toUpperCase().includes(query)
      ) {
        otherMatches.push(airport);
      }

      if (iataMatches.length + otherMatches.length >= MAX_SEARCH_RESULTS) break;
    }

    return [...iataMatches, ...otherMatches].slice(0, MAX_SEARCH_RESULTS);
  }, [debouncedSearchQuery]);

  const handleSelect = (iata: string) => {
    onChange(iata);
    setSearchQuery('');
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(SEARCH_INPUT_INDEX);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchQuery) return;

    const totalItems = searchResults.length;
    const isInputFocused = selectedIndex === SEARCH_INPUT_INDEX;
    const selectedAirport = selectedIndex >= 0 ? searchResults[selectedIndex] : null;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, SEARCH_INPUT_INDEX));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedAirport) {
          handleSelect(selectedAirport.iata);
        } else if (isInputFocused && searchResults[0]) {
          handleSelect(searchResults[0].iata);
        }
        break;

      case 'ArrowRight':
        if (selectedAirport) {
          e.preventDefault();
          handleSelect(selectedAirport.iata);
        }
        break;
    }
  };

  const isSearching = debouncedSearchQuery !== searchQuery;
  const showSearchResults = searchQuery && !isSearching && searchResults.length > 0;
  const showNoResults = searchQuery && !isSearching && searchResults.length === 0;
  const isInputHighlighted = selectedIndex === SEARCH_INPUT_INDEX && searchQuery;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-semibold">{currentAirport?.display ?? TEXT.SELECT}</span>
          </div>
          <Search className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="start">
        <div className="p-2 pb-0">
          <div className={`relative ${isInputHighlighted ? 'bg-accent/50 rounded px-2' : ''}`}>
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              placeholder={TEXT.SEARCH}
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value.replace(/[^\x00-\x7F]/g, ""))
              }
              onKeyDown={handleKeyDown}
              onFocus={() => setSelectedIndex(SEARCH_INPUT_INDEX)}
              className="w-full pl-8 py-2 bg-transparent outline-none border-0 border-b border-gray-200 focus:border-gray-400 transition-colors text-sm"
              autoFocus
              onBeforeInput={(e) => {
                const data = (e as unknown as InputEvent).data ?? "";
                if (typeof data === "string" && /[^\x00-\x7F]/.test(data)) {
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isSearching && (
            <div className="p-2 text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Spinner size={12} />
                {TEXT.SEARCHING}
              </div>
            </div>
          )}

          {showSearchResults &&
            searchResults.map((airport, index) => (
              <DropdownMenuItem
                key={airport.iata}
                onClick={() => handleSelect(airport.iata)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-2 ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
              >
                <Plane className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-sm">{airport.iata}</span>
                  <span className="text-sm text-muted-foreground">
                    ({airport.city}, {airport.country})
                  </span>
                </div>
              </DropdownMenuItem>
            ))}

          {showNoResults && (
            <div className="p-2 text-center text-sm text-muted-foreground">{TEXT.NO_RESULTS}</div>
          )}

          {!searchQuery &&
            Object.entries(hierarchy).map(([region, countries]) => (
              <DropdownMenuSub key={region}>
                <DropdownMenuSubTriggerNoArrow className="gap-1">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  <span className="flex-1">{region}</span>
                  <span className="text-xs text-muted-foreground mr-1">
                    {airportCounts.regionCounts[region].toLocaleString()} {TEXT.AIRPORTS}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuSubTriggerNoArrow>
                <DropdownMenuSubContent className="w-64" sideOffset={5}>
                  <div className="max-h-[400px] overflow-y-auto">
                    {Object.entries(countries).map(([country, cities]) => (
                      <DropdownMenuSub key={country}>
                        <DropdownMenuSubTriggerNoArrow className="gap-1">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="flex-1">{country}</span>
                          <span className="text-xs text-muted-foreground mr-1">
                            {airportCounts.countryCounts[region][country].toLocaleString()}{' '}
                            {TEXT.AIRPORTS}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </DropdownMenuSubTriggerNoArrow>
                        <DropdownMenuSubContent className="w-64" sideOffset={5}>
                          <div className="max-h-[400px] overflow-y-auto">
                            {Object.entries(cities).map(([city, airports]) => (
                              <div key={city}>
                                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                                  <MapPin className="h-3 w-3 text-orange-400" />
                                  {city}
                                </div>
                                {airports.map((airport) => (
                                  <DropdownMenuItem
                                    key={airport}
                                    onClick={() => handleSelect(airport)}
                                    className="flex items-center gap-1 pl-6"
                                  >
                                    <Plane className="h-3 w-3 text-primary" />
                                    <span className="font-semibold text-xs">{airport}</span>
                                    <span className="text-xs text-muted-foreground ml-0.5">
                                      ({city}, {country})
                                    </span>
                                  </DropdownMenuItem>
                                ))}
                              </div>
                            ))}
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ))}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
