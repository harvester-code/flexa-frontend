'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Database, Loader2, Plane, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import _jsonAirport from '../_json/airport_constants.json';

const JSON_AIRPORTS = _jsonAirport.map((item) => ({
  iata: item.iata,
  name: item.name,
  searchText: `${item.iata}/${item.name}`.toUpperCase(),
}));

interface TabFlightScheduleLoadDataProps {
  airport: string;
  date: string;
  loadingFlightSchedule: boolean;
  setAirport: (airport: string) => void;
  setDate: (date: string) => void;
  setIsSomethingChanged: (changed: boolean) => void;
  onLoadData: () => void;
}

function TabFlightScheduleLoadData({
  airport,
  date,
  loadingFlightSchedule,
  setAirport,
  setDate,
  setIsSomethingChanged,
  onLoadData,
}: TabFlightScheduleLoadDataProps) {
  const [openAirportPopover, setOpenAirportPopover] = useState(false);
  const [searchAirport, setSearchAirport] = useState('');

  // 디바운싱된 검색어 (타이핑 중 과도한 필터링 방지) - 성능 최적화
  const [debouncedSearchAirport, setDebouncedSearchAirport] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchAirport(searchAirport);
    }, 200); // 200ms로 증가하여 API 호출 최소화

    return () => clearTimeout(timer);
  }, [searchAirport]);

  // 검색 결과 캐싱 (동일한 검색어 재입력 시 즉시 반환)
  const searchCache = useMemo(() => new Map<string, typeof JSON_AIRPORTS>(), []);

  const getCachedSearchResult = useCallback(
    (query: string) => {
      if (searchCache.has(query)) {
        return searchCache.get(query)!;
      }

      const result =
        query.length < 2
          ? (() => {
              const majorAirports = ['ICN', 'GMP', 'PUS', 'CJU', 'TAE', 'KWJ', 'USN', 'YNY', 'RSU', 'KPX'];
              const major = JSON_AIRPORTS.filter((airport) => majorAirports.includes(airport.iata));
              const others = JSON_AIRPORTS.filter((airport) => !majorAirports.includes(airport.iata)).slice(0, 20);
              return [...major, ...others];
            })()
          : JSON_AIRPORTS.filter((airportItem) => airportItem.searchText.includes(query.toUpperCase()));

      searchCache.set(query, result);
      return result;
    },
    [searchCache]
  );

  // 성능 최적화: 공항 검색 결과를 캐싱과 함께 사용
  const filteredAirports = useMemo(() => {
    return getCachedSearchResult(debouncedSearchAirport);
  }, [getCachedSearchResult, debouncedSearchAirport]);

  // 현재 선택된 공항 정보 가져오기
  const currentAirportInfo = JSON_AIRPORTS.find((item) => item.iata === airport);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="rounded-lg bg-primary/10 p-2">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">Flight Schedule Data</div>
            <p className="text-sm font-normal text-gray-600">Select airport and date to load flight data</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 lg:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 lg:gap-4">
            {/* Airport Selection - 성능 최적화된 버전 */}
            <Popover open={openAirportPopover} onOpenChange={setOpenAirportPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openAirportPopover}
                  className="min-w-0 max-w-none flex-1 justify-between border-2 hover:border-primary/50 focus:border-primary sm:max-w-md lg:max-w-lg xl:max-w-xl"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Plane className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="min-w-0 flex-1 text-left">
                      {airport ? (
                        <div className="truncate font-medium">
                          {airport} {currentAirportInfo?.name && `- ${currentAirportInfo.name}`}
                        </div>
                      ) : (
                        <div className="font-medium">Select airport</div>
                      )}
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-sm p-0 sm:max-w-md lg:max-w-lg" sideOffset={4}>
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search airport... (type 2+ chars)"
                    value={searchAirport}
                    onValueChange={setSearchAirport}
                    autoFocus={openAirportPopover}
                    className="border-0 focus:ring-0 focus:ring-offset-0"
                  />
                  <CommandList className="max-h-[300px] overflow-auto">
                    {filteredAirports.length === 0 ? (
                      <CommandEmpty>
                        {searchAirport.length < 2 ? 'Type 2 or more characters to search' : 'No airport found.'}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {filteredAirports.slice(0, 50).map((airportItem) => (
                          <CommandItem
                            key={airportItem.iata}
                            value={airportItem.iata}
                            onSelect={(currentValue) => {
                              setIsSomethingChanged(airport !== currentValue);
                              setAirport(currentValue);
                              setOpenAirportPopover(false);
                              setSearchAirport('');
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex w-full flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-medium">{airportItem.iata}</span>
                                {airport === airportItem.iata && <div className="h-2 w-2 rounded-full bg-primary" />}
                              </div>
                              <span className="line-clamp-1 text-sm text-muted-foreground">{airportItem.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                        {filteredAirports.length > 50 && (
                          <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                            Showing first 50 results. Type more to narrow down.
                          </div>
                        )}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date Selection */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-fit flex-shrink-0 justify-start border-2 hover:border-primary/50 focus:border-primary"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{dayjs(date).format('MMM DD, YYYY')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dayjs(date).toDate()}
                  defaultMonth={dayjs(date).toDate()}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setIsSomethingChanged(date !== dayjs(selectedDate).format('YYYY-MM-DD'));
                      setDate(dayjs(selectedDate).format('YYYY-MM-DD'));
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Load Button */}
          <Button onClick={onLoadData} disabled={loadingFlightSchedule} className="flex-shrink-0 px-4 sm:px-6 lg:px-8">
            {loadingFlightSchedule ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 flex-shrink-0 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
                <span className="sm:hidden">Load</span>
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4 flex-shrink-0" />
                Load
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(TabFlightScheduleLoadData);
