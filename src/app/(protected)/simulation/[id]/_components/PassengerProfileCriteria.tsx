'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, Search, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useSimulationStore } from '../_stores';
import { SetDistributionDialog } from './SetDistributionDialog';
import { DistributionValueSetter, LoadFactorValueSetter, ShowUpTimeValueSetter } from './ValueSetters';

interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

interface PassengerProfileCriteriaProps {
  parquetMetadata: ParquetMetadataItem[];
  definedProperties?: string[];
  configType?: string;
  onRuleSaved?: () => void;
  editingRule?: any; // 편집할 rule 데이터
  editingRuleIndex?: number; // 편집할 rule의 인덱스
}

export default function PassengerProfileCriteria({
  parquetMetadata,
  definedProperties = [],
  configType,
  onRuleSaved,
  editingRule,
  editingRuleIndex,
}: PassengerProfileCriteriaProps) {
  // 🎯 단순한 UI 상태만 관리
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [propertyValues, setPropertyValues] = useState<Record<string, number>>({});
  const [isValidDistribution, setIsValidDistribution] = useState(true);
  const [currentTotal, setCurrentTotal] = useState(100);

  // 초기값 설정 (새 생성 모드)
  useEffect(() => {
    if (!editingRule && definedProperties.length > 0) {
      if (configType === 'nationality' || configType === 'profile') {
        // 균등분배로 초기화 (1% 단위로 올림 처리)
        const equalPercentage = Math.floor(100 / definedProperties.length);
        let remainder = 100 - equalPercentage * definedProperties.length;

        const initialValues: Record<string, number> = {};
        definedProperties.forEach((prop, index) => {
          initialValues[prop] = equalPercentage + (index < remainder ? 1 : 0);
        });
        setPropertyValues(initialValues);
      } else if (configType === 'load_factor') {
        setPropertyValues({ load_factor: 0.8 }); // 80% 기본값
      } else if (configType === 'pax_arrival_patterns') {
        setPropertyValues({ mean: 120, std: 30 });
      }
    }
  }, [definedProperties, configType, editingRule]);

  // Reset 핸들러
  const handleReset = () => {
    if (configType === 'nationality' || configType === 'profile') {
      // 균등분배 로직 (1% 단위로 올림 처리)
      const equalPercentage = Math.floor(100 / definedProperties.length);
      let remainder = 100 - equalPercentage * definedProperties.length;

      const newValues: Record<string, number> = {};
      definedProperties.forEach((prop, index) => {
        newValues[prop] = equalPercentage + (index < remainder ? 1 : 0);
      });
      setPropertyValues(newValues);
    } else if (configType === 'load_factor') {
      // Load Factor는 0.8 (80%)로 초기화
      setPropertyValues({ load_factor: 0.8 });
    } else if (configType === 'pax_arrival_patterns') {
      // Pax Arrival Patterns 기본값
      setPropertyValues({ mean: 120, std: 30 });
    }
  };

  // Create 핸들러
  const handleCreate = () => {
    try {
      // 🎯 1. available_values 저장
      if (configType === 'nationality') {
        setNationalityValues(definedProperties);
      } else if (configType === 'profile') {
        setProfileValues(definedProperties);
      } else if (configType === 'load_factor') {
        setPaxGenerationValues(definedProperties);
      }

      // 🎯 2. 선택된 조건을 API 형태로 변환
      const conditions: Record<string, string[]> = {};
      Object.keys(selectedItems)
        .filter((key) => selectedItems[key])
        .forEach((key) => {
          const [columnKey, value] = key.split(':');

          // 선택된 값을 그대로 사용 (하드코딩 제거)
          let apiField = columnKey;
          let apiValue = value;

          if (!conditions[apiField]) {
            conditions[apiField] = [];
          }
          if (!conditions[apiField].includes(apiValue)) {
            conditions[apiField].push(apiValue);
          }
        });

      // 🎯 3. 규칙 추가 또는 수정
      const isEditMode = editingRuleIndex !== undefined && editingRuleIndex !== null;

      if (configType === 'nationality') {
        const decimalValues = Object.keys(propertyValues).reduce(
          (acc, key) => {
            acc[key] = (propertyValues[key] || 0) / 100; // 백분율 → 소수점
            return acc;
          },
          {} as Record<string, number>
        );

        if (isEditMode) {
          updateNationalityDistribution(editingRuleIndex, decimalValues);
        } else {
          const currentRulesLength = Object.keys(passengerData.nationality?.rules || {}).length;
          addNationalityRule(conditions, flightCalculations.totalSelected, decimalValues);
          updateNationalityDistribution(currentRulesLength, decimalValues);
        }
      } else if (configType === 'profile') {
        const decimalValues = Object.keys(propertyValues).reduce(
          (acc, key) => {
            acc[key] = (propertyValues[key] || 0) / 100;
            return acc;
          },
          {} as Record<string, number>
        );

        if (isEditMode) {
          updateProfileDistribution(editingRuleIndex, decimalValues);
        } else {
          const currentRulesLength = Object.keys(passengerData.profile?.rules || {}).length;
          addProfileRule(conditions, flightCalculations.totalSelected, decimalValues);
          updateProfileDistribution(currentRulesLength, decimalValues);
        }
      } else if (configType === 'load_factor') {
        // Load Factor는 단일 값으로 처리 (이미 0.0-1.0 범위임)
        const loadFactorValue = Object.values(propertyValues)[0] || 0;

        if (isEditMode) {
          updatePaxGenerationValue(editingRuleIndex, loadFactorValue);
        } else {
          addPaxGenerationRule(conditions, loadFactorValue);
        }
      } else if (configType === 'pax_arrival_patterns') {
        const newRule = {
          conditions,
          value: propertyValues,
        };

        if (isEditMode) {
          updatePaxArrivalPatternRule(editingRuleIndex, newRule);
        } else {
          addPaxArrivalPatternRule(newRule);
        }
      }

      // 🎯 4. 성공 처리
      if (onRuleSaved) {
        onRuleSaved();
      }
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
    }
  };

  // 타입별 제목 생성
  const getDialogTitle = () => {
    switch (configType) {
      case 'nationality':
        return 'Set Nationality Distribution';
      case 'profile':
        return 'Set Profile Distribution';
      case 'load_factor':
        return 'Set Load Factor';
      case 'pax_arrival_patterns':
        return 'Set Show-up Time';
      default:
        return 'Set Distribution';
    }
  };

  // 값 설정 컴포넌트 렌더링
  const renderValueSetter = () => {
    if (configType === 'nationality' || configType === 'profile') {
      return (
        <DistributionValueSetter
          properties={definedProperties}
          values={propertyValues}
          onChange={setPropertyValues}
          onValidationChange={setIsValidDistribution}
          onTotalChange={setCurrentTotal}
          configType={configType}
        />
      );
    } else if (configType === 'load_factor') {
      return (
        <LoadFactorValueSetter properties={definedProperties} values={propertyValues} onChange={setPropertyValues} />
      );
    } else if (configType === 'pax_arrival_patterns') {
      // 기본값을 store에서 가져와 전달
      const defaultValues = passengerData.pax_arrival_patterns?.default || { mean: 120, std: 30 };

      return (
        <ShowUpTimeValueSetter
          properties={definedProperties}
          values={propertyValues}
          onChange={setPropertyValues}
          defaultValues={defaultValues}
        />
      );
    }
    return null;
  };

  // 편집 모드일 때 기존 데이터 복원
  useEffect(() => {
    if (editingRule) {
      // 1. propertyValues 복원 (소수 → 백분율)
      if (editingRule.value) {
        if (configType === 'load_factor') {
          // 편집 모드: 0.0-1.0 값을 그대로 사용 (슬라이더에서 자동 변환됨)
          setPropertyValues({ load_factor: editingRule.value.load_factor || 0.8 });
        } else if (configType === 'pax_arrival_patterns') {
          setPropertyValues({
            mean: editingRule.value.mean || 120,
            std: editingRule.value.std || 30,
          });
        } else {
          // nationality, profile
          const percentValues = Object.keys(editingRule.value).reduce(
            (acc, key) => {
              acc[key] = (editingRule.value[key] || 0) * 100; // 0.5 → 50
              return acc;
            },
            {} as Record<string, number>
          );
          setPropertyValues(percentValues);
        }
      }

      // 2. selectedItems 복원 (조건 → UI 선택 상태)
      if (editingRule.conditions) {
        const restoredSelectedItems: Record<string, boolean> = {};

        Object.entries(editingRule.conditions).forEach(([apiField, values]: [string, any]) => {
          if (Array.isArray(values)) {
            values.forEach((apiValue) => {
              // 저장된 값을 그대로 사용 (변환 로직 제거)
              let uiField = apiField;
              let uiValue = apiValue;

              const itemKey = `${uiField}:${uiValue}`;
              restoredSelectedItems[itemKey] = true;
            });
          }
        });

        setSelectedItems(restoredSelectedItems);
      }
    }
  }, [editingRule, configType]);

  // 🎯 zustand에서 type 정보 가져오기
  const selectedConditions = useSimulationStore((state) => state.flight.selectedConditions);
  const filterType = selectedConditions?.type || 'departure'; // 기본값 departure

  // 🎯 zustand 액션들 가져오기
  const setNationalityValues = useSimulationStore((state) => state.setNationalityValues);
  const addNationalityRule = useSimulationStore((state) => state.addNationalityRule);
  const updateNationalityDistribution = useSimulationStore((state) => state.updateNationalityDistribution);
  const removeNationalityRule = useSimulationStore((state) => state.removeNationalityRule);
  const setProfileValues = useSimulationStore((state) => state.setProfileValues);
  const addProfileRule = useSimulationStore((state) => state.addProfileRule);
  const updateProfileDistribution = useSimulationStore((state) => state.updateProfileDistribution);
  const removeProfileRule = useSimulationStore((state) => state.removeProfileRule);
  const setPaxGenerationValues = useSimulationStore((state) => state.setPaxGenerationValues);
  const addPaxGenerationRule = useSimulationStore((state) => state.addPaxGenerationRule);
  const removePaxGenerationRule = useSimulationStore((state) => state.removePaxGenerationRule);
  const updatePaxGenerationValue = useSimulationStore((state) => state.updatePaxGenerationValue);
  const setPaxGenerationDefault = useSimulationStore((state) => state.setPaxGenerationDefault);

  // Show-up-Time 관련 액션들
  const addPaxArrivalPatternRule = useSimulationStore((state) => state.addPaxArrivalPatternRule);
  const removePaxArrivalPatternRule = useSimulationStore((state) => state.removePaxArrivalPatternRule);
  const updatePaxArrivalPatternRule = useSimulationStore((state) => state.updatePaxArrivalPatternRule);

  // 🎯 현재 상태 가져오기 (ruleIndex 계산용)
  const passengerData = useSimulationStore((state) => state.passenger);

  // 🎯 컬럼 분류 (올바른 카테고리로)
  const getColumnCategory = (columnKey: string): string | null => {
    if (
      columnKey === 'operating_carrier_name' ||
      columnKey === 'aircraft_type_icao' ||
      columnKey === 'total_seats' ||
      columnKey === 'flight_type'
    ) {
      return 'Airline & Aircraft';
    }

    // arrival_terminal과 scheduled_arrival_local은 항상 제외
    if (columnKey === 'arrival_terminal' || columnKey === 'scheduled_arrival_local') {
      return null;
    }

    // type에 따른 분류
    if (filterType === 'departure') {
      // departure 모드
      if (columnKey === 'departure_terminal' || columnKey === 'scheduled_departure_local') {
        return 'Departure Info';
      }
      // arrival 관련 컬럼들은 Arrival Info (arrival_terminal, scheduled_arrival_local 제외)
      if (columnKey.startsWith('arrival')) {
        return 'Arrival Info';
      }
      // 나머지 departure 관련 컬럼들은 제외 (실제로는 표시하지 않음)
      return null;
    } else {
      // arrival 모드
      // departure 관련 컬럼들은 Departure Info
      if (columnKey.startsWith('departure') || columnKey === 'scheduled_departure_local') {
        return 'Departure Info';
      }
      // 나머지 arrival 관련 컬럼들은 제외 (arrival_terminal, scheduled_arrival_local은 이미 위에서 제외됨)
      return null;
    }
  };

  const getColumnLabel = (columnKey: string) => {
    const labels: Record<string, string> = {
      operating_carrier_name: 'Airline',
      aircraft_type_icao: 'Aircraft Type',
      total_seats: 'Total Seats',
      flight_type: 'Flight Type',
      arrival_airport_iata: 'Arrival Airport',
      arrival_terminal: 'Arrival Terminal',
      arrival_city: 'Arrival City',
      arrival_country: 'Arrival Country',
      arrival_region: 'Arrival Region',
      departure_terminal: 'Departure Terminal',
      departure_airport_iata: 'Departure Airport Iata',
      departure_city: 'Departure City',
      departure_country: 'Departure Country',
      departure_region: 'Departure Region',
      scheduled_departure_local: 'Scheduled Departure Local',
      scheduled_arrival_local: 'Scheduled Arrival Local',
    };
    return labels[columnKey] || columnKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // 🎯 카테고리별 그룹화 (type에 따른 필터링 포함)
  const columnsByCategory: Record<string, Array<{ key: string; label: string; values: string[] }>> = {};

  parquetMetadata.forEach((item) => {
    // 🎯 적절한 카테고리로 분류
    const category = getColumnCategory(item.column);

    // null인 경우 (표시하지 않을 컬럼) 건너뛰기
    if (!category) return;

    const columnData = {
      key: item.column,
      label: getColumnLabel(item.column),
      values: Object.keys(item.values).sort((a, b) => {
        const flightsA = item.values[a].flights.length;
        const flightsB = item.values[b].flights.length;
        return flightsB - flightsA; // 내림차순 정렬 (항공편 수가 많은 것부터)
      }),
    };

    if (!columnsByCategory[category]) {
      columnsByCategory[category] = [];
    }
    columnsByCategory[category].push(columnData);
  });

  // 🎯 실시간 매칭 항공편 계산 (기존 OR/AND 로직 동일)
  const flightCalculations = useMemo(() => {
    const selectedKeys = Object.keys(selectedItems).filter((key) => selectedItems[key]);
    const airlineColumnData = parquetMetadata.find((item) => item.column === 'operating_carrier_name');

    // 항공사별 세부 정보 계산 (항상 모든 항공사 표시)
    const airlineBreakdown: Array<{ name: string; selected: number; total: number }> = [];

    if (selectedKeys.length === 0) {
      // 아무것도 선택하지 않은 경우 - 모든 항공사를 0 / total로 표시
      if (airlineColumnData) {
        Object.keys(airlineColumnData.values).forEach((airlineName) => {
          const totalForAirline = airlineColumnData.values[airlineName].flights.length;
          airlineBreakdown.push({
            name: airlineName,
            selected: 0,
            total: totalForAirline,
          });
        });
      }
      return {
        totalSelected: 0,
        airlineBreakdown: airlineBreakdown.sort((a, b) => b.total - a.total), // 전체 항공편 수 기준 내림차순
      };
    }

    // 컬럼별로 선택된 값들을 그룹화
    const conditionsByColumn: Record<string, string[]> = {};
    selectedKeys.forEach((key) => {
      const [columnKey, value] = key.split(':');
      if (!conditionsByColumn[columnKey]) {
        conditionsByColumn[columnKey] = [];
      }
      conditionsByColumn[columnKey].push(value);
    });

    // 각 컬럼의 조건을 만족하는 항공편 세트들을 구함
    const flightSetsByColumn: Set<string>[] = [];

    Object.entries(conditionsByColumn).forEach(([columnKey, values]) => {
      const columnData = parquetMetadata.find((item) => item.column === columnKey);
      if (!columnData) return;

      // 해당 컬럼에서 선택된 값들의 항공편들을 모두 수집 (OR 조건)
      const flightsInColumn = new Set<string>();
      values.forEach((value) => {
        if (columnData.values[value]) {
          columnData.values[value].flights.forEach((flight) => {
            flightsInColumn.add(flight);
          });
        }
      });

      if (flightsInColumn.size > 0) {
        flightSetsByColumn.push(flightsInColumn);
      }
    });

    // 모든 조건을 만족하는 항공편들의 교집합 구하기 (AND 조건)
    let matchingFlights: Set<string>;

    if (flightSetsByColumn.length === 0) {
      matchingFlights = new Set();
    } else if (flightSetsByColumn.length === 1) {
      matchingFlights = flightSetsByColumn[0];
    } else {
      matchingFlights = flightSetsByColumn[0];
      for (let i = 1; i < flightSetsByColumn.length; i++) {
        matchingFlights = new Set([...matchingFlights].filter((flight) => flightSetsByColumn[i].has(flight)));
      }
    }

    // 선택된 조건이 있는 경우 - 모든 항공사에 대해 계산
    if (airlineColumnData) {
      Object.keys(airlineColumnData.values).forEach((airlineName) => {
        const airlineFlights = new Set(airlineColumnData.values[airlineName].flights);
        // 선택된 항공편과 이 항공사 항공편의 교집합
        const selectedForAirline = [...matchingFlights].filter((flight) => airlineFlights.has(flight)).length;
        const totalForAirline = airlineColumnData.values[airlineName].flights.length;

        airlineBreakdown.push({
          name: airlineName,
          selected: selectedForAirline,
          total: totalForAirline,
        });
      });
    }

    return {
      totalSelected: matchingFlights.size,
      airlineBreakdown: airlineBreakdown.sort((a, b) => b.total - a.total), // 전체 항공편 수 기준 내림차순 (순서 고정)
    };
  }, [selectedItems, parquetMetadata]);

  // 전체 항공편 수 계산 (parquetMetadata에서)
  const totalFlights = useMemo(() => {
    const allFlights = new Set<string>();
    parquetMetadata.forEach((item) => {
      Object.values(item.values).forEach((valueData) => {
        valueData.flights.forEach((flight) => {
          allFlights.add(flight);
        });
      });
    });
    return allFlights.size;
  }, [parquetMetadata]);

  // 🎯 단순한 핸들러들
  const handleItemToggle = (itemKey: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleColumnSelect = (columnKey: string) => {
    setSelectedColumn((prev) => (prev === columnKey ? null : columnKey));
    setSearchQuery(''); // 컬럼 변경 시 검색어 리셋
  };

  const handleClearAll = () => {
    setSelectedItems({});
  };

  // Select All 로직
  const handleSelectAllInColumn = (columnKey: string, allValues: string[]) => {
    const allItemKeys = allValues.map((value) => `${columnKey}:${value}`);
    const allSelected = allItemKeys.every((key) => selectedItems[key]);

    if (allSelected) {
      // 모두 선택되어 있으면 모두 해제
      const newSelectedItems = { ...selectedItems };
      allItemKeys.forEach((key) => {
        delete newSelectedItems[key];
      });
      setSelectedItems(newSelectedItems);
    } else {
      // 모두 선택
      const newSelectedItems = { ...selectedItems };
      allItemKeys.forEach((key) => {
        newSelectedItems[key] = true;
      });
      setSelectedItems(newSelectedItems);
    }
  };

  // 현재 컬럼의 전체 선택 상태 확인
  const isAllSelectedInColumn = (columnKey: string, allValues: string[]) => {
    if (allValues.length === 0) return false; // 검색 결과가 없으면 체크 해제
    const allItemKeys = allValues.map((value) => `${columnKey}:${value}`);
    return allItemKeys.every((key) => selectedItems[key]);
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Criteria */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-default-900">Search Criteria</h4>
          <div className="flex items-center">
            <Button variant="outline" onClick={handleClearAll} disabled={selectedCount === 0}>
              Clear All
            </Button>
          </div>
        </div>

        {/* 3열 구조 */}
        <div className="flex h-96 gap-4">
          {/* 첫번째: 컬럼 목록 */}
          <div className="w-[40%] rounded-md border p-3">
            <div className="max-h-full space-y-4 overflow-y-auto">
              {Object.keys(columnsByCategory).length === 0 ? (
                <div className="py-8 text-center text-sm text-default-500">No columns available</div>
              ) : (
                Object.entries(columnsByCategory).map(([categoryName, columns]) => (
                  <div key={categoryName} className="space-y-2">
                    {/* 카테고리 제목 */}
                    <div className="text-sm font-semibold text-default-900">{categoryName}</div>
                    <div className="border-default-200 mb-2 border-b"></div>

                    {/* 컬럼 목록 */}
                    <div className="ml-2 space-y-1">
                      {columns.map((column) => (
                        <div
                          key={column.key}
                          className={`hover:bg-default-50 flex cursor-pointer items-center justify-between rounded px-2 py-1.5 transition-colors ${
                            selectedColumn === column.key ? 'bg-primary/10 text-primary' : ''
                          }`}
                          onClick={() => handleColumnSelect(column.key)}
                        >
                          <span className="truncate text-sm">{column.label}</span>
                          <ChevronDown className="h-3 w-3 -rotate-90" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 두번째: 선택된 컬럼의 상세 데이터 */}
          <div className="w-[40%] rounded-md border p-3">
            {selectedColumn ? (
              <div className="flex h-full flex-col">
                {(() => {
                  const columnData = parquetMetadata.find((item) => item.column === selectedColumn);
                  if (!columnData) {
                    return <div className="text-sm text-default-500">Column data not found</div>;
                  }

                  const sortedValues = Object.keys(columnData.values).sort((a, b) => {
                    const flightsA = columnData.values[a].flights.length;
                    const flightsB = columnData.values[b].flights.length;
                    return flightsB - flightsA; // 항공편 수 기준 내림차순
                  });

                  // 검색어에 따른 필터링
                  const filteredValues = sortedValues.filter((value) =>
                    value.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  const isAllSelected = isAllSelectedInColumn(selectedColumn, filteredValues);

                  return (
                    <>
                      {/* 헤더와 Select All */}
                      <div className="mb-3 flex items-center justify-between border-b pb-2">
                        <h6 className="text-sm font-semibold text-default-900">{getColumnLabel(selectedColumn)}</h6>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-all-${selectedColumn}`}
                            checked={isAllSelected}
                            onCheckedChange={() => handleSelectAllInColumn(selectedColumn, filteredValues)}
                          />
                          <label
                            htmlFor={`select-all-${selectedColumn}`}
                            className="text-default-700 cursor-pointer text-xs font-medium"
                          >
                            Select All
                          </label>
                        </div>
                      </div>

                      {/* 검색창 */}
                      <div className="relative mb-2">
                        <Search className="text-default-400 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="border-default-200/60 placeholder:text-default-400 w-full border-b bg-transparent py-1.5 pl-8 pr-3 text-xs focus:outline-none"
                        />
                      </div>

                      {/* 목록 */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="space-y-1">
                          {filteredValues.length === 0 && searchQuery ? (
                            <div className="py-4 text-center text-sm text-default-500">
                              No results found for "{searchQuery}"
                            </div>
                          ) : (
                            filteredValues.map((value) => {
                              const itemKey = `${selectedColumn}:${value}`;
                              const isSelected = selectedItems[itemKey] || false;
                              const flightCount = columnData.values[value].flights.length;

                              return (
                                <div key={value} className="flex items-center space-x-2 py-1 text-sm">
                                  <Checkbox
                                    id={itemKey}
                                    checked={isSelected}
                                    onCheckedChange={() => handleItemToggle(itemKey)}
                                  />
                                  <label htmlFor={itemKey} className="text-default-700 flex-1 cursor-pointer truncate">
                                    {value}
                                  </label>
                                  <span className="text-default-400 text-xs font-medium">{flightCount} flights</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-default-500">
                Select a column to view details
              </div>
            )}
          </div>

          {/* 세번째: Selected Flights */}
          <div className="w-[30%] rounded-md border p-3">
            <div className="flex h-full flex-col">
              <h4 className="mb-3 text-sm font-bold text-default-900">Flights</h4>

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-1">
                  {flightCalculations.airlineBreakdown.map((airline) => (
                    <div key={airline.name} className="rounded border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-default-900">{airline.name}</span>
                        <span className="text-sm">
                          <span className={`font-bold ${airline.selected > 0 ? 'text-primary' : 'text-default-600'}`}>
                            {airline.selected}
                          </span>
                          <span className="text-default-900"> / {airline.total}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Value Assignment - always show */}
      {definedProperties.length > 0 && (
        <SetDistributionDialog
          title={getDialogTitle()}
          onReset={handleReset}
          onCreate={handleCreate}
          isValid={isValidDistribution}
          totalValue={currentTotal}
          selectedFlights={flightCalculations.totalSelected}
          totalFlights={flightCalculations.totalFlights}
          showFlightValidation={configType === 'nationality' || configType === 'profile'}
          showTotalValidation={configType === 'nationality' || configType === 'profile'}
          isCreateDisabled={
            (configType === 'nationality' || configType === 'profile') &&
            (!isValidDistribution || flightCalculations.totalSelected === 0)
          }
        >
          {renderValueSetter()}
        </SetDistributionDialog>
      )}
    </div>
  );
}
