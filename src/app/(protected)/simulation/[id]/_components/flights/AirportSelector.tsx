'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, Search, Globe, MapPin, Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { DropdownMenuSubTriggerNoArrow } from '@/components/ui/DropdownMenuCustom';
import airportHierarchy from '../../_json/airport_hierarchy.json';
import airportFlat from '../../_json/airport_flat.json';

interface AirportSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AirportSelector({ value, onChange }: AirportSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means search input is focused
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find current selection info
  const currentAirport = airportFlat.find((a) => a.iata === value);

  // Format number with thousand separators
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate airport counts for regions and countries
  const airportCounts = useMemo(() => {
    const regionCounts: Record<string, number> = {};
    const countryCounts: Record<string, Record<string, number>> = {};

    Object.entries(airportHierarchy).forEach(([region, countries]) => {
      let regionTotal = 0;
      countryCounts[region] = {};

      Object.entries(countries as any).forEach(([country, cities]) => {
        let countryTotal = 0;
        Object.values(cities as any).forEach((airports: any) => {
          countryTotal += airports.length;
        });
        countryCounts[region][country] = countryTotal;
        regionTotal += countryTotal;
      });

      regionCounts[region] = regionTotal;
    });

    return { regionCounts, countryCounts };
  }, []);

  // Search across all levels with debouncing
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150); // 150ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery) return [];

    const query = debouncedSearchQuery.toUpperCase();
    const iataMatches: typeof airportFlat = [];
    const otherMatches: typeof airportFlat = [];

    // Search only in IATA code, city, and country
    for (let i = 0; i < airportFlat.length; i++) {
      const airport = airportFlat[i];

      // Check IATA code first (priority)
      if (airport.iata.includes(query)) {
        iataMatches.push(airport);
      }
      // Check city or country (no priority between them)
      else if (
        airport.city.toUpperCase().includes(query) ||
        airport.country.toUpperCase().includes(query)
      ) {
        otherMatches.push(airport);
      }

      // Stop if we have enough results
      if (iataMatches.length + otherMatches.length >= 20) break;
    }

    // Return IATA matches first, then other matches
    return [...iataMatches, ...otherMatches].slice(0, 20);
  }, [debouncedSearchQuery]);

  const handleSelect = (iata: string) => {
    onChange(iata);
    setSearchQuery('');
    setOpen(false);
  };

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle navigation when there's a search query
    if (!searchQuery) return;

    const totalItems = searchResults.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectedIndex < totalItems - 1) {
          setSelectedIndex(selectedIndex + 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (selectedIndex > -1) {
          setSelectedIndex(selectedIndex - 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex].iata);
        } else if (selectedIndex === -1 && searchResults.length > 0) {
          // If focus is on search input and there are results, select the first one
          handleSelect(searchResults[0].iata);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex].iata);
        }
        break;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-semibold">{currentAirport ? currentAirport.display : 'Select airport'}</span>
          </div>
          <Search className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="start">
        {/* Search Input */}
        <div className="p-2 pb-0">
          <div className={`relative ${selectedIndex === -1 && searchQuery ? 'bg-accent/50 rounded px-2' : ''}`}>
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              placeholder="Search airport"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 py-2 bg-transparent outline-none border-0 border-b border-gray-200 focus:border-gray-400 transition-colors text-sm"
              autoFocus
              onFocus={() => setSelectedIndex(-1)}
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {searchQuery ? (
            // Search Results with loading state
            debouncedSearchQuery !== searchQuery ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Searching...
                </div>
              </div>
            ) : searchResults.length > 0 ? (
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
                    <span className="text-sm text-muted-foreground">({airport.city}, {airport.country})</span>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )
          ) : (
            // Hierarchical Navigation
            Object.entries(airportHierarchy).map(([region, countries]) => (
              <DropdownMenuSub key={region}>
                <DropdownMenuSubTriggerNoArrow className="gap-1">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  <span className="flex-1">{region}</span>
                  <span className="text-xs text-muted-foreground mr-1">{formatNumber(airportCounts.regionCounts[region])} Airports</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuSubTriggerNoArrow>
                <DropdownMenuSubContent className="w-64" sideOffset={5}>
                  <div className="max-h-[400px] overflow-y-auto">
                    {Object.entries(countries as any).map(([country, cities]) => (
                      <DropdownMenuSub key={country}>
                        <DropdownMenuSubTriggerNoArrow className="gap-1">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="flex-1">{country}</span>
                          <span className="text-xs text-muted-foreground mr-1">{formatNumber(airportCounts.countryCounts[region][country])} Airports</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </DropdownMenuSubTriggerNoArrow>
                        <DropdownMenuSubContent className="w-64" sideOffset={5}>
                          <div className="max-h-[400px] overflow-y-auto">
                            {Object.entries(cities as any).map(([city, airports]) => (
                              <div key={city}>
                                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                                  <MapPin className="h-3 w-3 text-orange-400" />
                                  {city}
                                </div>
                                {(airports as string[]).map((airport) => (
                                  <DropdownMenuItem
                                    key={airport}
                                    onClick={() => handleSelect(airport)}
                                    className="flex items-center gap-1 pl-6"
                                  >
                                    <Plane className="h-3 w-3 text-primary" />
                                    <span className="font-semibold text-xs">{airport}</span>
                                    <span className="text-xs text-muted-foreground ml-0.5">({city}, {country})</span>
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
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}