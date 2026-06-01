'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Building2, ChevronDown, Filter, Flag, MapPin, Plane, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../../_stores';
import Spinner from '@/components/ui/Spinner';
import {
  type TerminalAirlineCombo,
  type SelectedFilter,
  convertTerminalAirlinesToApiCondition,
  createAllCombosForTerminal,
  createTerminalAirlineCombo,
  filterCombosByTerminal,
  removeCombo,
  removeCombosByTerminal,
  createAirlineFlightId,
  parseAirlineFlightId,
  buildConditionFlightSets,
  intersectSets,
} from './flight-utils';
import type {
  FlightFiltersResponse,
  FlightFilterOption,
  FlightDirectionFilters,
  RegionFlightFilterOption,
  AircraftClassFlightFilterOption,
} from '@/types/api/simulations';

type FlightFiltersApiResponse = FlightFiltersResponse;
type FilterOption = FlightFilterOption;
type FilterAirlineEntry = FilterOption['airlines'][string];
type RegionFilterOption = RegionFlightFilterOption;
type AircraftClassFilterOption = AircraftClassFlightFilterOption;

interface FlightDetail {
  flightId: string;
  airline: string;
  airlineName: string;
  destination: string | null;
  terminal: string | null;
  flightType: string | null;
  aircraftType: string | null;
  aircraftClass: string | null;
}

interface FlightFilterConditionsProps {
  loading: boolean;
  onApplyFilter: (
    type: string,
    conditions: Array<{ field: string; values: string[] }>
  ) => Promise<unknown>;
  isEmbedded?: boolean;
  // Multi-tab controlled mode
  controlled?: boolean;
  overrideFlightData?: {
    total_flights: number | null;
    airlines: Record<string, string> | null;
    filters: FlightFiltersResponse['filters'] | Record<string, unknown> | null;
  } | null;
  initialSelectedFilter?: SelectedFilter;
  onFilterChange?: (filter: SelectedFilter) => void;
  onEstimatedFlightsChange?: (estimated: number, total: number) => void;
  showActions?: boolean;
}

// ==================== Dropdown Component for Region Countries ====================
interface RegionCountriesDropdownProps {
  regionName: string;
  regionData: RegionFilterOption;
  currentCountries: string[];
  handleCountryToggle: (
    countryName: string,
    regionName: string,
    regionData: RegionFilterOption,
    checked: boolean
  ) => void;
}

