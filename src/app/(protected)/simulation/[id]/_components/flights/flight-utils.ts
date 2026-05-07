/**
 * 터미널-항공사 조합 데이터 처리 유틸리티
 *
 * 프론트엔드 체크박스 UI에서는 "터미널_항공사" 형태로 저장하지만,
 * API 요청 시에는 항공사 코드만 전송하도록 변환
 */

// ==================== Types ====================

/** 터미널-항공사 조합 문자열 (예: "2_KE", "1_LJ", "unknown_AA") */
export type TerminalAirlineCombo = string;

/** 필터 선택 상태 (탭 간 공유를 위해 export) */
export interface SelectedFilter {
  mode: 'departure' | 'arrival';
  categories: {
    flight_type?: string[];
    departure_terminal?: string[];
    arrival_terminal?: string[];
    region?: string[];
    countries?: string[];
    terminal_airlines?: TerminalAirlineCombo[];
    /** 선택된 항공사 IATA 코드 배열 (UI 체크 상태 관리용) */
    selected_airlines?: string[];
    /** 선택된 항공편 ID 배열 – 형식: "airlineCode_rawFlightNum" (예: "KE_72") */
    airline_flight_ids?: string[];
    /** 선택된 항공기 등급 배열 – "A"~"F" 또는 "0" (Unknown) */
    selected_aircraft_classes?: string[];
    /** 선택된 항공기 기종 ID – 형식: "className||typeName" (예: "A||Boeing 747-400") */
    aircraft_type_flight_ids?: string[];
    [key: string]: string[] | TerminalAirlineCombo[] | undefined;
  };
}

/** 터미널-항공사 조합이 분리된 형태 */
export interface TerminalAirlinePair {
  terminal: string;
  airline: string;
}

// ==================== 유틸리티 함수들 ====================

/** 터미널명과 항공사 코드를 조합하여 문자열 생성 */
export const createTerminalAirlineCombo = (terminal: string, airline: string): TerminalAirlineCombo => {
  return `${terminal}_${airline}`;
};

/** 터미널-항공사 조합 문자열을 분리하여 객체로 변환 */
export const parseTerminalAirlineCombo = (combo: TerminalAirlineCombo): TerminalAirlinePair | null => {
  const parts = combo.split('_');
  if (parts.length >= 2) {
    const [terminal, ...airlineParts] = parts;
    const airline = airlineParts.join('_'); // 항공사 코드에 '_'가 있을 수 있음 (예: "AA_B")
    return { terminal, airline };
  }
  return null;
};

/** 터미널-항공사 조합 배열에서 특정 터미널에 속한 것들만 필터링 */
export const filterCombosByTerminal = (combos: TerminalAirlineCombo[], terminal: string): TerminalAirlineCombo[] => {
  return combos.filter((combo) => combo.startsWith(`${terminal}_`));
};

/** 터미널-항공사 조합 배열에서 특정 터미널에 속한 것들 제거 */
export const removeCombosByTerminal = (combos: TerminalAirlineCombo[], terminal: string): TerminalAirlineCombo[] => {
  return combos.filter((combo) => !combo.startsWith(`${terminal}_`));
};

/** 터미널-항공사 조합 배열에서 특정 조합 제거 */
export const removeCombo = (
  combos: TerminalAirlineCombo[],
  comboToRemove: TerminalAirlineCombo
): TerminalAirlineCombo[] => {
  return combos.filter((combo) => combo !== comboToRemove);
};

/** 터미널 데이터에서 모든 가능한 터미널-항공사 조합 생성 */
export const createAllCombosForTerminal = (terminal: string, airlineCodes: string[]): TerminalAirlineCombo[] => {
  return airlineCodes.map((airline) => createTerminalAirlineCombo(terminal, airline));
};

// ==================== Airline 필터 유틸리티 ====================
// airline_flight_ids 내부 형식: "airlineCode||flightId"  (예: "PR||PR221")
// - 표시용: flightId 부분만 사용 ("PR221")
// - 교집합 계산: "airlineCode_flightId" 형식으로 변환 ("PR_PR221")  ← 기존 다른 집합과 동일
// - API 조건: flightId 부분만 사용 ("PR221")

