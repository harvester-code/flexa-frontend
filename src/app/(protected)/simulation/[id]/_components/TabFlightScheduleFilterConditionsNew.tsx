'use client';

import React, { useCallback, useState } from 'react';
import { Building2, ChevronDown, Filter, Flag, Loader2, MapPin, Plane, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useSimulationStore } from '../_stores';

// ==================== Types ====================
// 실제 API 응답 구조에 맞춰 수정 (flight-filter.json 기준)
interface FlightFiltersApiResponse {
  airport: string;
  date: string;
  scenario_id: string;
  total_flights: number;
  airlines: Record<string, string>; // {"KE": "Korean Air", "7C": "Jeju Air"}
  filters: {
    departure: {
      total_flights: number; // ✅ 백엔드에서 계산된 값
      departure_terminal?: Record<string, FilterOption>;
      arrival_region?: Record<string, RegionFilterOption>; // 🆕 계층 구조
      flight_type?: Record<string, FilterOption>;
    };
    arrival: {
      total_flights: number; // ✅ 백엔드에서 계산된 값
      arrival_terminal?: Record<string, FilterOption>;
      departure_region?: Record<string, RegionFilterOption>; // 🆕 계층 구조
      flight_type?: Record<string, FilterOption>;
    };
  };
}

interface FilterOption {
  total_flights: number; // ✅ 백엔드에서 계산된 값
  airlines: Record<
    string,
    {
      count: number;
      flight_numbers: number[];
    }
  >;
}

// 🆕 Region-Country 계층 구조를 위한 새로운 타입
interface RegionFilterOption {
  total_flights: number;
  countries: Record<string, FilterOption>; // Country별 데이터
}

interface SelectedFilter {
  mode: 'departure' | 'arrival';
  categories: {
    flight_type?: string[]; // 🆕 multiple selection: ['international', 'domestic']
    departure_terminal?: string[]; // 🆕 multiple selection: ['1', '2', 'unknown']
    arrival_terminal?: string[]; // 🆕 multiple selection: ['1', '2', 'unknown']
    region?: string[]; // 🆕 multiple regions: ['Asia', 'Europe']
    countries?: string[]; // 🆕 multiple countries: ['Korea', 'Japan', 'China']
    terminal_airlines?: string[]; // 🆕 Terminal-Airline 조합: ['2B_BT', '1_KE', '2B_EI']
  };
}

interface TabFlightScheduleFilterConditionsNewProps {
  loading: boolean; // 로딩 상태만 props로 (UI 상태)
  onApplyFilter: (type: string, conditions: Array<{ field: string; values: string[] }>) => Promise<any>;
  // filtersData props 제거 - zustand에서 직접 가져올 예정
}

