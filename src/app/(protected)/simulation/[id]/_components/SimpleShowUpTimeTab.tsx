'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, CheckCircle, Edit, Play, Plus, Trash2, X, XCircle } from 'lucide-react';
import { createPassengerShowUp } from '@/services/simulationService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { IntegerNumberInput } from '@/components/ui/IntegerNumberInput';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../_stores';
import InteractivePercentageBar from './InteractivePercentageBar';
import PassengerProfileCriteria from './PassengerProfileCriteria';

// Plotly를 동적으로 로드 (SSR 문제 방지)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex h-48 items-center justify-center text-gray-500">Loading chart...</div>,
});

// 기존 InteractivePercentageBar와 동일한 색상 팔레트
const COLORS = [
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5A2B', // Brown
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#64748B', // Slate
];

interface Rule {
  id: string;
  name: string;
  conditions: string[];
  flightCount: number;
  parameters?: { Mean: number; Std: number }; // 🔄 distribution → parameters (평균, 표준편차)
  isExpanded?: boolean;
}

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

interface SimpleShowUpTimeTabProps {
  parquetMetadata?: ParquetMetadataItem[];
  simulationId?: string;
  hideGenerateButton?: boolean;
}

export default function SimpleShowUpTimeTab({
  parquetMetadata = [],
  simulationId,
  hideGenerateButton = false,
}: SimpleShowUpTimeTabProps) {
  // 🆕 SimulationStore 연결
  const paxArrivalPatternRules = useSimulationStore((s) => s.passenger.pax_arrival_patterns.rules);
  const arrivalPatternsDefault = useSimulationStore((s) => s.passenger.pax_arrival_patterns.default);
  const addPaxArrivalPatternRule = useSimulationStore((s) => s.addPaxArrivalPatternRule);
  const updatePaxArrivalPatternRule = useSimulationStore((s) => s.updatePaxArrivalPatternRule);
  const removePaxArrivalPatternRule = useSimulationStore((s) => s.removePaxArrivalPatternRule);
  const setPaxArrivalPatternDefault = useSimulationStore((s) => s.setPaxArrivalPatternDefault);

  // 🆕 SimulationStore에서 passenger 데이터 및 context 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const contextData = useSimulationStore((state) => state.context);

  // 🔄 다른 탭 데이터들도 SimulationStore에서 직접 가져오기 (Generate Pax API용)
  const loadFactorData = useSimulationStore((s) => s.passenger.pax_generation);
  const nationalityData = useSimulationStore((s) => s.passenger.pax_demographics.nationality);
  const profileData = useSimulationStore((s) => s.passenger.pax_demographics.profile);

  // 🆕 Toast 및 API 호출 관련 상태
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // 🆕 조건 변환 로직 (Step 1과 동일)
  const labelToColumnMap: Record<string, string> = {
    Airline: 'operating_carrier_iata',
    'Aircraft Type': 'aircraft_type_icao',
    'Flight Type': 'flight_type',
    'Total Seats': 'total_seats',
    'Arrival Airport': 'arrival_airport_iata',
    'Arrival Terminal': 'arrival_terminal',
    'Arrival City': 'arrival_city',
    'Arrival Country': 'arrival_country',
    'Arrival Region': 'arrival_region',
    'Departure Airport Iata': 'departure_airport_iata',
    'Departure Terminal': 'departure_terminal',
    'Departure City': 'departure_city',
    'Departure Country': 'departure_country',
    'Departure Region': 'departure_region',
  };

  const valueMapping: Record<string, Record<string, string>> = {
    operating_carrier_iata: {
      'Korean Air': 'KE',
      'Asiana Airlines': 'OZ',
      // 필요에 따라 추가
    },
  };

  // 백엔드 → UI 역변환 맵핑
  const columnToLabelMap: Record<string, string> = {
    operating_carrier_iata: 'Airline',
    aircraft_type_icao: 'Aircraft Type',
    flight_type: 'Flight Type',
    total_seats: 'Total Seats',
    arrival_airport_iata: 'Arrival Airport',
    arrival_terminal: 'Arrival Terminal',
    arrival_city: 'Arrival City',
    arrival_country: 'Arrival Country',
    arrival_region: 'Arrival Region',
    departure_airport_iata: 'Departure Airport Iata',
    departure_terminal: 'Departure Terminal',
    departure_city: 'Departure City',
    departure_country: 'Departure Country',
    departure_region: 'Departure Region',
  };

  const reverseValueMapping: Record<string, Record<string, string>> = {
    operating_carrier_iata: {
      KE: 'Korean Air',
      OZ: 'Asiana Airlines',
      // 필요에 따라 추가
    },
  };

  // SimulationStore 데이터 변환
  const createdRules: Rule[] = useMemo(() => {
    return paxArrivalPatternRules.map((rule, index) => ({
      id: `rule-${index}`,
      name: `Rule ${index + 1}`,
      conditions: Object.entries(rule.conditions || {}).flatMap(([columnKey, values]) => {
        const displayLabel = columnToLabelMap[columnKey] || columnKey;
        return values.map((value) => {
          const displayValue = reverseValueMapping[columnKey]?.[value] || value;
          return `${displayLabel}: ${displayValue}`;
        });
      }),
      flightCount: 0, // SimulationStore에는 flightCount가 없으므로 기본값 0
      parameters: {
        Mean: rule.value?.mean || 120,
        Std: rule.value?.std || 30,
      },
      isExpanded: false,
    }));
  }, [paxArrivalPatternRules]);

  const hasDefaultRule = arrivalPatternsDefault.mean !== null && arrivalPatternsDefault.std !== null;
  const defaultMean = arrivalPatternsDefault.mean;
  const defaultStd = arrivalPatternsDefault.std;

  // 프론트엔드 기본값 (하드코딩)
  const FRONTEND_DEFAULT_MEAN = 120;
  const FRONTEND_DEFAULT_STD = 30;

  // 🆕 컴포넌트에서 초기값 설정 (Step 1과 동일한 패턴)
  useEffect(() => {
    if (defaultMean === null || defaultStd === null) {
      setPaxArrivalPatternDefault({
        mean: FRONTEND_DEFAULT_MEAN,
        std: FRONTEND_DEFAULT_STD,
      });
    }
  }, []); // 한 번만 실행

  // 액션 어댑터들
  const addShowUpTimeRule = useCallback(
    (rule: Rule) => {
      // UI 조건을 백엔드 형식으로 변환
      const backendConditions: Record<string, string[]> = {};

      rule.conditions.forEach((condition) => {
        const parts = condition.split(': ');
        if (parts.length === 2) {
          const displayLabel = parts[0];
          const value = parts[1];
          const columnKey = labelToColumnMap[displayLabel] || displayLabel.toLowerCase().replace(' ', '_');

          // 값 변환 적용 (있으면)
          const convertedValue = valueMapping[columnKey]?.[value] || value;

          if (!backendConditions[columnKey]) {
            backendConditions[columnKey] = [];
          }
          backendConditions[columnKey].push(convertedValue);
        }
      });

      addPaxArrivalPatternRule({
        conditions: backendConditions,
        value: {
          mean: rule.parameters?.['Mean'] || FRONTEND_DEFAULT_MEAN,
          std: rule.parameters?.['Std'] || FRONTEND_DEFAULT_STD,
        },
      });
    },
    [addPaxArrivalPatternRule]
  );

  const updateShowUpTimeRule = useCallback(
    (ruleId: string, updatedRule: Partial<Rule>) => {
      const ruleIndex = parseInt(ruleId.replace('rule-', ''));

      // 전체 규칙 업데이트인경우 (조건 + parameters + 플라이트카운트)
      if (updatedRule.conditions || updatedRule.flightCount !== undefined || updatedRule.parameters) {
        // 현재 규칙 가져오기
        const currentRule = paxArrivalPatternRules[ruleIndex];
        if (!currentRule) return;

        // UI 조건을 백엔드 형식으로 변환 (조건이 변경된 경우)
        let backendConditions = currentRule.conditions;
        if (updatedRule.conditions) {
          backendConditions = {};
          updatedRule.conditions.forEach((condition) => {
            const parts = condition.split(': ');
            if (parts.length === 2) {
              const displayLabel = parts[0];
              const value = parts[1];
              const columnKey = labelToColumnMap[displayLabel] || displayLabel.toLowerCase().replace(' ', '_');
              const convertedValue = valueMapping[columnKey]?.[value] || value;

              if (!backendConditions[columnKey]) {
                backendConditions[columnKey] = [];
              }
              backendConditions[columnKey].push(convertedValue);
            }
          });
        }

        // 전체 규칙 업데이트
        updatePaxArrivalPatternRule(ruleIndex, {
          conditions: backendConditions,
          value: {
            mean: updatedRule.parameters?.Mean ?? currentRule.value?.mean ?? FRONTEND_DEFAULT_MEAN,
            std: updatedRule.parameters?.Std ?? currentRule.value?.std ?? FRONTEND_DEFAULT_STD,
          },
        });
      }
    },
    [updatePaxArrivalPatternRule, paxArrivalPatternRules, labelToColumnMap, valueMapping]
  );

  const removeShowUpTimeRule = useCallback(
    (ruleId: string) => {
      const ruleIndex = parseInt(ruleId.replace('rule-', ''));
      removePaxArrivalPatternRule(ruleIndex);
    },
    [removePaxArrivalPatternRule]
  );

  const reorderShowUpTimeRules = useCallback((newOrder: Rule[]) => {
    // Rule[] 형식을 SimulationStore 형식으로 변환 (동일한 변환 로직 사용)
    const convertedRules = newOrder.map((rule) => {
      const backendConditions: Record<string, string[]> = {};

      rule.conditions.forEach((condition) => {
        const parts = condition.split(': ');
        if (parts.length === 2) {
          const displayLabel = parts[0];
          const value = parts[1];
          const columnKey = labelToColumnMap[displayLabel] || displayLabel.toLowerCase().replace(' ', '_');

          // 값 변환 적용 (있으면)
          const convertedValue = valueMapping[columnKey]?.[value] || value;

          if (!backendConditions[columnKey]) {
            backendConditions[columnKey] = [];
          }
          backendConditions[columnKey].push(convertedValue);
        }
      });

      return {
        conditions: backendConditions,
        value: {
          mean: rule.parameters?.['Mean'] || FRONTEND_DEFAULT_MEAN,
          std: rule.parameters?.['Std'] || FRONTEND_DEFAULT_STD,
        },
      };
    });

    // 전체 룰 배열을 교체
    useSimulationStore.getState().setPaxArrivalPatternRules(convertedRules);
  }, []);

  const updateShowUpTimeDefault = useCallback(
    (mean: number, std: number) => {
      setPaxArrivalPatternDefault({ mean, std });
    },
    [setPaxArrivalPatternDefault]
  );

  // 🆕 Generate Pax API 호출 함수
  const handleGeneratePax = async () => {
    if (!simulationId) {
      toast({
        title: 'Error',
        description: 'Simulation ID is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);

      // 🔧 SimulationStore에서 실제 데이터 수집하여 API 요청 body 구성
      const requestBody = {
        settings: {
          ...passengerData.settings,
          airport: contextData.airport || 'ICN',
          date: contextData.date || new Date().toISOString().split('T')[0], // 빈 날짜면 오늘 날짜 사용
          min_arrival_minutes: passengerData.settings?.min_arrival_minutes || 15,
        },
        pax_generation: {
          rules: loadFactorData.rules || [],
          default: {
            // 🆕 확실한 기본값 보장: null, undefined가 아닌 경우만 사용
            load_factor:
              loadFactorData.default?.load_factor !== null && loadFactorData.default?.load_factor !== undefined
                ? loadFactorData.default.load_factor
                : 0.85, // 기본값 85% (이미 소수점 형식)
          },
        },
        pax_demographics: {
          nationality: {
            available_values: nationalityData.available_values || [],
            rules: nationalityData.rules || [],
            default: nationalityData.default || {},
          },
          profile: {
            available_values: profileData.available_values || [],
            rules: profileData.rules || [],
            default: profileData.default || {},
          },
        },
        pax_arrival_patterns: {
          rules: paxArrivalPatternRules || [],
          default: {
            // 🆕 확실한 기본값 보장: null, undefined가 아닌 경우만 사용
            mean: defaultMean !== null && defaultMean !== undefined ? defaultMean : FRONTEND_DEFAULT_MEAN,
            std: defaultStd !== null && defaultStd !== undefined ? defaultStd : FRONTEND_DEFAULT_STD,
          },
        },
      };

      // 🔍 디버깅: 초기 상태에서 기본값 확인
      console.log('🔍 Context Data:', contextData);
      console.log('🔍 SimulationStore Passenger Data:', passengerData);
      console.log('🔍 SimulationStore Show-up Time:', {
        defaultMean,
        defaultStd,
        rulesCount: paxArrivalPatternRules.length,
      });
      console.log('🔍 SimulationStore Load Factor:', {
        defaultLoadFactor: loadFactorData?.default?.load_factor,
        rulesCount: loadFactorData?.rules?.length || 0,
      });
      console.log('🔍 SimulationStore Nationality:', {
        availableValues: nationalityData?.available_values?.length || 0,
        rulesCount: nationalityData?.rules?.length || 0,
        defaultKeys: Object.keys(nationalityData?.default || {}).length,
      });
      console.log('🔍 SimulationStore Profile:', {
        availableValues: profileData?.available_values?.length || 0,
        rulesCount: profileData?.rules?.length || 0,
        defaultKeys: Object.keys(profileData?.default || {}).length,
      });

      // 🎯 최종 API 요청 Body의 기본값들 확인
      console.log('🎯 Final API Request - Key Values:');
      console.log('   date:', requestBody.settings.date);
      console.log('   airport:', requestBody.settings.airport);
      console.log(
        '   load_factor:',
        requestBody.pax_generation.default.load_factor,
        `(${(loadFactorData?.default?.load_factor || 0.85) * 100}% 기준)`
      );
      console.log('   show_up_mean:', requestBody.pax_arrival_patterns.default.mean);
      console.log('   show_up_std:', requestBody.pax_arrival_patterns.default.std);

      console.log('🚀 Complete API Request Body:', requestBody);

      const { data: response } = await createPassengerShowUp(simulationId, requestBody);

      console.log('✅ API Response:', response);

      toast({
        title: 'Success',
        description: 'Passenger data has been generated successfully!',
      });

      // TODO: 응답 데이터 처리 (필요에 따라)
      // useSimulationStore.getState().setPassengerResults(response);
    } catch (error) {
      console.error('❌ Generate Pax API Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate passenger data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 로컬 UI 상태
  const [definedProperties] = useState<string[]>(['mean', 'std']); // 고정값
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // 드래그 앤 드랍 상태
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);

  // 첫글자 대문자로 변환하는 헬퍼 함수
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Show-up Time 탭에서는 속성 조정이 필요하지 않음 (mean, std 고정)
  // 균등 분배 조정 로직 제거됨

  // Show-up Time 탭에서는 속성 추가/제거 기능을 사용하지 않음
  // handleAddProperty, handleRemoveProperty 제거됨

  // Show-up Time 탭에서는 Enter 키 처리가 필요하지 않음
  // handleKeyPress 제거됨

  // Rule 관련 함수들
  const handleOpenRuleModal = () => {
    // 🔄 새 규칙 생성을 위해 editing 상태 초기화
    setEditingRuleId(null);
    setIsRuleModalOpen(true);
  };

  // 🚫 Show-up Time에서는 distribution 개념이 없음 (평균, 표준편차만 사용)
  // Load Factor에서 복사된 불필요한 함수 → 제거됨

  // 전체 항공편 수 (parquet_metadata에서 계산)
  const TOTAL_FLIGHTS = useMemo(() => {
    if (!parquetMetadata || parquetMetadata.length === 0) return 0;

    // parquet_metadata에서 모든 flight들을 수집하여 중복 제거 후 개수 계산
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

  // 룰 조건을 실제 flights로 변환하는 헬퍼 함수
  const calculateRuleFlights = useCallback(
    (conditions: string[]): Set<string> => {
      if (!parquetMetadata || parquetMetadata.length === 0 || conditions.length === 0) {
        return new Set();
      }

      // Display label을 실제 column key로 변환하는 맵핑
      const labelToColumnMap: Record<string, string> = {
        Airline: 'operating_carrier_name',
        'Aircraft Type': 'aircraft_type_icao',
        'Flight Type': 'flight_type',
        'Total Seats': 'total_seats',
        'Arrival Airport': 'arrival_airport_iata',
        'Arrival Terminal': 'arrival_terminal',
        'Arrival City': 'arrival_city',
        'Arrival Country': 'arrival_country',
        'Arrival Region': 'arrival_region',
        'Departure Airport Iata': 'departure_airport_iata',
        'Departure Terminal': 'departure_terminal',
        'Departure City': 'departure_city',
        'Departure Country': 'departure_country',
        'Departure Region': 'departure_region',
      };

      // 조건들을 컬럼별로 그룹화
      const conditionsByColumn: Record<string, string[]> = {};

      conditions.forEach((condition) => {
        // "Airline: Korean Air" 형태를 파싱
        const parts = condition.split(': ');
        if (parts.length === 2) {
          const displayLabel = parts[0];
          const value = parts[1];
          const actualColumnKey = labelToColumnMap[displayLabel] || displayLabel.toLowerCase().replace(' ', '_');

          if (!conditionsByColumn[actualColumnKey]) {
            conditionsByColumn[actualColumnKey] = [];
          }
          conditionsByColumn[actualColumnKey].push(value);
        }
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
      if (flightSetsByColumn.length === 0) {
        return new Set();
      } else if (flightSetsByColumn.length === 1) {
        return flightSetsByColumn[0];
      } else {
        let matchingFlights = flightSetsByColumn[0];
        for (let i = 1; i < flightSetsByColumn.length; i++) {
          matchingFlights = new Set([...matchingFlights].filter((flight) => flightSetsByColumn[i].has(flight)));
        }
        return matchingFlights;
      }
    },
    [parquetMetadata]
  );

  // 순차적 limited 계산 (메모이제이션)
  const flightCalculations = useMemo(() => {
    const actualCounts: Record<string, number> = {};
    const limitedCounts: Record<string, number> = {};
    let totalUsedFlights = 0;
    let usedFlightsSoFar = new Set<string>(); // 이미 사용된 flights 추적

    // 각 룰을 순차적으로 처리
    createdRules.forEach((rule, index) => {
      // 현재 룰의 실제 flights 계산
      const currentRuleFlights = calculateRuleFlights(rule.conditions);

      // 이전 룰들과 겹치지 않는 flights만 선택
      const availableFlights = [...currentRuleFlights].filter((flight) => !usedFlightsSoFar.has(flight));

      // 겹치는 flights 개수 (limited)
      const overlappingFlights = currentRuleFlights.size - availableFlights.length;

      // 실제 사용 가능한 편수
      const actualCount = availableFlights.length;

      actualCounts[rule.id] = actualCount;
      limitedCounts[rule.id] = overlappingFlights;
      totalUsedFlights += actualCount;

      // 사용된 flights를 추적 목록에 추가
      availableFlights.forEach((flight) => usedFlightsSoFar.add(flight));
    });

    const remainingFlights = Math.max(0, TOTAL_FLIGHTS - totalUsedFlights);

    return {
      actualCounts,
      limitedCounts,
      remainingFlights,
      usedFlights: totalUsedFlights,
      totalFlights: TOTAL_FLIGHTS,
    };
  }, [createdRules, parquetMetadata]); // parquetMetadata도 의존성에 추가

  // 드래그 앤 드랍 핸들러들
  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggingRuleId(ruleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ruleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, ruleId: string) => {
    e.preventDefault();
    if (draggingRuleId !== ruleId) {
      setDragOverRuleId(ruleId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 실제로 영역을 벗어났는지 확인 (자식 요소로 이동한 경우 제외)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverRuleId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault();

    if (!draggingRuleId || draggingRuleId === targetRuleId) {
      return;
    }

    const dragIndex = createdRules.findIndex((rule) => rule.id === draggingRuleId);
    const dropIndex = createdRules.findIndex((rule) => rule.id === targetRuleId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newRules = [...createdRules];
    const draggedRule = newRules[dragIndex];

    // 배열에서 드래그된 항목 제거
    newRules.splice(dragIndex, 1);
    // 새 위치에 삽입
    newRules.splice(dropIndex, 0, draggedRule);

    // Store 업데이트
    reorderShowUpTimeRules(newRules);
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  // Show-up Time 탭에서는 속성 변경 확인창이 필요하지 않음
  // handleConfirmChanges 제거됨

  // handleCancelChanges도 제거됨

  // 조건들을 카테고리별로 그룹화하는 함수 (메모이제이션)
  const groupConditionsByCategory = useCallback((conditions: string[]) => {
    const groups: Record<string, string[]> = {};

    conditions.forEach((condition) => {
      const parts = condition.split(': ');
      if (parts.length === 2) {
        const category = parts[0]; // "Airline", "Aircraft Type", etc.
        const value = parts[1]; // "Korean Air", "A21N", etc.

        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(value);
      }
    });

    return groups;
  }, []);

  // Rule 편집 시작
  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    setIsRuleModalOpen(true);
  };

  // Rule 편집 저장

  // PassengerProfileCriteria와 통신하기 위한 최적화된 콜백
  const handleRuleSaved = useCallback(
    (savedRuleData: { conditions: string[]; flightCount: number; parameters: { Mean: number; Std: number } }) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateShowUpTimeRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            parameters: savedRuleData.parameters, // { Mean: number, Std: number }
          });
        }
        setEditingRuleId(null);
        setIsRuleModalOpen(false);
      } else {
        // Create 모드에서 새 규칙 생성
        if (savedRuleData) {
          const parameters = savedRuleData.parameters || {
            Mean: defaultMean || FRONTEND_DEFAULT_MEAN,
            Std: defaultStd || FRONTEND_DEFAULT_STD,
          };

          const newRule = {
            id: `rule-${Date.now()}`,
            name: `Rule ${createdRules.length + 1}`,
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            parameters: savedRuleData.parameters || parameters, // { Mean: number, Std: number }
            isExpanded: true,
          };

          addShowUpTimeRule(newRule);
          setIsRuleModalOpen(false);
        }
      }
    },
    [editingRuleId, defaultMean, defaultStd, createdRules.length, updateShowUpTimeRule, addShowUpTimeRule]
  );

  // 전역 함수 등록 (메모리 누수 방지)
  useEffect(() => {
    (window as any).handleSimpleRuleSaved = handleRuleSaved;

    return () => {
      delete (window as any).handleSimpleRuleSaved;
    };
  }, [handleRuleSaved]);

  // Combined Distribution Chart 데이터 및 레이아웃 생성 (메모이제이션)
  const combinedChartConfig = useMemo(() => {
    const traces: any[] = [];
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

    // 전체 범위 계산 (모든 분포를 포함)
    const allMeans = [
      defaultMean || FRONTEND_DEFAULT_MEAN,
      ...createdRules.map((rule) => rule.parameters?.Mean || defaultMean || FRONTEND_DEFAULT_MEAN),
    ];
    const allStds = [
      defaultStd || FRONTEND_DEFAULT_STD,
      ...createdRules.map((rule) => rule.parameters?.Std || defaultStd || FRONTEND_DEFAULT_STD),
    ];

    const minMean = Math.min(...allMeans);
    const maxMean = Math.max(...allMeans);
    const maxStd = Math.max(...allStds);

    let rangeStart: number;
    let rangeEnd: number;

    // 단일 분포인지 확인 (default만 있는 경우)
    if (createdRules.length === 0) {
      // 단일 분포: 해당 분포 중심으로 적절한 범위 설정
      rangeStart = (defaultMean || FRONTEND_DEFAULT_MEAN) - 4 * (defaultStd || FRONTEND_DEFAULT_STD);
      rangeEnd = (defaultMean || FRONTEND_DEFAULT_MEAN) + 4 * (defaultStd || FRONTEND_DEFAULT_STD);
    } else {
      // 여러 분포: 모든 분포를 포함하는 범위
      rangeStart = minMean - 3 * maxStd;
      rangeEnd = maxMean + 3 * maxStd;
    }

    // 최소 범위 보장 (너무 좁은 범위 방지)
    const minRange = 20; // 최소 20 단위 범위
    if (rangeEnd - rangeStart < minRange) {
      const center = (rangeStart + rangeEnd) / 2;
      rangeStart = center - minRange / 2;
      rangeEnd = center + minRange / 2;
    }

    const steps = 200;
    const stepSize = (rangeEnd - rangeStart) / steps;

    // X축 공통 값
    const xValues: number[] = [];
    for (let i = 0; i <= steps; i++) {
      xValues.push(rangeStart + i * stepSize);
    }

    // Default 분포 추가
    const effectiveDefaultMean = defaultMean || FRONTEND_DEFAULT_MEAN;
    const effectiveDefaultStd = defaultStd || FRONTEND_DEFAULT_STD;
    if (!isNaN(effectiveDefaultMean) && !isNaN(effectiveDefaultStd) && effectiveDefaultStd > 0) {
      const defaultY = xValues.map(
        (x) =>
          (1 / (effectiveDefaultStd * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * Math.pow((x - effectiveDefaultMean) / effectiveDefaultStd, 2))
      );

      traces.push({
        x: xValues,
        y: defaultY,
        type: 'scatter',
        mode: 'lines',
        name: 'Default',
        line: {
          color: colors[0],
          width: 3,
        },
        fill: 'tonexty',
        fillcolor: `${colors[0]}15`, // 더 투명하게
      });
    }

    // Rule 분포들 추가
    createdRules.forEach((rule, index) => {
      const mean = rule.parameters?.Mean || defaultMean || FRONTEND_DEFAULT_MEAN;
      const std = rule.parameters?.Std || defaultStd || FRONTEND_DEFAULT_STD;

      if (!isNaN(mean) && !isNaN(std) && std > 0) {
        const ruleY = xValues.map(
          (x) => (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2))
        );

        traces.push({
          x: xValues,
          y: ruleY,
          type: 'scatter',
          mode: 'lines',
          name: rule.name,
          line: {
            color: colors[(index + 1) % colors.length],
            width: 2,
          },
          fill: 'tonexty',
          fillcolor: `${colors[(index + 1) % colors.length]}10`, // 더 투명하게
        });
      }
    });

    // 레이아웃 설정
    const layout = {
      title: {
        text: createdRules.length === 0 ? 'Normal Distribution Preview' : 'Combined Normal Distributions',
        font: { size: 16 },
      },
      xaxis: {
        title: 'Time (minutes)',
        showgrid: true,
        zeroline: true,
        range: [rangeStart, rangeEnd], // 명시적 범위 설정
        gridcolor: '#E5E7EB',
        zerolinecolor: '#9CA3AF',
      },
      yaxis: {
        title: 'Probability Density',
        showgrid: true,
        zeroline: false,
        gridcolor: '#E5E7EB',
      },
      margin: { t: 60, r: 40, b: 60, l: 80 },
      height: 400,
      showlegend: createdRules.length > 0, // 단일 분포일 때는 범례 숨김
      legend: {
        x: 1,
        xanchor: 'right',
        y: 1,
        yanchor: 'top',
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: '#E5E7EB',
        borderwidth: 1,
      },
      hovermode: 'x unified',
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
    };

    return { data: traces, layout };
  }, [defaultMean, defaultStd, createdRules, FRONTEND_DEFAULT_MEAN, FRONTEND_DEFAULT_STD]);

  return (
    <div className="space-y-6">
      {/* Add Rules Section - 항상 표시 */}
      <div>
        <div className="flex items-center justify-between border-l-4 border-primary pl-4">
          <div>
            <h4 className="text-lg font-semibold text-default-900">Assign Show-up Time Rules</h4>
            <p className="text-sm text-default-500">
              Apply different show-up time parameters to flights based on specific conditions
            </p>
          </div>

          <Button variant="primary" onClick={handleOpenRuleModal} className="flex items-center gap-2">
            <Plus size={16} />
            Add Rules
          </Button>
        </div>

        {/* Created Rules */}
        <div className="mt-4 space-y-4">
          {createdRules.map((rule) => (
            <div
              key={rule.id}
              draggable
              onDragStart={(e) => handleDragStart(e, rule.id)}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, rule.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, rule.id)}
              onDragEnd={handleDragEnd}
              className={`cursor-move rounded-lg border bg-white px-4 py-3 transition-all ${draggingRuleId === rule.id ? 'scale-95 opacity-50' : ''} ${dragOverRuleId === rule.id ? 'border-purple-400 bg-purple-50' : ''} hover:shadow-md`}
            >
              {/* Rule Header */}
              <div className="pointer-events-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 드래그 인디케이터 */}
                  <div className="flex flex-col gap-0.5 text-gray-400">
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-700">
                        {flightCalculations.actualCounts[rule.id] ?? rule.flightCount}
                      </span>
                      <span className="text-sm text-gray-500">/ {flightCalculations.totalFlights}</span>
                      <span className="text-sm text-gray-500">flights</span>
                    </div>
                    {(() => {
                      const limitedCount = flightCalculations.limitedCounts[rule.id];
                      return limitedCount && limitedCount > 0 ? (
                        <div className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                          -{limitedCount} limited
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="pointer-events-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => handleEditRule(rule.id)}
                  >
                    <Edit size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    onClick={() => removeShowUpTimeRule(rule.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* Rule Conditions - 카테고리별 배지 형태 */}
              {rule.conditions.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(groupConditionsByCategory(rule.conditions)).map(([category, values]) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="border-0 bg-blue-100 px-3 py-1 text-xs text-blue-700"
                      >
                        {values.join(' | ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Distribution Bar */}
              {rule.parameters && (
                <div className="mt-3">
                  <div className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Mean (minutes)</label>
                        <IntegerNumberInput
                          value={
                            rule.parameters.Mean !== undefined
                              ? rule.parameters.Mean
                              : defaultMean || FRONTEND_DEFAULT_MEAN
                          }
                          onChange={(newMean) => {
                            updateShowUpTimeRule(rule.id, {
                              parameters: {
                                Mean: newMean,
                                Std: rule.parameters?.Std || FRONTEND_DEFAULT_STD,
                              },
                            });
                          }}
                          placeholder={`${defaultMean || FRONTEND_DEFAULT_MEAN} minutes`}
                          unit="minutes"
                          min={0}
                          max={999}
                          className={
                            rule.parameters && (rule.parameters.Mean < 0 || rule.parameters.Std <= 0)
                              ? 'border-red-500 bg-red-50'
                              : ''
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Standard Deviation</label>
                        <IntegerNumberInput
                          value={
                            rule.parameters.Std !== undefined ? rule.parameters.Std : defaultStd || FRONTEND_DEFAULT_STD
                          }
                          onChange={(newStd) => {
                            updateShowUpTimeRule(rule.id, {
                              parameters: {
                                Mean: rule.parameters?.Mean || FRONTEND_DEFAULT_MEAN,
                                Std: newStd,
                              },
                            });
                          }}
                          placeholder={(defaultStd || FRONTEND_DEFAULT_STD).toString()}
                          min={1}
                          max={999}
                          className={
                            rule.parameters && (rule.parameters.Mean < 0 || rule.parameters.Std <= 0)
                              ? 'border-red-500 bg-red-50'
                              : ''
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {rule.parameters && rule.parameters.Mean >= 0 && rule.parameters.Std > 0 ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        Valid parameters (μ={rule.parameters.Mean}, σ={rule.parameters.Std})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={14} />
                        Invalid parameters (mean must be ≥0, std must be &gt;0)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Default Rule - 항상 표시 */}
          <div className="rounded-lg border bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="pointer-events-none border-0 bg-green-100 text-green-700">Default</Badge>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">{flightCalculations.remainingFlights}</span>
                  <span className="text-sm text-gray-500">/ {flightCalculations.totalFlights}</span>
                  <span className="text-sm text-gray-500">flights</span>
                </div>
              </div>
            </div>

            {/* Default Distribution Parameters */}
            <div className="mt-3">
              <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Mean (minutes)</label>
                    <IntegerNumberInput
                      value={defaultMean || FRONTEND_DEFAULT_MEAN}
                      onChange={(newMean) => {
                        updateShowUpTimeDefault(newMean, defaultStd || FRONTEND_DEFAULT_STD);
                      }}
                      placeholder={`${defaultMean || FRONTEND_DEFAULT_MEAN} minutes`}
                      unit="minutes"
                      min={0}
                      max={999}
                      className={(defaultMean || FRONTEND_DEFAULT_MEAN) < 0 ? 'border-red-500 bg-red-50' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Standard Deviation</label>
                    <IntegerNumberInput
                      value={defaultStd || FRONTEND_DEFAULT_STD}
                      onChange={(newStd) => {
                        updateShowUpTimeDefault(defaultMean || FRONTEND_DEFAULT_MEAN, newStd);
                      }}
                      placeholder={(defaultStd || FRONTEND_DEFAULT_STD).toString()}
                      min={1}
                      max={999}
                      className={(defaultStd || FRONTEND_DEFAULT_STD) <= 0 ? 'border-red-500 bg-red-50' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Default Validation Status */}
              <div className="mt-2 flex items-center gap-2 text-sm">
                {(defaultMean || FRONTEND_DEFAULT_MEAN) >= 0 && (defaultStd || FRONTEND_DEFAULT_STD) > 0 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={14} />
                    Valid parameters (μ={defaultMean || FRONTEND_DEFAULT_MEAN}, σ={defaultStd || FRONTEND_DEFAULT_STD})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={14} />
                    Invalid parameters (mean must be ≥0, std must be &gt;0)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Distribution Chart - 항상 표시 */}
      {(defaultMean || FRONTEND_DEFAULT_MEAN) &&
        (defaultStd || FRONTEND_DEFAULT_STD) &&
        (defaultStd || FRONTEND_DEFAULT_STD) > 0 && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <h4 className="mb-4 text-lg font-medium text-gray-900">Show-up Time Distributions Comparison</h4>
            {React.createElement(Plot as any, {
              data: combinedChartConfig.data,
              layout: combinedChartConfig.layout,
              config: {
                displayModeBar: false,
                responsive: true,
              },
              style: { width: '100%', height: '400px' },
            })}
          </div>
        )}

      {/* Generate Pax Button - 조건부 렌더링 */}
      {!hideGenerateButton && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleGeneratePax} disabled={isGenerating}>
            <Play size={16} />
            {isGenerating ? 'Generating...' : 'Generate Pax'}
          </Button>
        </div>
      )}

      {/* Create New Rule Modal */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRuleId
                ? `Update ${createdRules.find((rule) => rule.id === editingRuleId)?.name || 'Rule'}`
                : 'Create New Rule'}
            </DialogTitle>
            <DialogDescription>
              {editingRuleId
                ? 'Modify the flight conditions and show-up time parameters for this rule.'
                : 'Select flight conditions and assign show-up time parameters.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <PassengerProfileCriteria
              parquetMetadata={parquetMetadata}
              definedProperties={definedProperties}
              configType="show_up_time"
              editingRule={editingRuleId ? createdRules.find((rule) => rule.id === editingRuleId) : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Show-up Time 탭에서는 속성 변경 확인창이 필요하지 않음 */}
    </div>
  );
}