/** "airlineCode||flightId" 형식의 내부 ID 생성 */
export function createAirlineFlightId(airlineCode: string, flightId: string): string {
  return `${airlineCode}||${flightId}`;
}

/** "airlineCode||flightId" 형식을 분해하여 반환 */
export function parseAirlineFlightId(id: string): { airline: string; flightId: string } | null {
  const sep = id.indexOf('||');
  if (sep < 1) return null;
  const airline = id.slice(0, sep);
  const flightId = id.slice(sep + 2);
  if (!airline || !flightId) return null;
  return { airline, flightId };
}

/** 내부 ID → 기존 교집합 집합 형식 ("airlineCode_flightId") */
export function airlineFlightIdToIntersectionKey(id: string): string | null {
  const parsed = parseAirlineFlightId(id);
  if (!parsed) return null;
  return `${parsed.airline}_${parsed.flightId}`;
}

// formatFlightNumber 는 더 이상 필요 없지만 하위 호환용으로 유지
export function formatFlightNumber(airlineCode: string, rawFlightNum: number): string {
  const numStr = String(rawFlightNum).replace(/^0+/, '') || '0';
  const padded = numStr.length >= 3 ? numStr : numStr.padStart(3, '0');
  return `${airlineCode}${padded}`;
}

// ==================== API 변환 함수들 ====================

/**
 * UI 상태를 API 요청 body로 변환
 * terminal_airlines 조합을 operating_carrier_iata 배열로 변환
 */
export const convertTerminalAirlinesToApiCondition = (
  combos: TerminalAirlineCombo[]
): {
  field: string;
  values: string[];
} | null => {
  // 터미널-항공사 조합에서 항공사 코드만 추출 (중복 제거)
  const airlines = new Set<string>();
  combos.forEach((combo) => {
    const parsed = parseTerminalAirlineCombo(combo);
    if (parsed) {
      airlines.add(parsed.airline);
    }
  });

  const airlineArray = Array.from(airlines);
  if (airlineArray.length === 0) return null;

  return {
    field: 'operating_carrier_iata',
    values: airlineArray,
  };
};

// ==================== Multi-tab 유틸리티 ====================

/**
 * SelectedFilter를 API 요청 body conditions로 변환하는 순수 함수.
 * FlightFilterConditions 내부의 convertConditionsForAPI와 동일한 로직.
 */
