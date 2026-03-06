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
            ([airlineCode, airlineData]: [string, any]) => {
              airlineData.flight_numbers.forEach((fn: number) => typeFlightIds.add(`${airlineCode}_${fn}`));
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
          airlineData.flight_numbers.forEach((fn: number) => terminalFlightIds.add(`${parsed.airline}_${fn}`));
        }
      });
      conditionFlightSets.push(terminalFlightIds);
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
              Object.entries(countryData.airlines).forEach(([airlineCode, airlineData]: [string, any]) => {
                airlineData.flight_numbers.forEach((fn: number) =>
                  locationFlightIds.add(`${airlineCode}_${fn}`)
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