function RegionCountriesDropdown({
  regionName,
  regionData,
  currentCountries,
  handleCountryToggle,
}: RegionCountriesDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort countries: first by flight count (descending), then by name (ascending) when counts are equal
  const sortedCountries = useMemo(() => {
    return Object.entries(regionData.countries)
      .sort(([nameA, a], [nameB, b]) => {
        // First sort by count (descending)
        if (b.total_flights !== a.total_flights) {
          return b.total_flights - a.total_flights;
        }
        // If counts are equal, sort by country name (ascending)
        return nameA.localeCompare(nameB);
      });
  }, [regionData.countries]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return sortedCountries;

    return sortedCountries.filter(([countryName]) => {
      return countryName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [sortedCountries, searchQuery]);

  // Check if all filtered countries are selected
  const areAllFilteredSelected = useMemo(() => {
    if (filteredCountries.length === 0) return false;
    return filteredCountries.every(([countryName]) => currentCountries.includes(countryName));
  }, [filteredCountries, currentCountries]);

  // Handle select all for filtered countries
  const handleSelectAll = (checked: boolean) => {
    filteredCountries.forEach(([countryName]) => {
      const isCurrentlySelected = currentCountries.includes(countryName);
      if (checked && !isCurrentlySelected) {
        handleCountryToggle(countryName, regionName, regionData, true);
      } else if (!checked && isCurrentlySelected) {
        handleCountryToggle(countryName, regionName, regionData, false);
      }
    });
  };

  return (
    <div className="space-y-2">
      {/* Header with Select All on the right */}
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="text-xs font-medium text-muted-foreground truncate flex-1 mr-2">
          Countries in {regionName}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Checkbox
            id={`select-all-${regionName}`}
            checked={areAllFilteredSelected}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
          <Label
            htmlFor={`select-all-${regionName}`}
            className="cursor-pointer text-xs font-medium"
          >
            Select All
          </Label>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Countries List */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredCountries.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No countries found
          </div>
        ) : (
          filteredCountries.map(([countryName, countryData]: [string, FilterOption]) => {
            const isCountrySelected = currentCountries.includes(countryName);

            return (
              <div
                key={countryName}
                className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted/50"
              >
                <Checkbox
                  id={`country-${regionName}-${countryName}`}
                  checked={isCountrySelected}
                  onCheckedChange={(checked) =>
                    handleCountryToggle(countryName, regionName, regionData, !!checked)
                  }
                />
                <Label
                  htmlFor={`country-${regionName}-${countryName}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {countryName} | {countryData.total_flights.toLocaleString()} flights
                </Label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== Dropdown Component for Terminal Airlines ====================
interface TerminalAirlinesDropdownProps {
  terminalName: string;
  terminalData: FilterOption;
  currentTerminalAirlines: string[];
  currentTerminals: string[];
  airlinesMapping: Record<string, string> | null;
  handleAirlineToggle: (
    terminalName: string,
    airlineCode: string,
    airlineData: FilterOption['airlines'][string],
    checked: boolean
  ) => void;
  handleTerminalToggle: (
    terminalName: string,
    terminalData: FilterOption,
    checked: boolean
  ) => void;
  getValueDisplayName: (category: string, value: string) => string;
  category: string;
}

function TerminalAirlinesDropdown({
  terminalName,
  terminalData,
  currentTerminalAirlines,
  currentTerminals,
  airlinesMapping,
  handleAirlineToggle,
  handleTerminalToggle,
  getValueDisplayName,
  category,
}: TerminalAirlinesDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort airlines: first by count (descending), then by name (ascending) when counts are equal
  const sortedAirlines = useMemo(() => {
    return Object.entries(terminalData.airlines)
      .sort(([codeA, a]: [string, FilterAirlineEntry], [codeB, b]: [string, FilterAirlineEntry]) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort by airline name (ascending)
        const nameA = `${codeA} - ${airlinesMapping?.[codeA] || codeA}`.toLowerCase();
        const nameB = `${codeB} - ${airlinesMapping?.[codeB] || codeB}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [terminalData.airlines, airlinesMapping]);

  // Filter airlines based on search query
  const filteredAirlines = useMemo(() => {
    if (!searchQuery) return sortedAirlines;

    return sortedAirlines.filter(([airlineCode]) => {
      const airlineName = airlinesMapping?.[airlineCode] || airlineCode;
      const fullName = `${airlineCode} - ${airlineName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [sortedAirlines, searchQuery, airlinesMapping]);

  // Check if all filtered airlines are selected
  const areAllFilteredSelected = useMemo(() => {
    if (filteredAirlines.length === 0) return false;
    return filteredAirlines.every(([airlineCode]) =>
      currentTerminalAirlines.includes(createTerminalAirlineCombo(terminalName, airlineCode))
    );
  }, [filteredAirlines, currentTerminalAirlines, terminalName]);

  // Handle select all for filtered airlines
  const handleSelectAll = (checked: boolean) => {
    // First toggle all airlines
    filteredAirlines.forEach(([airlineCode, airlineData]) => {
      const isCurrentlySelected = currentTerminalAirlines.includes(
        createTerminalAirlineCombo(terminalName, airlineCode)
      );
      if (checked && !isCurrentlySelected) {
        handleAirlineToggle(terminalName, airlineCode, airlineData, true);
      } else if (!checked && isCurrentlySelected) {
        handleAirlineToggle(terminalName, airlineCode, airlineData, false);
      }
    });

    // If unchecking and all airlines in the terminal are now deselected, uncheck the terminal too
    if (!checked) {
      // Check if any airlines remain selected in this terminal after deselection
      const allAirlinesInTerminal = Object.keys(terminalData.airlines);
      const remainingSelectedAirlines = allAirlinesInTerminal.filter((airlineCode) =>
        currentTerminalAirlines.includes(createTerminalAirlineCombo(terminalName, airlineCode))
      );

      // If no airlines are selected, uncheck the terminal
      if (remainingSelectedAirlines.length === 0 && currentTerminals.includes(terminalName)) {
        handleTerminalToggle(terminalName, terminalData, false);
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Header with Select All on the right */}
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="text-xs font-medium text-muted-foreground truncate flex-1 mr-2">
          Airlines in {getValueDisplayName(category, terminalName)}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Checkbox
            id={`select-all-${terminalName}`}
            checked={areAllFilteredSelected}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
          <Label
            htmlFor={`select-all-${terminalName}`}
            className="cursor-pointer text-xs font-medium"
          >
            Select All
          </Label>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Airlines List */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredAirlines.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No airlines found
          </div>
        ) : (
          filteredAirlines.map(([airlineCode, airlineData]: [string, FilterAirlineEntry]) => {
            const isAirlineSelected = currentTerminalAirlines.includes(
              createTerminalAirlineCombo(terminalName, airlineCode)
            );
            const airlineName = airlinesMapping?.[airlineCode] || airlineCode;

            return (
              <div
                key={airlineCode}
                className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted/50"
              >
                <Checkbox
                  id={`airline-${terminalName}-${airlineCode}`}
                  checked={isAirlineSelected}
                  onCheckedChange={(checked) =>
                    handleAirlineToggle(terminalName, airlineCode, airlineData, !!checked)
                  }
                />
                <Label
                  htmlFor={`airline-${terminalName}-${airlineCode}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {airlineName} | {airlineData.count.toLocaleString()} flights
                </Label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== Dropdown Component for Airline Flight Numbers ====================
interface AirlineFlightNumbersDropdownProps {
  airlineCode: string;
  airlineName: string;
  /** API 응답의 flight_numbers – 이미 "PR221" 형식의 문자열 배열 */
  flightNumbers: string[];
  /** airline_flight_ids 상태 – "airlineCode||flightId" 형식 */
  selectedFlightIds: string[];
  handleFlightNumberToggle: (airlineCode: string, flightId: string, checked: boolean) => void;
}

function AirlineFlightNumbersDropdown({
  airlineCode,
  airlineName,
  flightNumbers,
  selectedFlightIds,
  handleFlightNumberToggle,
}: AirlineFlightNumbersDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedFlightNumbers = useMemo(
    () => [...flightNumbers].map(String).sort((a, b) => a.localeCompare(b)),
    [flightNumbers]
  );

  const filteredFlightNumbers = useMemo(() => {
    if (!searchQuery) return sortedFlightNumbers;
    const q = searchQuery.toLowerCase();
    return sortedFlightNumbers.filter((fn) => fn.toLowerCase().includes(q));
  }, [sortedFlightNumbers, searchQuery]);

  const areAllSelected = useMemo(() => {
    if (filteredFlightNumbers.length === 0) return false;
    return filteredFlightNumbers.every((fn) =>
      selectedFlightIds.includes(createAirlineFlightId(airlineCode, fn))
    );
  }, [filteredFlightNumbers, selectedFlightIds, airlineCode]);

  const handleSelectAll = (checked: boolean) => {
    filteredFlightNumbers.forEach((fn) => {
      const isSelected = selectedFlightIds.includes(createAirlineFlightId(airlineCode, fn));
      if (checked && !isSelected) handleFlightNumberToggle(airlineCode, fn, true);
      else if (!checked && isSelected) handleFlightNumberToggle(airlineCode, fn, false);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="text-xs font-medium text-muted-foreground truncate flex-1 mr-2">
          {airlineName} flight numbers
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Checkbox
            id={`select-all-fn-${airlineCode}`}
            checked={areAllSelected}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
          <Label htmlFor={`select-all-fn-${airlineCode}`} className="cursor-pointer text-xs font-medium">
            Select All
          </Label>
        </div>
      </div>

      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search flight numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredFlightNumbers.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">No flights found</div>
        ) : (
          filteredFlightNumbers.map((fn) => {
            const internalId = createAirlineFlightId(airlineCode, fn);
            const isSelected = selectedFlightIds.includes(internalId);
            return (
              <div key={fn} className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted/50">
                <Checkbox
                  id={`fn-${airlineCode}-${fn}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleFlightNumberToggle(airlineCode, fn, !!checked)}
                />
                <Label htmlFor={`fn-${airlineCode}-${fn}`} className="flex-1 cursor-pointer text-sm font-mono">
                  {fn}
                </Label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== Dropdown Component for Aircraft Class Types ====================
interface ClassAircraftTypesDropdownProps {
  cls: string;
  displayCls: string;
  aircraftTypes: Record<string, { count: number; flight_numbers: string[] }>;
  selectedTypeIds: string[];
  handleAircraftTypeToggle: (cls: string, typeName: string, checked: boolean) => void;
}

function ClassAircraftTypesDropdown({
  cls,
  displayCls,
  aircraftTypes,
  selectedTypeIds,
  handleAircraftTypeToggle,
}: ClassAircraftTypesDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedTypes = useMemo(
    () => Object.entries(aircraftTypes).sort(([, a], [, b]) => b.count - a.count),
    [aircraftTypes]
  );

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return sortedTypes;
    const q = searchQuery.toLowerCase();
    return sortedTypes.filter(([name]) => name.toLowerCase().includes(q));
  }, [sortedTypes, searchQuery]);

  const prefix = `${cls}||`;

  const areAllSelected = useMemo(() => {
    if (filteredTypes.length === 0) return false;
    return filteredTypes.every(([name]) => selectedTypeIds.includes(`${prefix}${name}`));
  }, [filteredTypes, selectedTypeIds, prefix]);

  const handleSelectAll = (checked: boolean) => {
    filteredTypes.forEach(([name]) => {
      const isSelected = selectedTypeIds.includes(`${prefix}${name}`);
      if (checked && !isSelected) handleAircraftTypeToggle(cls, name, true);
      else if (!checked && isSelected) handleAircraftTypeToggle(cls, name, false);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="text-xs font-medium text-muted-foreground truncate flex-1 mr-2">
          Aircraft types in {displayCls}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Checkbox
            id={`select-all-cls-${cls}`}
            checked={areAllSelected}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
          <Label htmlFor={`select-all-cls-${cls}`} className="cursor-pointer text-xs font-medium">
            Select All
          </Label>
        </div>
      </div>

      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search aircraft types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredTypes.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">No aircraft types found</div>
        ) : (
          filteredTypes.map(([name, data]) => {
            const internalId = `${prefix}${name}`;
            const isSelected = selectedTypeIds.includes(internalId);
            return (
              <div key={name} className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted/50">
                <Checkbox
                  id={`acft-type-${cls}-${name}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleAircraftTypeToggle(cls, name, !!checked)}
                />
                <Label htmlFor={`acft-type-${cls}-${name}`} className="flex-1 cursor-pointer text-sm">
                  {name} | {data.count.toLocaleString()} flights
                </Label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== Component ====================
function FlightFilterConditions({
  loading,
  onApplyFilter,
  isEmbedded = false,
  controlled = false,
  overrideFlightData,
  initialSelectedFilter,
  onFilterChange,
  onEstimatedFlightsChange,
  showActions = true,
}: FlightFilterConditionsProps) {
  const { toast } = useToast();

  // Zustand 구독 (controlled 모드에서도 hook은 항상 호출 - Rules of Hooks)
  const flightDataFromStore = useSimulationStore((state) => state.flight);
  const selectedConditions = useSimulationStore((state) => state.flight.selectedConditions);
  const setSelectedConditions = useSimulationStore((state) => state.setSelectedConditions);
  const airport = useSimulationStore((state) => state.context.airport);
  const date = useSimulationStore((state) => state.context.date);
  const scenarioId = useSimulationStore((state) => state.context.scenarioId);

  // Stable refs for callback props (prevents infinite loops from inline arrow functions)
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;
  const onEstimatedFlightsChangeRef = useRef(onEstimatedFlightsChange);
  onEstimatedFlightsChangeRef.current = onEstimatedFlightsChange;

  const [isApplying, setIsApplying] = useState(false);
  const [summarySearch, setSummarySearch] = useState('');
  const [summarySort, setSummarySort] = useState<{ col: keyof FlightDetail; dir: 'asc' | 'desc' }>({ col: 'airline', dir: 'asc' });

  // Memoize filtersData to prevent infinite render loops:
  // Without this, a new object is created every render → getEstimatedFilteredFlights
  // gets a new identity → useEffect fires → parent setState → re-render → loop
  const srcTotalFlights = controlled ? overrideFlightData?.total_flights : flightDataFromStore.total_flights;
  const srcAirlines = controlled ? overrideFlightData?.airlines : flightDataFromStore.airlines;
  const srcFilters = controlled ? overrideFlightData?.filters : flightDataFromStore.filters;

  const filtersRecord = srcFilters as FlightFiltersResponse['filters'] | null;

  const filtersData = useMemo<FlightFiltersApiResponse | null>(() => {
    if (!filtersRecord) return null;

    const depTotal = filtersRecord.departure?.total_flights;
    const arrTotal = filtersRecord.arrival?.total_flights;
    const hasNumericDep = typeof depTotal === 'number';
    const hasNumericArr = typeof arrTotal === 'number';
    if (!hasNumericDep && !hasNumericArr) return null;

    const total_flights =
      typeof srcTotalFlights === 'number' ? srcTotalFlights : (depTotal ?? 0);

    return {
      airport,
      date,
      scenario_id: scenarioId,
      total_flights,
      airlines: srcAirlines || {},
      filters: filtersRecord,
    } as FlightFiltersApiResponse;
  }, [srcTotalFlights, srcAirlines, filtersRecord, airport, date, scenarioId]);

  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>(
    initialSelectedFilter || { mode: 'departure', categories: {} }
  );

  // Report filter changes to parent via ref (avoids infinite loop)
  const prevSelectedFilterRef = useRef(selectedFilter);
  useEffect(() => {
    if (!controlled) return;
    if (prevSelectedFilterRef.current !== selectedFilter) {
      prevSelectedFilterRef.current = selectedFilter;
      onFilterChangeRef.current?.(selectedFilter);
    }
  }, [controlled, selectedFilter]);

  const [hasRestoredFromZustand, setHasRestoredFromZustand] = useState(controlled ? true : false);

  useEffect(() => {
    if (controlled) return;
    if (selectedConditions && !hasRestoredFromZustand) {
      let categories: SelectedFilter['categories'] = {};

      if (selectedConditions.originalLocalState) {
        categories = selectedConditions.originalLocalState as unknown as SelectedFilter['categories'];
      } else {
        selectedConditions.conditions.forEach((condition) => {
          categories[condition.field] = condition.values;
        });
      }

      if (Object.keys(categories).length > 0) {
        setSelectedFilter({
          mode: selectedConditions.type,
          categories: categories,
        });
      }

      setHasRestoredFromZustand(true);
    }
  }, [controlled, selectedConditions, hasRestoredFromZustand]);

  // 🆕 Region 드롭다운 open 상태는 DropdownMenu가 자체 관리

  // ✅ Response Preview 상태 제거 (부모 컴포넌트에서 관리)

  // ==================== Helper Functions ====================

  // 카테고리 순서 정의: Type -> Terminal -> Location(Region with Countries)
  const getCategoryOrder = useCallback((mode: string) => {
    // departure 모드일 때는 도착지 지역을, arrival 모드일 때는 출발지 지역을 필터링
    const oppositeMode = mode === 'departure' ? 'arrival' : 'departure';
    const order = ['flight_type', `${mode}_terminal`, 'aircraft_class', `${oppositeMode}_region`];
    return order;
  }, []);

  // 카테고리 표시 이름 변환 (수식어 제거)
  const getCategoryDisplayName = useCallback((category: string): string => {
    if (category.includes('terminal')) return 'Terminal';
    if (category.includes('region')) return 'Region';
    if (category.includes('country')) return 'Country';
    if (category === 'flight_type') return 'Type';
    if (category === 'aircraft_class') return 'Class';
    return category;
  }, []);

  // 값 표시 이름 변환
  const getValueDisplayName = useCallback((category: string, value: string): string => {
    if (category.includes('terminal')) {
      return value === 'unknown' ? 'Unknown' : `Terminal ${value}`;
    }
    return value;
  }, []);

  // ==================== Event Handlers ====================

  // 모드 변경
  const handleModeChange = useCallback((mode: 'departure' | 'arrival') => {
    setSelectedFilter({
      mode,
      categories: {},
    });
  }, []);

  // 🆕 Region 전체 선택/해제
  const handleRegionToggle = useCallback((regionName: string, regionData: RegionFilterOption, checked: boolean) => {
    setSelectedFilter((prev) => {
      const currentRegions = prev.categories.region || [];
      const currentCountries = prev.categories.countries || [];

      if (checked) {
        // Region 선택: Region과 모든 하위 Countries 추가
        const allCountriesInRegion = Object.keys(regionData.countries);
        return {
          ...prev,
          categories: {
            ...prev.categories,
            region: [...currentRegions.filter((r) => r !== regionName), regionName],
            countries: [...currentCountries.filter((c) => !allCountriesInRegion.includes(c)), ...allCountriesInRegion],
          },
        };
      } else {
        // Region 해제: Region과 모든 하위 Countries 제거
        const allCountriesInRegion = Object.keys(regionData.countries);
        return {
          ...prev,
          categories: {
            ...prev.categories,
            region: currentRegions.filter((r) => r !== regionName),
            countries: currentCountries.filter((c) => !allCountriesInRegion.includes(c)),
          },
        };
      }
    });
  }, []);

  // 🆕 개별 Country 선택/해제 (UI 개선: 하나라도 선택되면 Region 체크 표시)
  const handleCountryToggle = useCallback(
    (countryName: string, regionName: string, regionData: RegionFilterOption, checked: boolean) => {
      setSelectedFilter((prev) => {
        const currentRegions = prev.categories.region || [];
        const currentCountries = prev.categories.countries || [];
        const allCountriesInRegion = Object.keys(regionData.countries);

        if (checked) {
          // Country 추가
          const newCountries = [...currentCountries.filter((c) => c !== countryName), countryName];
          const selectedCountriesInRegion = newCountries.filter((c) => allCountriesInRegion.includes(c));

          // 🆕 개선: 해당 Region의 국가가 하나라도 선택되었으면 Region도 선택 표시
          const newRegions =
            selectedCountriesInRegion.length > 0
              ? [...currentRegions.filter((r) => r !== regionName), regionName]
              : currentRegions.filter((r) => r !== regionName);

          return {
            ...prev,
            categories: {
              ...prev.categories,
              region: newRegions,
              countries: newCountries,
            },
          };
        } else {
          // Country 제거
          const newCountries = currentCountries.filter((c) => c !== countryName);
          const selectedCountriesInRegion = newCountries.filter((c) => allCountriesInRegion.includes(c));

          // 🆕 개선: 해당 Region의 국가가 하나도 선택되지 않았으면 Region 해제
          const newRegions =
            selectedCountriesInRegion.length === 0
              ? currentRegions.filter((r) => r !== regionName)
              : [...currentRegions.filter((r) => r !== regionName), regionName];

          return {
            ...prev,
            categories: {
              ...prev.categories,
              region: newRegions,
              countries: newCountries,
            },
          };
        }
      });
    },
    []
  );

  // 🆕 Terminal 전체 선택/해제 (Terminal-Airline 조합 방식)
  const handleTerminalToggle = useCallback((terminalName: string, terminalData: FilterOption, checked: boolean) => {
    setSelectedFilter((prev) => {
      const terminalField = `${prev.mode}_terminal`;
      const currentTerminals = (prev.categories[terminalField] as string[]) || [];
      const currentTerminalAirlines = prev.categories.terminal_airlines || [];

      if (checked) {
        // Terminal 선택: Terminal과 모든 하위 Terminal-Airline 조합 추가
        const terminalAirlineCombos = createAllCombosForTerminal(terminalName, Object.keys(terminalData.airlines));
        return {
          ...prev,
          categories: {
            ...prev.categories,
            [terminalField]: [...currentTerminals.filter((t) => t !== terminalName), terminalName],
            terminal_airlines: [
              ...removeCombosByTerminal(currentTerminalAirlines, terminalName),
              ...terminalAirlineCombos,
            ],
          },
        };
      } else {
        // Terminal 해제: Terminal과 해당 Terminal의 모든 Terminal-Airline 조합 제거
        const remainingTerminals = currentTerminals.filter((t) => t !== terminalName);
        const remainingCombos = removeCombosByTerminal(currentTerminalAirlines, terminalName);

        return {
          ...prev,
          categories: {
            ...prev.categories,
            [terminalField]: remainingTerminals.length > 0 ? remainingTerminals : undefined,
            terminal_airlines: remainingCombos.length > 0 ? remainingCombos : undefined,
          },
        };
      }
    });
  }, []);

  // 🆕 Airline 선택/해제 (Terminal-Airline 조합 방식)
  const handleAirlineToggle = useCallback(
    (terminalName: string, airlineCode: string, airlineData: FilterOption['airlines'][string], checked: boolean) => {
      setSelectedFilter((prev) => {
        const terminalField = `${prev.mode}_terminal`;
        const currentTerminals = (prev.categories[terminalField] as string[]) || [];
        const currentTerminalAirlines = prev.categories.terminal_airlines || [];
        const terminalAirlineCombo = createTerminalAirlineCombo(terminalName, airlineCode);

        if (checked) {
          // Airline 선택: Terminal-Airline 조합 추가, Terminal도 체크 표시를 위해 추가
          const updatedTerminals = currentTerminals.includes(terminalName)
            ? currentTerminals
            : [...currentTerminals, terminalName];
          const updatedTerminalAirlines = [
            ...currentTerminalAirlines.filter((combo) => combo !== terminalAirlineCombo),
            terminalAirlineCombo,
          ];

          return {
            ...prev,
            categories: {
              ...prev.categories,
              [terminalField]: updatedTerminals,
              terminal_airlines: updatedTerminalAirlines,
            },
          };
        } else {
          // Airline 해제: Terminal-Airline 조합만 제거 (Terminal 체크는 유지)
          const remainingCombos = removeCombo(currentTerminalAirlines, terminalAirlineCombo);

          return {
            ...prev,
            categories: {
              ...prev.categories,
              terminal_airlines: remainingCombos.length > 0 ? remainingCombos : undefined,
            },
          };
        }
      });
    },
    []
  );

  // ==================== Airline Filter Handlers ====================

  // 항공사 전체 선택/해제
  const handleAirlineFilterToggle = useCallback(
    (airlineCode: string, allFlightIds: string[], checked: boolean) => {
      setSelectedFilter((prev) => {
        const currentAirlines = prev.categories.selected_airlines || [];
        const currentFlightIds = prev.categories.airline_flight_ids || [];
        const prefix = `${airlineCode}||`;

        if (checked) {
          const newAirlines = currentAirlines.includes(airlineCode)
            ? currentAirlines
            : [...currentAirlines, airlineCode];
          const newFlightIds = [
            ...currentFlightIds.filter((id) => !id.startsWith(prefix)),
            ...allFlightIds.map((fn) => createAirlineFlightId(airlineCode, fn)),
          ];
          return {
            ...prev,
            categories: {
              ...prev.categories,
              selected_airlines: newAirlines,
              airline_flight_ids: newFlightIds,
            },
          };
        } else {
          const newAirlines = currentAirlines.filter((c) => c !== airlineCode);
          const newFlightIds = currentFlightIds.filter((id) => !id.startsWith(prefix));
          return {
            ...prev,
            categories: {
              ...prev.categories,
              selected_airlines: newAirlines.length > 0 ? newAirlines : undefined,
              airline_flight_ids: newFlightIds.length > 0 ? newFlightIds : undefined,
            },
          };
        }
      });
    },
    []
  );

  // 특정 편번호 선택/해제
  const handleFlightNumberToggle = useCallback(
    (airlineCode: string, flightId: string, checked: boolean) => {
      setSelectedFilter((prev) => {
        const currentAirlines = prev.categories.selected_airlines || [];
        const currentFlightIds = prev.categories.airline_flight_ids || [];
        const internalId = createAirlineFlightId(airlineCode, flightId);
        const prefix = `${airlineCode}||`;

        if (checked) {
          const newFlightIds = currentFlightIds.includes(internalId)
            ? currentFlightIds
            : [...currentFlightIds, internalId];
          const newAirlines = currentAirlines.includes(airlineCode)
            ? currentAirlines
            : [...currentAirlines, airlineCode];
          return {
            ...prev,
            categories: {
              ...prev.categories,
              selected_airlines: newAirlines,
              airline_flight_ids: newFlightIds,
            },
          };
        } else {
          const newFlightIds = currentFlightIds.filter((id) => id !== internalId);
          const hasRemaining = newFlightIds.some((id) => id.startsWith(prefix));
          const newAirlines = hasRemaining
            ? currentAirlines
            : currentAirlines.filter((c) => c !== airlineCode);
          return {
            ...prev,
            categories: {
              ...prev.categories,
              selected_airlines: newAirlines.length > 0 ? newAirlines : undefined,
              airline_flight_ids: newFlightIds.length > 0 ? newFlightIds : undefined,
            },
          };
        }
      });
    },
    []
  );

  // 항공기 등급 전체 선택/해제
  const handleClassToggle = useCallback(
    (cls: string, allTypeNames: string[], checked: boolean) => {
      setSelectedFilter((prev) => {
        const currentClasses = prev.categories.selected_aircraft_classes || [];
        const currentTypeIds = prev.categories.aircraft_type_flight_ids || [];
        const prefix = `${cls}||`;

        if (checked) {
          const newClasses = currentClasses.includes(cls) ? currentClasses : [...currentClasses, cls];
          const newTypeIds = [
            ...currentTypeIds.filter((id) => !id.startsWith(prefix)),
            ...allTypeNames.map((name) => `${prefix}${name}`),
          ];
          return { ...prev, categories: { ...prev.categories, selected_aircraft_classes: newClasses, aircraft_type_flight_ids: newTypeIds } };
        } else {
          const newClasses = currentClasses.filter((c) => c !== cls);
          const newTypeIds = currentTypeIds.filter((id) => !id.startsWith(prefix));
          return {
            ...prev,
            categories: {
              ...prev.categories,
              selected_aircraft_classes: newClasses.length > 0 ? newClasses : undefined,
              aircraft_type_flight_ids: newTypeIds.length > 0 ? newTypeIds : undefined,
            },
          };
        }
      });
    },
    []
  );

  // 항공기 기종 개별 선택/해제
  const handleAircraftTypeToggle = useCallback(
    (cls: string, typeName: string, checked: boolean) => {
      setSelectedFilter((prev) => {
        const currentClasses = prev.categories.selected_aircraft_classes || [];
        const currentTypeIds = prev.categories.aircraft_type_flight_ids || [];
        const internalId = `${cls}||${typeName}`;
        const prefix = `${cls}||`;

        if (checked) {
          const newTypeIds = currentTypeIds.includes(internalId) ? currentTypeIds : [...currentTypeIds, internalId];
          const newClasses = currentClasses.includes(cls) ? currentClasses : [...currentClasses, cls];
          return { ...prev, categories: { ...prev.categories, selected_aircraft_classes: newClasses, aircraft_type_flight_ids: newTypeIds } };
        } else {
          const newTypeIds = currentTypeIds.filter((id) => id !== internalId);
          const hasRemaining = newTypeIds.some((id) => id.startsWith(prefix));
          const newClasses = hasRemaining ? currentClasses : currentClasses.filter((c) => c !== cls);
          return {
            ...prev,
            categories: {
              ...prev.categories,
              selected_aircraft_classes: newClasses.length > 0 ? newClasses : undefined,
              aircraft_type_flight_ids: newTypeIds.length > 0 ? newTypeIds : undefined,
            },
          };
        }
      });
    },
    []
  );

  // 카테고리 값 선택/해제 (기존 로직: terminal, flight_type용)
  const handleCategoryValueChange = useCallback((category: string, value: string, checked: boolean) => {
    setSelectedFilter((prev) => {
      const currentValues = prev.categories[category as keyof typeof prev.categories];

      if (category === 'flight_type' || category.includes('terminal')) {
        // Type과 Terminal은 다중 선택 (배열)
        const currentArray = (currentValues as string[]) || [];
        const newArray = checked ? [...currentArray, value] : currentArray.filter((v) => v !== value);

        return {
          ...prev,
          categories: {
            ...prev.categories,
            [category]: newArray.length > 0 ? newArray : undefined,
          },
        };
      } else {
        // Region/Country는 기존 로직 유지 (handleRegionToggle, handleCountryToggle에서 처리)
        return prev;
      }
    });
  }, []);

  // 🆕 선택된 국가들의 편수 계산
  const getSelectedFlightsCount = useCallback(
    (regionName: string, regionData: RegionFilterOption): number => {
      const currentCountries = selectedFilter.categories.countries || [];
      const selectedCountriesInRegion = currentCountries.filter((c) => Object.keys(regionData.countries).includes(c));

      return selectedCountriesInRegion.reduce((total, countryName) => {
        return total + (regionData.countries[countryName]?.total_flights || 0);
      }, 0);
    },
    [selectedFilter.categories.countries]
  );

  // 🆕 편명 교집합으로 정확한 필터링 편수 계산 (간단한 버전)
  const getEstimatedFilteredFlights = useCallback((): string => {
    if (!filtersData?.filters?.[selectedFilter.mode]) return '0';
    const modeFilters = filtersData.filters[selectedFilter.mode];
    const total = modeFilters.total_flights || 0;
    const categories = selectedFilter.categories;

    const hasFilters = Object.values(categories).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
    if (!hasFilters) return total.toString();

    try {
      const sets = buildConditionFlightSets(modeFilters, categories, selectedFilter.mode);
      const intersection = intersectSets(sets);
      if (!intersection) return total.toString();
      return intersection.size.toString();
    } catch {
      return total.toString();
    }
  }, [selectedFilter, filtersData]);

  // controlled 모드: 예상 필터링 편수를 부모에 리포트 (ref로 infinite loop 방지)
  useEffect(() => {
    if (!controlled || !filtersData) return;
    const estimated = parseInt(getEstimatedFilteredFlights()) || 0;
    const total = filtersData.filters?.[selectedFilter.mode]?.total_flights || 0;
    onEstimatedFlightsChangeRef.current?.(estimated, total);
  }, [controlled, getEstimatedFilteredFlights, filtersData, selectedFilter.mode]);

  // 🆕 조건을 API 형식으로 변환하는 공통 함수
  const convertConditionsForAPI = useCallback((): Array<{ field: string; values: string[] }> => {
    const conditions: Array<{ field: string; values: string[] }> = [];

    Object.entries(selectedFilter.categories).forEach(([category, value]) => {
      if (value) {
        if (category === 'region' && Array.isArray(value) && value.length > 0) {
          // Region 필터: 모드에 따라 올바른 field 사용
          const regionField = selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region';
          conditions.push({
            field: regionField,
            values: value,
          });
        } else if (category === 'countries') {
          // 🆕 Countries는 Region이 전체 선택이 아닌 경우에만 전송
          const currentRegions = selectedFilter.categories.region || [];
          const currentCountries = selectedFilter.categories.countries || [];

          // 전체가 아닌 부분 선택된 국가들만 전송
          const partialCountries: string[] = [];

          // 각 선택된 Region에 대해 확인
          if (filtersData?.filters?.[selectedFilter.mode]) {
            const modeFilters = filtersData.filters[selectedFilter.mode];
            const regionField = selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region';
            const regionOptions = modeFilters[regionField];

            if (regionOptions) {
              Object.entries(regionOptions).forEach(([regionName, regionData]: [string, RegionFilterOption]) => {
                const allCountriesInRegion = Object.keys(regionData.countries);
                const selectedCountriesInRegion = currentCountries.filter((c) => allCountriesInRegion.includes(c));

                // Region이 선택되었지만 일부 국가만 선택된 경우
                if (
                  currentRegions.includes(regionName) &&
                  selectedCountriesInRegion.length < allCountriesInRegion.length &&
                  selectedCountriesInRegion.length > 0
                ) {
                  partialCountries.push(...selectedCountriesInRegion);
                }
              });
            }
          }

          if (partialCountries.length > 0) {
            // Countries 필터: 모드에 따라 올바른 field 사용
            const countryField = selectedFilter.mode === 'departure' ? 'arrival_country' : 'departure_country';
            conditions.push({
              field: countryField,
              values: partialCountries,
            });
          }
        } else if (category === 'terminal_airlines' && Array.isArray(value) && value.length > 0) {
          // 🆕 Terminal-Airline 조합을 API 바디 형태로 변환
          const apiCondition = convertTerminalAirlinesToApiCondition(value);
          if (apiCondition) {
            conditions.push(apiCondition);
          }
        } else if (category === 'airline_flight_ids' && Array.isArray(value) && value.length > 0) {
          // "airlineCode||flightId" → flightId 부분만 추출하여 flight_number 조건으로 전송
          const flightNumbers = value
            .map((id) => parseAirlineFlightId(id)?.flightId ?? null)
            .filter(Boolean) as string[];
          if (flightNumbers.length > 0) {
            conditions.push({ field: 'flight_number', values: flightNumbers });
          }
        } else if (category === 'selected_airlines') {
          // selected_airlines 는 airline_flight_ids 가 없을 때 fallback
          const airlineFlightIds = selectedFilter.categories.airline_flight_ids || [];
          if (airlineFlightIds.length === 0 && Array.isArray(value) && value.length > 0) {
            conditions.push({ field: 'operating_carrier_iata', values: value });
          }
        } else if (Array.isArray(value) && value.length > 0) {
          // 배열인 경우 (Type, Terminal - 다중 선택)
          let fieldName = category;

          // Terminal 필드는 모드에 따라 매핑
          if (category === 'departure_terminal' || category === 'arrival_terminal') {
            fieldName = category; // 이미 올바른 형태
          }

          conditions.push({
            field: fieldName,
            values: value,
          });
        } else if (typeof value === 'string') {
          // 문자열인 경우 (backward compatibility)
          let fieldName = category;

          // Terminal 필드는 모드에 따라 매핑
          if (category === 'departure_terminal' || category === 'arrival_terminal') {
            fieldName = category; // 이미 올바른 형태
          }

          conditions.push({
            field: fieldName,
            values: [value],
          });
        }
      }
    });

    return conditions;
  }, [selectedFilter, filtersData]);

  // Apply Filter 실행
  const handleApplyFilter = useCallback(async () => {
    const conditions = convertConditionsForAPI();

    try {
      setIsApplying(true);

      const totalFiltered = parseInt(getEstimatedFilteredFlights()) || 0;

      if (!controlled) {
        const totalAvailable = filtersData?.filters?.[selectedFilter.mode]?.total_flights || 0;

        setSelectedConditions({
          type: selectedFilter.mode as 'departure' | 'arrival',
          conditions: conditions,
          expected_flights: {
            selected: totalFiltered,
            total: totalAvailable,
          },
          originalLocalState: selectedFilter.categories,
        });
      }

      const result = await onApplyFilter(selectedFilter.mode, conditions);

      if (result) {
        toast({
          title: "Filter Applied",
          description: `Successfully filtered ${totalFiltered.toLocaleString()} flights`,
          variant: "default",
        });
      }
    } catch (error) {
      // 에러 시 토스트 알림 표시
      toast({
        title: "Filter Failed",
        description: error instanceof Error ? error.message : "Failed to apply filter",
        variant: "destructive",
      });
    } finally {
      // ✅ Apply Filter 완료 - 버튼 로딩 상태 해제
      setIsApplying(false);
    }
  }, [
    selectedFilter,
    onApplyFilter,
    convertConditionsForAPI,
    getEstimatedFilteredFlights,
    filtersData,
    setSelectedConditions,
    toast,
    controlled,
  ]);

  const handleClearAll = useCallback(() => {
    setSelectedFilter({
      mode: 'departure',
      categories: {},
    });

    if (!controlled) {
      setSelectedConditions({
        type: 'departure',
        conditions: [],
        originalLocalState: {},
      });
    }
  }, [controlled, setSelectedConditions, setSelectedFilter]);

  // ==================== Computed Values ====================

  // 전체 항공사 정보 (이름 매핑용)
  const airlinesMapping = useMemo(
    () => filtersData?.airlines || {},
    [filtersData?.airlines]
  );

  // 교집합 항공편 상세 정보 (Selection Summary 테이블용)
  const intersectedFlightDetails = useMemo((): FlightDetail[] => {
    if (!filtersData?.filters?.[selectedFilter.mode]) return [];
    const modeFilters = filtersData.filters[selectedFilter.mode];
    const categories = selectedFilter.categories;
    const hasFilters = Object.values(categories).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );
    if (!hasFilters) return [];

    try {
      const sets = buildConditionFlightSets(modeFilters, categories, selectedFilter.mode);
      const intersected = intersectSets(sets);
      if (!intersected || intersected.size === 0) return [];

      const tf = `${selectedFilter.mode}_terminal` as keyof typeof modeFilters;
      const regionField = (selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region') as keyof typeof modeFilters;
      const regionOptions = modeFilters[regionField] as
        | Record<string, RegionFilterOption>
        | undefined;

      // 역방향 조회: flight ID → 메타정보
      const flightMeta = new Map<string, FlightDetail>();

      // 터미널 데이터에서 항공사 코드 + 터미널명
      const termData = modeFilters[tf] as Record<string, FilterOption> | undefined;
      if (termData) {
        Object.entries(termData).forEach(([terminalName, tInfo]) => {
          Object.entries(tInfo.airlines).forEach(([airlineCode, aInfo]) => {
            aInfo.flight_numbers.forEach((fn) => {
              const id = String(fn);
              if (!flightMeta.has(id)) {
                flightMeta.set(id, {
                  flightId: id,
                  airline: airlineCode,
                  airlineName: airlinesMapping[airlineCode] || airlineCode,
                  destination: null,
                  terminal: terminalName,
                  flightType: null,
                  aircraftType: null,
                  aircraftClass: null,
                });
              }
            });
          });
        });
      }

      // 리전 데이터에서 목적지 국가
      if (regionOptions) {
        Object.entries(regionOptions).forEach(([, rInfo]) => {
          Object.entries(rInfo.countries).forEach(([countryName, cInfo]) => {
            Object.entries(cInfo.airlines).forEach(([airlineCode, aInfo]) => {
              aInfo.flight_numbers.forEach((fn) => {
                const id = String(fn);
                const existing = flightMeta.get(id);
                if (existing) {
                  existing.destination = countryName;
                } else {
                  flightMeta.set(id, {
                    flightId: id,
                    airline: airlineCode,
                    airlineName: airlinesMapping[airlineCode] || airlineCode,
                    destination: countryName,
                    terminal: null,
                    flightType: null,
                    aircraftType: null,
                    aircraftClass: null,
                  });
                }
              });
            });
          });
        });
      }

      // flight_type 데이터에서 국제/국내 구분
      if (modeFilters.flight_type) {
        Object.entries(modeFilters.flight_type).forEach(([typeName, tInfo]) => {
          Object.values(tInfo.airlines).forEach((aInfo) => {
            aInfo.flight_numbers.forEach((fn) => {
              const meta = flightMeta.get(String(fn));
              if (meta) meta.flightType = typeName;
            });
          });
        });
      }

      // aircraft_class 데이터에서 기재 타입명 + 클래스
      if (modeFilters.aircraft_class) {
        Object.entries(modeFilters.aircraft_class).forEach(([className, classData]) => {
          Object.entries(classData.aircraft_types ?? {}).forEach(([typeName, typeData]) => {
            typeData.flight_numbers.forEach((fn) => {
              const meta = flightMeta.get(String(fn));
              if (meta) {
                meta.aircraftType = typeName;
                meta.aircraftClass = className === '0' ? 'Unknown' : className;
              }
            });
          });
        });
      }

      return [...intersected]
        .map((id) => flightMeta.get(id) ?? {
          flightId: id,
          airline: '',
          airlineName: '',
          destination: null,
          terminal: null,
          flightType: null,
          aircraftType: null,
          aircraftClass: null,
        })
        .sort((a, b) => a.airline.localeCompare(b.airline) || a.flightId.localeCompare(b.flightId));
    } catch {
      return [];
    }
  }, [selectedFilter, filtersData, airlinesMapping]);

  // 필터 적용 가능 여부 - 모드는 항상 선택되어 있으므로 true
  const canApplyFilter = true;

  // ==================== Render Helpers ====================

  const renderSelectionSummary = useCallback(() => {
    const hasFilters = Object.values(selectedFilter.categories).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );
    const totalFiltered = getEstimatedFilteredFlights();
    const totalAvailable = filtersData?.filters?.[selectedFilter.mode]?.total_flights || 0;

    const TABLE_COLS: { col: keyof FlightDetail; label: string }[] = [
      { col: 'flightId',     label: 'Flight No.'  },
      { col: 'airline',      label: 'Airline'     },
      { col: 'destination',  label: 'Destination' },
      { col: 'terminal',     label: 'Terminal'    },
      { col: 'flightType',   label: 'Type'        },
      { col: 'aircraftType', label: 'Aircraft'    },
      { col: 'aircraftClass', label: 'Class'      },
    ];

    const q = summarySearch.trim().toLowerCase();
    const filtered = intersectedFlightDetails.filter((fd) =>
      !q ||
      fd.flightId.toLowerCase().includes(q) ||
      fd.airline.toLowerCase().includes(q) ||
      fd.airlineName.toLowerCase().includes(q) ||
      (fd.destination   ?? '').toLowerCase().includes(q) ||
      (fd.terminal      ?? '').toLowerCase().includes(q) ||
      (fd.aircraftType  ?? '').toLowerCase().includes(q) ||
      (fd.aircraftClass ?? '').toLowerCase().includes(q)
    );
    const sorted = [...filtered].sort((a, b) => {
      const av = (a[summarySort.col] ?? '') as string;
      const bv = (b[summarySort.col] ?? '') as string;
      return summarySort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    const handleColClick = (col: keyof FlightDetail) =>
      setSummarySort((prev) =>
        prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }
      );
    const SortIcon = ({ col }: { col: keyof FlightDetail }) =>
      summarySort.col === col ? (
        <span className="ml-0.5">{summarySort.dir === 'asc' ? '↑' : '↓'}</span>
      ) : null;

    return (
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/20 p-1">
              <Filter className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary">Selection Summary</span>
            <span className="text-xs text-muted-foreground">
              {hasFilters ? 'Filters applied' : 'No filters selected – showing all flights'}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">Selected Flights</div>
            <div className="text-lg font-bold text-primary">
              {parseInt(totalFiltered).toLocaleString()} / {totalAvailable.toLocaleString()}
            </div>
          </div>
        </div>

        {hasFilters && intersectedFlightDetails.length > 0 && (
          <div className="rounded-md border bg-background overflow-hidden text-xs">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
              <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search flights, airline, destination, aircraft…"
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
              />
              {summarySearch && (
                <button
                  onClick={() => setSummarySearch('')}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
              <span className="shrink-0 text-muted-foreground">
                {filtered.length.toLocaleString()} / {intersectedFlightDetails.length.toLocaleString()}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/60">
                  <tr>
                    {TABLE_COLS.map(({ col, label }) => (
                      <th
                        key={col}
                        onClick={() => handleColClick(col)}
                        className="cursor-pointer whitespace-nowrap border-b px-3 py-1.5 text-left font-medium text-muted-foreground hover:text-foreground select-none"
                      >
                        {label}<SortIcon col={col} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">No results</td>
                    </tr>
                  ) : (
                    sorted.map((fd) => (
                      <tr key={fd.flightId} className="border-b last:border-b-0 hover:bg-muted/20">
                        <td className="whitespace-nowrap px-3 py-1.5 font-mono font-semibold">{fd.flightId}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">
                          <span className="font-medium">{fd.airline}</span>
                          {fd.airlineName && fd.airlineName !== fd.airline && (
                            <span className="ml-1 text-muted-foreground">· {fd.airlineName}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{fd.destination ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{fd.terminal ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{fd.flightType ?? '—'}</td>
                        <td className="max-w-[180px] truncate px-3 py-1.5 text-muted-foreground" title={fd.aircraftType ?? undefined}>{fd.aircraftType ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">
                          {fd.aircraftClass ? (
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium ${fd.aircraftClass === 'Unknown' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                              {fd.aircraftClass}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }, [
    selectedFilter,
    filtersData,
    getEstimatedFilteredFlights,
    intersectedFlightDetails,
    summarySearch,
    summarySort,
    setSummarySort,
  ]);

  const renderFilterOptions = useCallback(
    (mode: string, modeFilters: FlightDirectionFilters) => {
      if (!modeFilters) return null;

      const categoryOrder = getCategoryOrder(mode);
      const availableCategories = categoryOrder.filter((cat) => modeFilters[cat]);

      return (
        <div className="space-y-6">
          {availableCategories.map((category) => {
            const options = modeFilters[category];
            const displayName = getCategoryDisplayName(category);
            const isRegionCategory = category.includes('region');

            // Aircraft Class 카테고리
            if (category === 'aircraft_class') {
              return (
                <div key={category} className="space-y-3">
                  <div className="border-b pb-2">
                    <Label className="text-sm font-medium">Class</Label>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(options as Record<string, AircraftClassFilterOption>).map(([cls, clsData]) => {
                      const selectedClasses = selectedFilter.categories.selected_aircraft_classes || [];
                      const currentTypeIds = selectedFilter.categories.aircraft_type_flight_ids || [];
                      const prefix = `${cls}||`;
                      const selectedTypeIdsForClass = currentTypeIds.filter((id) => id.startsWith(prefix));
                      const allTypeNames = Object.keys(clsData.aircraft_types || {});
                      const isClassSelected = selectedClasses.includes(cls);
                      const isClassFullySelected = allTypeNames.length > 0 && selectedTypeIdsForClass.length === allTypeNames.length;
                      const isClassPartiallySelected = selectedTypeIdsForClass.length > 0 && !isClassFullySelected;
                      const selectedCount = selectedTypeIdsForClass.reduce((sum, id) => {
                        const typeName = id.slice(prefix.length);
                        return sum + (clsData.aircraft_types?.[typeName]?.count || 0);
                      }, 0);
                      const displayCls = cls === '0' ? 'Unknown' : `Class ${cls}`;

                      return (
                        <div key={cls} className="flex items-center space-x-2">
                          <Checkbox
                            id={`aircraft-class-${cls}`}
                            checked={isClassSelected}
                            ref={(el) => {
                              if (el && 'indeterminate' in el) {
                                (el as HTMLInputElement).indeterminate = isClassPartiallySelected;
                              }
                            }}
                            onCheckedChange={(checked) => handleClassToggle(cls, allTypeNames, !!checked)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-auto justify-start p-0 text-sm font-normal hover:bg-transparent">
                                <span className="cursor-pointer">
                                  {displayCls} | {
                                    selectedCount > 0 && !isClassFullySelected
                                      ? `${selectedCount} / ${clsData.total_flights.toLocaleString()} flights`
                                      : `${clsData.total_flights.toLocaleString()} flights`
                                  }
                                </span>
                                <ChevronDown className="ml-2 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="max-h-96 w-80 p-2" align="start" side="bottom">
                              <ClassAircraftTypesDropdown
                                cls={cls}
                                displayCls={displayCls}
                                aircraftTypes={clsData.aircraft_types || {}}
                                selectedTypeIds={currentTypeIds}
                                handleAircraftTypeToggle={handleAircraftTypeToggle}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 🆕 Region 카테고리: Terminal과 동일한 스타일 + 드롭다운
            if (isRegionCategory) {
              return (
                <div key={category} className="space-y-3">
                  <div className="border-b pb-2">
                    <Label className="text-sm font-medium">Location</Label>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(options as Record<string, RegionFilterOption>).map(([regionName, regionData]) => {
                      const currentRegions = selectedFilter.categories.region || [];
                      const currentCountries = selectedFilter.categories.countries || [];
                      const allCountriesInRegion = Object.keys(regionData.countries);
                      const selectedCountriesInRegion = currentCountries.filter((c) =>
                        allCountriesInRegion.includes(c)
                      );

                      // 🆕 개선된 Region 선택 로직: 하나라도 선택되면 체크 표시
                      const isRegionSelected = currentRegions.includes(regionName);
                      const isRegionFullySelected = selectedCountriesInRegion.length === allCountriesInRegion.length;
                      const isRegionPartiallySelected = selectedCountriesInRegion.length > 0 && !isRegionFullySelected;

                      // 🆕 선택된 편수 계산
                      const selectedFlights = getSelectedFlightsCount(regionName, regionData);

                      return (
                        <div key={regionName} className="flex items-center space-x-2">
                          {/* Region 체크박스 */}
                          <Checkbox
                            id={`region-${regionName}`}
                            checked={isRegionSelected}
                            ref={(el) => {
                              if (el && 'indeterminate' in el) {
                                (el as HTMLInputElement).indeterminate = isRegionPartiallySelected;
                              }
                            }}
                            onCheckedChange={(checked) => handleRegionToggle(regionName, regionData, !!checked)}
                          />

                          {/* Region 라벨 + 드롭다운 (팝업 방식) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-auto justify-start p-0 text-sm font-normal hover:bg-transparent"
                              >
                                <span className="cursor-pointer">
                                  {regionName} | {
                                    selectedFlights > 0 && selectedFlights < regionData.total_flights
                                      ? `${selectedFlights.toLocaleString()} / ${regionData.total_flights.toLocaleString()} flights`
                                      : `${regionData.total_flights.toLocaleString()} flights`
                                  }
                                </span>
                                <ChevronDown className="ml-2 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              className="max-h-96 w-80 p-2"
                              align="start"
                              side="bottom"
                            >
                              <RegionCountriesDropdown
                                regionName={regionName}
                                regionData={regionData}
                                currentCountries={currentCountries}
                                handleCountryToggle={handleCountryToggle}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 🆕 Terminal 카테고리: Location과 동일한 드롭다운 스타일
            const isTerminalCategory = category.includes('terminal');
            if (isTerminalCategory) {
              // ── Airline 섹션을 위한 집계: 모든 터미널의 항공사 데이터 합산
              // flight_numbers 는 이미 "PR221" 형태의 문자열 배열
              const aggregatedAirlines: Record<string, { count: number; flightNumbers: Set<string> }> = {};
              Object.values(options as Record<string, FilterOption>).forEach((terminalData) => {
                Object.entries(terminalData.airlines).forEach(([code, data]) => {
                  if (!aggregatedAirlines[code]) {
                    aggregatedAirlines[code] = { count: 0, flightNumbers: new Set() };
                  }
                  data.flight_numbers.forEach((fn) => {
                    aggregatedAirlines[code].flightNumbers.add(String(fn));
                  });
                });
              });
              // count 는 중복 제거된 편수로 재계산
              Object.keys(aggregatedAirlines).forEach((code) => {
                aggregatedAirlines[code].count = aggregatedAirlines[code].flightNumbers.size;
              });

              const sortedAggregatedAirlines = Object.entries(aggregatedAirlines).sort(
                ([, a], [, b]) => b.count - a.count
              );

              const currentSelectedAirlines = selectedFilter.categories.selected_airlines || [];
              const currentAirlineFlightIds = selectedFilter.categories.airline_flight_ids || [];

              return (
                <React.Fragment key={category}>
                  {/* ── Terminal 섹션 ── */}
                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <Label className="text-sm font-medium">Terminal</Label>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(Object.entries(options) as [string, FilterOption][]).map(([terminalName, terminalData]) => {
                        const currentTerminals = (selectedFilter.categories[category] as string[]) || [];
                        const currentTerminalAirlines = selectedFilter.categories.terminal_airlines || [];
                        const allAirlinesInTerminal = Object.keys(terminalData.airlines);

                        const selectedAirlinesInTerminal = allAirlinesInTerminal.filter((airlineCode) =>
                          currentTerminalAirlines.includes(createTerminalAirlineCombo(terminalName, airlineCode))
                        );

                        const isTerminalSelected = currentTerminals.includes(terminalName);
                        const isTerminalFullySelected =
                          selectedAirlinesInTerminal.length === allAirlinesInTerminal.length;
                        const isTerminalPartiallySelected =
                          selectedAirlinesInTerminal.length > 0 && !isTerminalFullySelected;

                        const selectedFlights = selectedAirlinesInTerminal.reduce((total, airlineCode) => {
                          return total + (terminalData.airlines[airlineCode]?.count || 0);
                        }, 0);

                        return (
                          <div key={terminalName} className="flex items-center space-x-2">
                            <Checkbox
                              id={`terminal-${terminalName}`}
                              checked={isTerminalSelected}
                              ref={(el) => {
                                if (el && 'indeterminate' in el) {
                                  (el as HTMLInputElement).indeterminate = isTerminalPartiallySelected;
                                }
                              }}
                              onCheckedChange={(checked) => handleTerminalToggle(terminalName, terminalData, !!checked)}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto justify-start p-0 text-sm font-normal hover:bg-transparent"
                                >
                                  <span className="cursor-pointer">
                                    {getValueDisplayName(category, terminalName)} | {
                                      selectedFlights > 0 && selectedFlights < terminalData.total_flights
                                        ? `${selectedFlights.toLocaleString()} / ${terminalData.total_flights.toLocaleString()} flights`
                                        : `${terminalData.total_flights.toLocaleString()} flights`
                                    }
                                  </span>
                                  <ChevronDown className="ml-2 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="max-h-96 w-80 p-2" align="start" side="bottom">
                                <TerminalAirlinesDropdown
                                  terminalName={terminalName}
                                  terminalData={terminalData}
                                  currentTerminalAirlines={selectedFilter.categories.terminal_airlines || []}
                                  currentTerminals={(selectedFilter.categories[category] as string[]) || []}
                                  airlinesMapping={airlinesMapping}
                                  handleAirlineToggle={handleAirlineToggle}
                                  handleTerminalToggle={handleTerminalToggle}
                                  getValueDisplayName={getValueDisplayName}
                                  category={category}
                                />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Airline 섹션 (Terminal 바로 다음) ── */}
                  {sortedAggregatedAirlines.length > 0 && (
                    <div className="space-y-3">
                      <div className="border-b pb-2">
                        <Label className="text-sm font-medium">Airline</Label>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedAggregatedAirlines.map(([airlineCode, airlineData]) => {
                          const airlineName = airlinesMapping[airlineCode] || airlineCode;
                          const allFlightIds = Array.from(airlineData.flightNumbers); // string[]
                          const prefix = `${airlineCode}||`;
                          const selectedFlightIdsForAirline = currentAirlineFlightIds.filter((id) =>
                            id.startsWith(prefix)
                          );
                          const isAirlineSelected = currentSelectedAirlines.includes(airlineCode);
                          const isAirlineFullySelected =
                            selectedFlightIdsForAirline.length === allFlightIds.length;
                          const isAirlinePartiallySelected =
                            selectedFlightIdsForAirline.length > 0 && !isAirlineFullySelected;

                          const selectedCount = selectedFlightIdsForAirline.length;

                          return (
                            <div key={airlineCode} className="flex items-center space-x-2">
                              <Checkbox
                                id={`airline-filter-${airlineCode}`}
                                checked={isAirlineSelected}
                                ref={(el) => {
                                  if (el && 'indeterminate' in el) {
                                    (el as HTMLInputElement).indeterminate = isAirlinePartiallySelected;
                                  }
                                }}
                                onCheckedChange={(checked) =>
                                  handleAirlineFilterToggle(airlineCode, allFlightIds, !!checked)
                                }
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-auto justify-start p-0 text-sm font-normal hover:bg-transparent"
                                  >
                                    <span className="cursor-pointer">
                                      {airlineName} | {
                                        selectedCount > 0 && !isAirlineFullySelected
                                          ? `${selectedCount} / ${airlineData.count.toLocaleString()} flights`
                                          : `${airlineData.count.toLocaleString()} flights`
                                      }
                                    </span>
                                    <ChevronDown className="ml-2 h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-96 w-80 p-2" align="start" side="bottom">
                                  <AirlineFlightNumbersDropdown
                                    airlineCode={airlineCode}
                                    airlineName={airlineName}
                                    flightNumbers={allFlightIds}
                                    selectedFlightIds={currentAirlineFlightIds}
                                    handleFlightNumberToggle={handleFlightNumberToggle}
                                  />
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            }

            // 기존 로직 (flight_type만) - Type 전용
            // 기존 로직 (flight_type만) - Type 전용
            return (
              <div key={category} className="space-y-3">
                <div className="border-b pb-2">
                  <Label className="text-sm font-medium">{displayName}</Label>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.entries(options) as [string, FilterOption][]).map(([value, option]) => {
                    const isSelected = ((selectedFilter.categories[category] as string[]) || []).includes(value);

                    return (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${category}-${value}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCategoryValueChange(category, value, !!checked)}
                        />
                        <Label htmlFor={`${category}-${value}`} className="cursor-pointer text-sm font-normal">
                          {getValueDisplayName(category, value)} | {option.total_flights.toLocaleString()} flights
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>
      );
    },
    [
      selectedFilter.categories,
      getCategoryOrder,
      getCategoryDisplayName,
      getValueDisplayName,
      handleCategoryValueChange,
      handleRegionToggle,
      handleCountryToggle,
      handleTerminalToggle,
      handleAirlineToggle,
      handleAirlineFilterToggle,
      handleFlightNumberToggle,
      getSelectedFlightsCount,
      airlinesMapping,
      handleClassToggle,
      handleAircraftTypeToggle,
    ]
  );

  // ==================== Render ====================

  // 🔄 Loading 상태 처리
  if (loading) {
    return (
      <Card className="mt-6 border-l-4 border-l-primary">
        <CardHeader>
          <div>
            <CardTitle className="text-lg font-semibold text-default-900">Filter Conditions</CardTitle>
            <p className="text-sm font-normal text-default-500">Loading filter options...</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2 overflow-hidden">
              <Spinner size={16} className="shrink-0" />
              <span className="truncate">Loading available filters...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🆕 부모에서 조건부 렌더링하므로 여기서는 데이터가 항상 있다고 가정

  // 임베드 모드일 때는 Card/Collapsible 래퍼 없이 내용만 렌더링
  if (isEmbedded) {
    return (
      <div className="space-y-6">
        {/* Filter Conditions 헤더 */}
        <div className="flex items-start gap-3">
          <div className="w-1 h-12 bg-primary rounded-full" />
          <div>
            <h3 className="text-lg font-semibold text-default-900">Filter Conditions</h3>
            <p className="text-sm font-normal text-default-500">
              Select flight mode and filtering criteria | {(filtersData?.total_flights || 0).toLocaleString()} total flights
            </p>
          </div>
        </div>

        {/* Flight Mode를 탭으로 변경 */}
        <Tabs
          value={selectedFilter.mode}
          onValueChange={(value) => handleModeChange(value as 'departure' | 'arrival')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departure">
              Departure | {(filtersData?.filters.departure?.total_flights || 0).toLocaleString()} flights
            </TabsTrigger>
            <TabsTrigger value="arrival">
              Arrival | {(filtersData?.filters.arrival?.total_flights || 0).toLocaleString()} flights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departure" className="mt-6">
            {filtersData && renderFilterOptions('departure', filtersData.filters.departure)}
          </TabsContent>

          <TabsContent value="arrival" className="mt-6">
            {filtersData && renderFilterOptions('arrival', filtersData.filters.arrival)}
          </TabsContent>
        </Tabs>

        {showActions && (
          <>
            {/* 선택 상태 요약 */}
            {renderSelectionSummary()}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div></div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={Object.entries(selectedFilter.categories).every(([_, value]) =>
                    Array.isArray(value) ? value.length === 0 : !value
                  )}
                >
                  Clear All
                </Button>

                <Button size="sm" onClick={handleApplyFilter} disabled={!canApplyFilter || isApplying} className="overflow-hidden">
                  <span className="flex items-center">
                    {isApplying ? (
                      <>
                        <Spinner size={16} className="mr-2 shrink-0" />
                        <span className="hidden sm:inline truncate">Filtering...</span>
                        <span className="sm:hidden truncate">Filter</span>
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline truncate">Filter Flights</span>
                        <span className="sm:hidden truncate">Filter</span>
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // 독립 모드일 때는 원래대로 Collapsible Card 사용
  return (
    <Collapsible defaultOpen={true}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50 [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-default-900">Filter Conditions</CardTitle>
                <p className="text-sm font-normal text-default-500">
                  Select flight mode and filtering criteria | {(filtersData?.total_flights || 0).toLocaleString()} total flights
                </p>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Content is same as embedded version */}
            {/* Flight Mode를 탭으로 변경 */}
            <Tabs
              value={selectedFilter.mode}
              onValueChange={(value) => handleModeChange(value as 'departure' | 'arrival')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="departure">
                  Departure | {(filtersData?.filters.departure?.total_flights || 0).toLocaleString()} flights
                </TabsTrigger>
                <TabsTrigger value="arrival">
                  Arrival | {(filtersData?.filters.arrival?.total_flights || 0).toLocaleString()} flights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="departure" className="mt-6">
                {filtersData && renderFilterOptions('departure', filtersData.filters.departure)}
              </TabsContent>

              <TabsContent value="arrival" className="mt-6">
                {filtersData && renderFilterOptions('arrival', filtersData.filters.arrival)}
              </TabsContent>
            </Tabs>

            {showActions && (
              <>
                {renderSelectionSummary()}

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div></div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={Object.entries(selectedFilter.categories).every(([_, value]) =>
                        Array.isArray(value) ? value.length === 0 : !value
                      )}
                    >
                      Clear All
                    </Button>

                    <Button size="sm" onClick={handleApplyFilter} disabled={!canApplyFilter || isApplying} className="overflow-hidden">
                      <span className="flex items-center">
                        {isApplying ? (
                          <>
                            <Spinner size={16} className="mr-2 shrink-0" />
                            <span className="hidden sm:inline truncate">Filtering...</span>
                            <span className="sm:hidden truncate">Filter</span>
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline truncate">Filter Flights</span>
                            <span className="sm:hidden truncate">Filter</span>
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default React.memo(FlightFilterConditions);