// ==================== Component ====================
function TabFlightScheduleFilterConditionsNew({ loading, onApplyFilter }: TabFlightScheduleFilterConditionsNewProps) {
  // 🆕 zustand에서 직접 flight 데이터 구독
  const flightData = useSimulationStore((state) => state.flight);
  const setSelectedConditions = useSimulationStore((state) => state.setSelectedConditions);

  // ✅ Apply Filter 전용 로딩 상태 (Filter Conditions 전체와 독립적)
  const [isApplying, setIsApplying] = useState(false);

  // 🆕 데이터 구조를 기존 인터페이스에 맞게 변환
  const filtersData: FlightFiltersApiResponse | null = flightData.total_flights
    ? ({
        airport: useSimulationStore((s) => s.context.airport),
        date: useSimulationStore((s) => s.context.date),
        scenario_id: useSimulationStore((s) => s.context.scenarioId),
        total_flights: flightData.total_flights,
        airlines: flightData.airlines || {},
        filters: flightData.filters || { departure: {}, arrival: {} },
      } as FlightFiltersApiResponse)
    : null;
  // ==================== Local State ====================
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
    mode: 'departure', // default는 departure
    categories: {},
  });

  // 🆕 Region 드롭다운 open 상태는 DropdownMenu가 자체 관리

  // ✅ Response Preview 상태 제거 (부모 컴포넌트에서 관리)

  // ==================== Helper Functions ====================

  // 카테고리 순서 정의: Type -> Terminal -> Location(Region with Countries)
  const getCategoryOrder = useCallback((mode: string) => {
    // departure 모드일 때는 도착지 지역을, arrival 모드일 때는 출발지 지역을 필터링
    const oppositeMode = mode === 'departure' ? 'arrival' : 'departure';
    const order = ['flight_type', `${mode}_terminal`, `${oppositeMode}_region`];
    return order;
  }, []);

  // 카테고리 표시 이름 변환 (수식어 제거)
  const getCategoryDisplayName = useCallback((category: string): string => {
    if (category.includes('terminal')) return 'Terminal';
    if (category.includes('region')) return 'Region';
    if (category.includes('country')) return 'Country';
    if (category === 'flight_type') return 'Type';
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
  const handleTerminalToggle = useCallback((terminalName: string, terminalData: any, checked: boolean) => {
    setSelectedFilter((prev) => {
      const terminalField = `${prev.mode}_terminal`;
      const currentTerminals = (prev.categories[terminalField] as string[]) || [];
      const currentTerminalAirlines = prev.categories.terminal_airlines || [];

      if (checked) {
        // Terminal 선택: Terminal과 모든 하위 Terminal-Airline 조합 추가
        const terminalAirlineCombos = Object.keys(terminalData.airlines).map(
          (airlineCode) => `${terminalName}_${airlineCode}`
        );
        return {
          ...prev,
          categories: {
            ...prev.categories,
            [terminalField]: [...currentTerminals.filter((t) => t !== terminalName), terminalName],
            terminal_airlines: [
              ...currentTerminalAirlines.filter((combo) => !combo.startsWith(`${terminalName}_`)),
              ...terminalAirlineCombos,
            ],
          },
        };
      } else {
        // Terminal 해제: Terminal과 해당 Terminal의 모든 Terminal-Airline 조합 제거
        return {
          ...prev,
          categories: {
            ...prev.categories,
            [terminalField]:
              currentTerminals.filter((t) => t !== terminalName).length > 0
                ? currentTerminals.filter((t) => t !== terminalName)
                : undefined,
            terminal_airlines:
              currentTerminalAirlines.filter((combo) => !combo.startsWith(`${terminalName}_`)).length > 0
                ? currentTerminalAirlines.filter((combo) => !combo.startsWith(`${terminalName}_`))
                : undefined,
          },
        };
      }
    });
  }, []);

  // 🆕 Airline 선택/해제 (Terminal-Airline 조합 방식)
  const handleAirlineToggle = useCallback(
    (terminalName: string, airlineCode: string, airlineData: any, checked: boolean) => {
      setSelectedFilter((prev) => {
        const terminalField = `${prev.mode}_terminal`;
        const currentTerminals = (prev.categories[terminalField] as string[]) || [];
        const currentTerminalAirlines = prev.categories.terminal_airlines || [];
        const terminalAirlineCombo = `${terminalName}_${airlineCode}`;

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
          return {
            ...prev,
            categories: {
              ...prev.categories,
              terminal_airlines:
                currentTerminalAirlines.filter((combo) => combo !== terminalAirlineCombo).length > 0
                  ? currentTerminalAirlines.filter((combo) => combo !== terminalAirlineCombo)
                  : undefined,
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
    const categories = selectedFilter.categories;

    // 선택된 조건이 없으면 전체 편수 반환
    const hasFilters = Object.values(categories).some((value) => (Array.isArray(value) ? value.length > 0 : !!value));
    if (!hasFilters) {
      return (modeFilters.total_flights || 0).toString();
    }

    // 🎯 각 조건별 항공편 식별자 집합 수집 (airline_code + flight_number)
    const conditionFlightSets: Set<string>[] = [];

    try {
      // 1. Flight Type 조건 (airline_code + flight_number 조합) - 다중 선택 지원
      const selectedTypes = categories.flight_type;
      if (selectedTypes && selectedTypes.length > 0) {
        const typeFlightIds = new Set<string>();

        selectedTypes.forEach((flightType) => {
          if (modeFilters.flight_type?.[flightType]) {
            const typeAirlines = modeFilters.flight_type[flightType].airlines;

            Object.entries(typeAirlines).forEach(([airlineCode, airlineData]: [string, any]) => {
              airlineData.flight_numbers.forEach((flightNumber: number) => {
                typeFlightIds.add(`${airlineCode}_${flightNumber}`);
              });
            });
          }
        });

        conditionFlightSets.push(typeFlightIds);
      }

      // 2. Terminal 조건 (airline_code + flight_number 조합) - Terminal-Airline 조합 방식
      const terminalField = `${selectedFilter.mode}_terminal`;
      const selectedTerminalAirlines = categories.terminal_airlines;
      if (selectedTerminalAirlines && selectedTerminalAirlines.length > 0) {
        const terminalFlightIds = new Set<string>();
        const terminalOptions = modeFilters[terminalField];

        // 선택된 Terminal-Airline 조합에서 flight_numbers 수집
        selectedTerminalAirlines.forEach((terminalAirlineCombo) => {
          const [terminalName, airlineCode] = terminalAirlineCombo.split('_');
          const terminalData = terminalOptions?.[terminalName];
          const airlineData = terminalData?.airlines?.[airlineCode];

          if (airlineData) {
            airlineData.flight_numbers.forEach((flightNumber: number) => {
              terminalFlightIds.add(`${airlineCode}_${flightNumber}`);
            });
          }
        });

        conditionFlightSets.push(terminalFlightIds);
      }

      // 3. Location (Region/Country) 조건 (airline_code + flight_number 조합)
      const regionField = selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region';
      const regionOptions = modeFilters[regionField];

      if (categories.region && categories.region.length > 0 && regionOptions) {
        const locationFlightIds = new Set<string>();

        categories.region.forEach((regionName) => {
          const regionData = regionOptions[regionName];
          if (regionData) {
            const currentCountries = categories.countries || [];
            const allCountriesInRegion = Object.keys(regionData.countries);
            const selectedCountriesInRegion = currentCountries.filter((c) => allCountriesInRegion.includes(c));

            // 전체 Region 또는 일부 Country 선택에 따른 처리
            const targetCountries =
              selectedCountriesInRegion.length === 0 || selectedCountriesInRegion.length === allCountriesInRegion.length
                ? allCountriesInRegion
                : selectedCountriesInRegion;

            // 해당 국가들의 항공편 식별자 수집
            targetCountries.forEach((countryName) => {
              const countryData = regionData.countries[countryName];
              if (countryData?.airlines) {
                Object.entries(countryData.airlines).forEach(([airlineCode, airlineData]: [string, any]) => {
                  airlineData.flight_numbers.forEach((flightNumber: number) => {
                    locationFlightIds.add(`${airlineCode}_${flightNumber}`);
                  });
                });
              }
            });
          }
        });

        if (locationFlightIds.size > 0) {
          conditionFlightSets.push(locationFlightIds);
        }
      }

      // 🔄 교집합 계산
      if (conditionFlightSets.length === 0) {
        return (modeFilters.total_flights || 0).toString();
      }

      // 단일 조건일 때는 교집합 계산 없이 바로 반환
      if (conditionFlightSets.length === 1) {
        return conditionFlightSets[0].size.toString();
      }

      // 다중 조건일 때만 교집합 계산
      let intersectionFlights = conditionFlightSets[0];

      for (let i = 1; i < conditionFlightSets.length; i++) {
        intersectionFlights = new Set(
          [...intersectionFlights].filter((flightId) => conditionFlightSets[i].has(flightId))
        );
      }

      return intersectionFlights.size.toString();
    } catch (error) {
      console.error('❌ Error calculating intersection flights:', error);
      // 에러 시 기본값 반환
      return (modeFilters.total_flights || 0).toString();
    }
  }, [selectedFilter, filtersData]);

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
              Object.entries(regionOptions).forEach(([regionName, regionData]: [string, any]) => {
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
          // 🆕 Terminal-Airline 조합을 기존 airlines 형태로 변환
          const airlineSet = new Set<string>();
          value.forEach((combo: string) => {
            const [, airlineCode] = combo.split('_');
            if (airlineCode) {
              airlineSet.add(airlineCode);
            }
          });

          if (airlineSet.size > 0) {
            conditions.push({
              field: 'operating_carrier_iata',
              values: Array.from(airlineSet),
            });
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
      // ✅ Apply Filter 시작 - 버튼 로딩 상태만 활성화
      setIsApplying(true);

      // zustand에 선택된 조건 저장
      setSelectedConditions(selectedFilter as any);

      await onApplyFilter(selectedFilter.mode, conditions);
    } catch (error) {
      console.error('❌ API request failed:', error);
    } finally {
      // ✅ Apply Filter 완료 - 버튼 로딩 상태 해제
      setIsApplying(false);
    }
  }, [selectedFilter, onApplyFilter, convertConditionsForAPI]);

  // 초기화
  const handleClearAll = useCallback(() => {
    setSelectedFilter({
      mode: 'departure',
      categories: {},
    });
  }, []);

  // ==================== Computed Values ====================

  // 전체 항공사 정보 (이름 매핑용)
  const airlinesMapping = filtersData?.airlines || {};

  // 필터 적용 가능 여부 - 모드는 항상 선택되어 있으므로 true
  const canApplyFilter = true;

  // ==================== Render Helper ====================

  const renderFilterOptions = useCallback(
    (mode: string, modeFilters: any) => {
      if (!modeFilters) return null;

      const categoryOrder = getCategoryOrder(mode);
      const availableCategories = categoryOrder.filter((cat) => modeFilters[cat]);

      return (
        <div className="space-y-6">
          {availableCategories.map((category) => {
            const options = modeFilters[category];
            const displayName = getCategoryDisplayName(category);
            const isRegionCategory = category.includes('region');

            // 🆕 Region 카테고리: Terminal과 동일한 스타일 + 드롭다운
            if (isRegionCategory) {
              return (
                <div key={category} className="space-y-3">
                  <div className="border-b pb-2">
                    <Label className="text-sm font-medium">Location</Label>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(options).map(([regionName, regionData]: [string, any]) => {
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
                                (el as any).indeterminate = isRegionPartiallySelected;
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
                                  {regionName} (
                                  {selectedFlights > 0 && selectedFlights < regionData.total_flights
                                    ? `${selectedFlights} / ${regionData.total_flights} flights`
                                    : `${regionData.total_flights} flights`}
                                  )
                                </span>
                                <ChevronDown className="ml-2 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              className="max-h-60 w-80 overflow-y-auto p-2"
                              align="start"
                              side="bottom"
                            >
                              <div className="space-y-1">
                                <div className="mb-2 border-b px-2 py-1 text-xs font-medium text-muted-foreground">
                                  Countries in {regionName}
                                </div>
                                {Object.entries(regionData.countries).map(
                                  ([countryName, countryData]: [string, any]) => {
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
                                          {countryName} ({countryData.total_flights} flights)
                                        </Label>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
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
              return (
                <div key={category} className="space-y-3">
                  <div className="border-b pb-2">
                    <Label className="text-sm font-medium">Terminal</Label>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(options).map(([terminalName, terminalData]: [string, any]) => {
                      const currentTerminals = (selectedFilter.categories[category] as string[]) || [];
                      const currentTerminalAirlines = selectedFilter.categories.terminal_airlines || [];
                      const allAirlinesInTerminal = Object.keys(terminalData.airlines);

                      // 🆕 Terminal-Airline 조합으로 선택된 항공사 찾기
                      const selectedAirlinesInTerminal = allAirlinesInTerminal.filter((airlineCode) =>
                        currentTerminalAirlines.includes(`${terminalName}_${airlineCode}`)
                      );

                      // Terminal 선택 로직: 하나라도 선택되면 체크 표시
                      const isTerminalSelected = currentTerminals.includes(terminalName);
                      const isTerminalFullySelected =
                        selectedAirlinesInTerminal.length === allAirlinesInTerminal.length;
                      const isTerminalPartiallySelected =
                        selectedAirlinesInTerminal.length > 0 && !isTerminalFullySelected;

                      // 선택된 편수 계산
                      const selectedFlights = selectedAirlinesInTerminal.reduce((total, airlineCode) => {
                        return total + (terminalData.airlines[airlineCode]?.count || 0);
                      }, 0);

                      return (
                        <div key={terminalName} className="flex items-center space-x-2">
                          {/* Terminal 체크박스 */}
                          <Checkbox
                            id={`terminal-${terminalName}`}
                            checked={isTerminalSelected}
                            ref={(el) => {
                              if (el && 'indeterminate' in el) {
                                (el as any).indeterminate = isTerminalPartiallySelected;
                              }
                            }}
                            onCheckedChange={(checked) => handleTerminalToggle(terminalName, terminalData, !!checked)}
                          />

                          {/* Terminal 라벨 + 드롭다운 (팝업 방식) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-auto justify-start p-0 text-sm font-normal hover:bg-transparent"
                              >
                                <span className="cursor-pointer">
                                  {getValueDisplayName(category, terminalName)} (
                                  {selectedFlights > 0 && selectedFlights < terminalData.total_flights
                                    ? `${selectedFlights} / ${terminalData.total_flights} flights`
                                    : `${terminalData.total_flights} flights`}
                                  )
                                </span>
                                <ChevronDown className="ml-2 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              className="max-h-60 w-80 overflow-y-auto p-2"
                              align="start"
                              side="bottom"
                            >
                              <div className="space-y-1">
                                <div className="mb-2 border-b px-2 py-1 text-xs font-medium text-muted-foreground">
                                  Airlines in {getValueDisplayName(category, terminalName)}
                                </div>
                                {Object.entries(terminalData.airlines)
                                  .sort(([, a]: [string, any], [, b]: [string, any]) => b.count - a.count)
                                  .map(([airlineCode, airlineData]: [string, any]) => {
                                    const isAirlineSelected = currentTerminalAirlines.includes(
                                      `${terminalName}_${airlineCode}`
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
                                          {airlineCode} - {airlineName} ({airlineData.count} flights)
                                        </Label>
                                      </div>
                                    );
                                  })}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 기존 로직 (flight_type만) - Type 전용
            return (
              <div key={category} className="space-y-3">
                <div className="border-b pb-2">
                  <Label className="text-sm font-medium">{displayName}</Label>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(options).map(([value, option]: [string, any]) => {
                    const isSelected = ((selectedFilter.categories[category] as string[]) || []).includes(value);

                    return (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${category}-${value}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCategoryValueChange(category, value, !!checked)}
                        />
                        <Label htmlFor={`${category}-${value}`} className="cursor-pointer text-sm font-normal">
                          {getValueDisplayName(category, value)} ({option.total_flights} flights)
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
      getSelectedFlightsCount,
      getEstimatedFilteredFlights,
      airlinesMapping,
    ]
  );

  // ==================== Render ====================

  // 🔄 Loading 상태 처리
  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="rounded-lg bg-primary/10 p-2">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-default-900">Filter Conditions</div>
              <p className="text-sm font-normal text-default-500">Loading filter options...</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading available filters...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🆕 부모에서 조건부 렌더링하므로 여기서는 데이터가 항상 있다고 가정

  return (
    <Collapsible defaultOpen={true}>
      <Card className="mt-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50 [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-default-900">Filter Conditions</div>
                  <p className="text-sm font-normal text-default-500">
                    Select flight mode and filtering criteria ({filtersData?.total_flights || 0} total flights)
                  </p>
                </div>
              </CardTitle>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Flight Mode를 탭으로 변경 */}
            <Tabs
              value={selectedFilter.mode}
              onValueChange={(value) => handleModeChange(value as 'departure' | 'arrival')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="departure">
                  Departure ({filtersData?.filters.departure?.total_flights || 0} flights)
                </TabsTrigger>
                <TabsTrigger value="arrival">
                  Arrival ({filtersData?.filters.arrival?.total_flights || 0} flights)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="departure" className="mt-6">
                {filtersData && renderFilterOptions('departure', filtersData.filters.departure)}
              </TabsContent>

              <TabsContent value="arrival" className="mt-6">
                {filtersData && renderFilterOptions('arrival', filtersData.filters.arrival)}
              </TabsContent>
            </Tabs>

            {/* 각 모드에 따른 옵션들이 이제 TabsContent 안에서 렌더링됨 */}

            {/* ✅ Response Preview 제거 - 독립 컴포넌트로 분리 */}

            {/* 🆕 선택 상태 요약 (Apply 버튼 바로 위에 배치) */}
            {Object.entries(selectedFilter.categories).some(([_, value]) =>
              Array.isArray(value) ? value.length > 0 : !!value
            ) && (
              <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                <div className="flex items-start gap-4">
                  {/* 선택 요약 */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-full bg-primary/20 p-1">
                        <Filter className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-primary">Selection Summary</span>
                    </div>
                  </div>

                  {/* 편수 통계 */}
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Expected Flights</div>
                    <div className="text-lg font-bold text-primary">
                      {(() => {
                        const totalFiltered = getEstimatedFilteredFlights();
                        const totalAvailable = filtersData?.filters?.[selectedFilter.mode]?.total_flights || 0;
                        return `${totalFiltered} / ${totalAvailable}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selection Summary & Actions */}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const totalSelections = Object.entries(selectedFilter.categories).reduce((count, [_, value]) => {
                    if (Array.isArray(value)) return count + value.length;
                    if (value) return count + 1;
                    return count;
                  }, 0);

                  return totalSelections > 0 ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Filter className="h-3 w-3" />
                      {totalSelections} filter(s) active
                    </span>
                  ) : (
                    <span>No filters selected</span>
                  );
                })()}
              </div>

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

                <Button size="sm" onClick={handleApplyFilter} disabled={!canApplyFilter || isApplying}>
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">Search</span>
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Search Flights</span>
                      <span className="sm:hidden">Search</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default React.memo(TabFlightScheduleFilterConditionsNew);
