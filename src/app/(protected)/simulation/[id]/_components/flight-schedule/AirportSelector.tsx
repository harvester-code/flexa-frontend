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

  // Search across all levels
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toUpperCase();
    return airportFlat.filter((airport) =>
      airport.searchText.includes(query)
    ).slice(0, 20);
  }, [searchQuery]);

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

  // Handle Enter key to select first search result
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelect(searchResults[0].iata);
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
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search airport"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 h-9"
              autoFocus
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-[400px] overflow-y-auto">
          {searchQuery ? (
            // Search Results
            searchResults.length > 0 ? (
              searchResults.map((airport) => (
                <DropdownMenuItem
                  key={airport.iata}
                  onClick={() => handleSelect(airport.iata)}
                  className="flex items-center gap-2"
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