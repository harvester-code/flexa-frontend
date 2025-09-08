'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Database, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import _jsonAirport from '../_json/airport_constants.json';
import { useSimulationStore } from '../_stores';

const JSON_AIRPORTS = _jsonAirport.map((item) => ({
  iata: item.iata,
  name: item.name,
  searchText: `${item.iata}/${item.name}`.toUpperCase(),
}));

interface TabFlightScheduleLoadDataProps {
  loadingFlightSchedule: boolean;
  setIsSomethingChanged: (changed: boolean) => void;
  onLoadData: (airport: string, date: string) => void;
}

function TabFlightScheduleLoadData({
  loadingFlightSchedule,
  setIsSomethingChanged,
  onLoadData,
}: TabFlightScheduleLoadDataProps) {
  // 🆕 초기값은 store에서 가져오되, 로컬 상태로 관리 (Load 버튼 클릭 시에만 저장)
  const storeAirport = useSimulationStore((s) => s.context.airport);
  const storeDate = useSimulationStore((s) => s.context.date);
  const setStoreAirport = useSimulationStore((s) => s.setAirport);
  const setStoreDate = useSimulationStore((s) => s.setDate);
  const resetPassenger = useSimulationStore((s) => s.resetPassenger);
  const resetProcessFlow = useSimulationStore((s) => s.resetProcessFlow);

  // 로컬 상태로 관리 (초기값은 store에서 가져오기)
  const [airport, setAirport] = useState(storeAirport);
  const [date, setDate] = useState(storeDate);
  const [openAirportPopover, setOpenAirportPopover] = useState(false);
  const [openCalendarPopover, setOpenCalendarPopover] = useState(false);
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
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="rounded-lg bg-primary/10 p-2">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Flight Schedule Data</div>
            <p className="text-sm font-normal text-default-500">Select airport and date to load flight data</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 lg:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 lg:gap-4">
            {/* Airport Selection - 표준 Combobox */}
            <Popover open={openAirportPopover} onOpenChange={setOpenAirportPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openAirportPopover}
                  className="min-w-0 max-w-none flex-1 justify-between font-normal sm:max-w-md lg:max-w-lg xl:max-w-xl"
                >
                  {airport
                    ? `${airport}${currentAirportInfo?.name ? ` - ${currentAirportInfo.name}` : ''}`
                    : 'Select airport...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Command>
                  <CommandInput
                    placeholder="Search airport..."
                    value={searchAirport}
                    onValueChange={setSearchAirport}
                    inputMode="latin"
                    lang="en"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                  <CommandList>
                    <CommandEmpty>No airport found.</CommandEmpty>
                    <CommandGroup>
                      {filteredAirports.slice(0, 50).map((airportItem) => (
                        <CommandItem
                          key={airportItem.iata}
                          value={airportItem.iata}
                          onSelect={(currentValue) => {
                            setIsSomethingChanged(airport !== currentValue);
                            setAirport(currentValue === airport ? '' : currentValue);
                            setOpenAirportPopover(false);
                            setSearchAirport('');
                          }}
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4', airport === airportItem.iata ? 'opacity-100' : 'opacity-0')}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{airportItem.iata}</span>
                            <span className="text-sm text-muted-foreground">{airportItem.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date Selection - 표준 DatePicker */}
            <Popover open={openCalendarPopover} onOpenChange={setOpenCalendarPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dayjs(date).format('MMM DD, YYYY')}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={dayjs(date).toDate()}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setIsSomethingChanged(date !== dayjs(selectedDate).format('YYYY-MM-DD'));
                      setDate(dayjs(selectedDate).format('YYYY-MM-DD'));
                      setOpenCalendarPopover(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Load Button */}
          <Button
            onClick={() => {
              // 🔄 새로운 데이터 로드 전에 기존 데이터 리셋
              resetPassenger();
              resetProcessFlow();

              // Load 버튼 클릭 시에만 store에 저장
              setStoreAirport(airport);
              setStoreDate(date);

              // 부모 컴포넌트의 loadData 함수 호출
              onLoadData(airport, date);
            }}
            disabled={loadingFlightSchedule || !airport}
            title={!airport ? 'Please select an airport first' : 'Load flight schedule data'}
          >
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