export function convertFilterToApiConditions(
  selectedFilter: SelectedFilter,
  filtersData: { filters: Record<string, any> } | null
): Array<{ field: string; values: string[] }> {
  const conditions: Array<{ field: string; values: string[] }> = [];

  Object.entries(selectedFilter.categories).forEach(([category, value]) => {
    if (value) {
      if (category === 'region' && Array.isArray(value) && value.length > 0) {
        const regionField = selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region';
        conditions.push({ field: regionField, values: value });
      } else if (category === 'countries') {
        const currentRegions = selectedFilter.categories.region || [];
        const currentCountries = selectedFilter.categories.countries || [];
        const partialCountries: string[] = [];

        if (filtersData?.filters?.[selectedFilter.mode]) {
          const modeFilters = filtersData.filters[selectedFilter.mode];
          const regionField = selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region';
          const regionOptions = modeFilters[regionField];

          if (regionOptions) {
            Object.entries(regionOptions).forEach(([regionName, regionData]: [string, any]) => {
              const allCountriesInRegion = Object.keys(regionData.countries);
              const selectedCountriesInRegion = currentCountries.filter((c: string) =>
                allCountriesInRegion.includes(c)
              );
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
          const countryField = selectedFilter.mode === 'departure' ? 'arrival_country' : 'departure_country';
          conditions.push({ field: countryField, values: partialCountries });
        }
      } else if (category === 'terminal_airlines' && Array.isArray(value) && value.length > 0) {
        const apiCondition = convertTerminalAirlinesToApiCondition(value);
        if (apiCondition) conditions.push(apiCondition);
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
      } else if (category === 'aircraft_type_flight_ids' && Array.isArray(value) && value.length > 0) {
        // "className||typeName" → typeName 부분만 추출하여 aircraft_type_name 조건으로 전송
        const typeNames = value
          .map((id) => { const sep = id.indexOf('||'); return sep > -1 ? id.slice(sep + 2) : null; })
          .filter(Boolean) as string[];
        if (typeNames.length > 0) {
          conditions.push({ field: 'aircraft_type_name', values: typeNames });
        }
      } else if (category === 'selected_aircraft_classes') {
        // aircraft_type_flight_ids 가 없을 때 fallback
        const typeIds = selectedFilter.categories.aircraft_type_flight_ids || [];
        if (typeIds.length === 0 && Array.isArray(value) && value.length > 0) {
          conditions.push({ field: 'aircraft_class', values: value });
        }
      } else if (Array.isArray(value) && value.length > 0) {
        conditions.push({ field: category, values: value });
      } else if (typeof value === 'string') {
        conditions.push({ field: category, values: [value] });
      }
    }
  });

  return conditions;
}

/**
 * 특정 필터 상태에서 예상 필터링 항공편 수를 계산하는 순수 함수.
 * FlightFilterConditions의 getEstimatedFilteredFlights와 동일한 로직.
 */
export function computeEstimatedFilteredFlights(
  selectedFilter: SelectedFilter,
  filtersData: { filters: Record<string, any> } | null
): { estimated: number; total: number } {
  if (!filtersData?.filters?.[selectedFilter.mode]) return { estimated: 0, total: 0 };

  const modeFilters = filtersData.filters[selectedFilter.mode];
  const total = modeFilters.total_flights || 0;
  const categories = selectedFilter.categories;

  const hasFilters = Object.values(categories).some((value) =>
    Array.isArray(value) ? value.length > 0 : !!value
  );
  if (!hasFilters) return { estimated: total, total };

  const conditionFlightSets: Set<string>[] = [];

  try {
    // Flight Type
    const selectedTypes = categories.flight_type;
    if (selectedTypes && selectedTypes.length > 0) {
      const typeFlightIds = new Set<string>();
      selectedTypes.forEach((flightType) => {
        if (modeFilters.flight_type?.[flightType]) {
          Object.entries(modeFilters.flight_type[flightType].airlines).forEach(
            ([, airlineData]: [string, any]) => {
              airlineData.flight_numbers.forEach((fn: any) => typeFlightIds.add(String(fn)));
            }
          );
        }
      });
      conditionFlightSets.push(typeFlightIds);
    }

    // Terminal-Airline combos
    const terminalField = `${selectedFilter.mode}_terminal`;
    const selectedTerminalAirlines = categories.terminal_airlines;
    if (selectedTerminalAirlines && selectedTerminalAirlines.length > 0) {
      const terminalFlightIds = new Set<string>();
      const terminalOptions = modeFilters[terminalField];
      selectedTerminalAirlines.forEach((combo) => {
        const parsed = parseTerminalAirlineCombo(combo);
        if (!parsed) return;
        const airlineData = terminalOptions?.[parsed.terminal]?.airlines?.[parsed.airline];
        if (airlineData) {
          airlineData.flight_numbers.forEach((fn: any) => terminalFlightIds.add(String(fn)));
        }
      });
      conditionFlightSets.push(terminalFlightIds);
    }

    // Airline / specific flight-number filter (예외: "airlineCode||flightId" 형태로 저장됨)
    const airlineFlightIds = categories.airline_flight_ids;
    if (airlineFlightIds && airlineFlightIds.length > 0) {
      const airlineFlightSet = new Set<string>(
        airlineFlightIds
          .map((id) => parseAirlineFlightId(id)?.flightId)
          .filter(Boolean) as string[]
      );
      conditionFlightSets.push(airlineFlightSet);
    } else {
      const selectedAirlines = categories.selected_airlines;
      if (selectedAirlines && selectedAirlines.length > 0) {
        const airlineFlightSet = new Set<string>();
        const terminalField = `${selectedFilter.mode}_terminal`;
        const terminalOptions = modeFilters[terminalField];
        if (terminalOptions) {
          Object.values(terminalOptions).forEach((terminalData: any) => {
            Object.entries(terminalData.airlines).forEach(([code, data]: [string, any]) => {
              if (selectedAirlines.includes(code)) {
                data.flight_numbers.forEach((fn: any) => airlineFlightSet.add(String(fn)));
              }
            });
          });
        }
        if (airlineFlightSet.size > 0) conditionFlightSets.push(airlineFlightSet);
      }
    }

    // Aircraft Class (type-level IDs take priority)
    const aircraftTypeFlightIds = categories.aircraft_type_flight_ids;
    if (aircraftTypeFlightIds && aircraftTypeFlightIds.length > 0) {
      const classOptions = modeFilters.aircraft_class;
      const classFlightIds = new Set<string>();
      if (classOptions) {
        aircraftTypeFlightIds.forEach((id) => {
          const sep = id.indexOf('||');
          if (sep < 0) return;
          const cls = id.slice(0, sep);
          const typeName = id.slice(sep + 2);
          const typeData = classOptions[cls]?.aircraft_types?.[typeName];
          if (typeData) {
            typeData.flight_numbers.forEach((fn: string) => classFlightIds.add(fn));
          }
        });
      }
      if (classFlightIds.size > 0) conditionFlightSets.push(classFlightIds);
    } else {
      const selectedClasses = categories.selected_aircraft_classes;
      if (selectedClasses && selectedClasses.length > 0) {
        const classFlightIds = new Set<string>();
        const classOptions = modeFilters.aircraft_class;
        if (classOptions) {
          selectedClasses.forEach((cls) => {
            const classData = classOptions[cls];
            if (classData?.aircraft_types) {
              Object.values(classData.aircraft_types).forEach((typeData: any) => {
                typeData.flight_numbers.forEach((fn: string) => classFlightIds.add(fn));
              });
            }
          });
        }
        if (classFlightIds.size > 0) conditionFlightSets.push(classFlightIds);
      }
    }

    // Location (Region/Country)
    const regionField = selectedFilter.mode === 'departure' ? 'arrival_region' : 'departure_region';
    const regionOptions = modeFilters[regionField];
    if (categories.region && categories.region.length > 0 && regionOptions) {
      const locationFlightIds = new Set<string>();
      categories.region.forEach((regionName) => {
        const regionData = regionOptions[regionName];
        if (regionData) {
          const currentCountries = categories.countries || [];
          const allCountriesInRegion = Object.keys(regionData.countries);
          const selectedCountriesInRegion = currentCountries.filter((c: string) =>
            allCountriesInRegion.includes(c)
          );
          const targetCountries =
            selectedCountriesInRegion.length === 0 ||
            selectedCountriesInRegion.length === allCountriesInRegion.length
              ? allCountriesInRegion
              : selectedCountriesInRegion;

          targetCountries.forEach((countryName) => {
            const countryData = regionData.countries[countryName];
            if (countryData?.airlines) {
              Object.entries(countryData.airlines).forEach(([, airlineData]: [string, any]) => {
                airlineData.flight_numbers.forEach((fn: any) =>
                  locationFlightIds.add(String(fn))
                );
              });
            }
          });
        }
      });
      if (locationFlightIds.size > 0) conditionFlightSets.push(locationFlightIds);
    }

    if (conditionFlightSets.length === 0) return { estimated: total, total };
    if (conditionFlightSets.length === 1) return { estimated: conditionFlightSets[0].size, total };

    let intersection = conditionFlightSets[0];
    for (let i = 1; i < conditionFlightSets.length; i++) {
      intersection = new Set([...intersection].filter((id) => conditionFlightSets[i].has(id)));
    }
    return { estimated: intersection.size, total };
  } catch {
    return { estimated: total, total };
  }
}
