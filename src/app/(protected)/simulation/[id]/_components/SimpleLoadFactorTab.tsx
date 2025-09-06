'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Edit, Plus, Trash2, X } from 'lucide-react';
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
import { LoadFactorSlider } from '@/components/ui/LoadFactorSlider';
import { useSimulationStore } from '../_stores';
import InteractivePercentageBar from './InteractivePercentageBar';
import PassengerProfileCriteria from './PassengerProfileCriteria';

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
  loadFactor?: number; // 🔄 distribution → loadFactor (단순 백분율 값)
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

interface SimpleLoadFactorTabProps {
  parquetMetadata?: ParquetMetadataItem[];
}

export default function SimpleLoadFactorTab({ parquetMetadata = [] }: SimpleLoadFactorTabProps) {
  // 🆕 SimulationStore 연결
  const paxGenerationRules = useSimulationStore((s) => s.passenger.pax_generation.rules);
  const defaultLoadFactor = useSimulationStore((s) => s.passenger.pax_generation.default.load_factor);
  const addPaxGenerationRule = useSimulationStore((s) => s.addPaxGenerationRule);
  const removePaxGenerationRule = useSimulationStore((s) => s.removePaxGenerationRule);
  const updatePaxGenerationValue = useSimulationStore((s) => s.updatePaxGenerationValue);
  const updatePaxGenerationRuleStore = useSimulationStore((s) => s.updatePaxGenerationRule);
  const setPaxGenerationDefault = useSimulationStore((s) => s.setPaxGenerationDefault);
  const reorderPaxGenerationRules = useSimulationStore((s) => s.reorderPaxGenerationRules);

  // 🆕 조건 변환 로직 (다른 탭들과 동일)
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

  // 🆕 입력값 정규화 (1~100 정수로 제한)
  const normalizeLoadFactor = useCallback((value: number | null | undefined): number => {
    if (value === null || value === undefined || isNaN(value)) {
      return FRONTEND_DEFAULT_LOAD_FACTOR; // 85
    }
    return Math.max(1, Math.min(100, Math.round(value)));
  }, []);

  // 🆕 스마트 변환 함수: 입력값에 따라 자동 변환 (정수 처리)
  const convertToDecimal = useCallback(
    (value: number | null | undefined) => {
      const normalized = normalizeLoadFactor(value);
      return normalized / 100; // 정수 백분율을 소수점으로
    },
    [normalizeLoadFactor]
  );

  // 🆕 소수점을 백분율로 변환 (UI 표시용, 정수)
  const convertToPercentage = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return FRONTEND_DEFAULT_LOAD_FACTOR;
    }
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }, []);

  // 🔄 SimulationStore 데이터를 PassengerStore 형식으로 변환
  const createdRules: Rule[] = useMemo(() => {
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

    // 값 역변환 맵핑
    const reverseValueMapping: Record<string, Record<string, string>> = {
      operating_carrier_iata: {
        KE: 'Korean Air',
        OZ: 'Asiana Airlines',
        // 필요에 따라 추가
      },
    };

    return paxGenerationRules.map((rule, index) => ({
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
      loadFactor: convertToPercentage(rule.value?.load_factor || 0.8), // 백분율 값
      isExpanded: false,
    }));
  }, [paxGenerationRules, convertToPercentage]);

  const hasDefaultRule = defaultLoadFactor !== null && defaultLoadFactor !== undefined;

  // 🆕 컴포넌트에서 초기값 설정
  useEffect(() => {
    if (defaultLoadFactor === null || defaultLoadFactor === undefined) {
      setPaxGenerationDefault(0.85); // 85% → 0.85로 직접 설정
    }
  }, []); // 한 번만 실행

  // 🔄 PassengerStore 스타일 액션 어댑터들
  const addLoadFactorRule = useCallback(
    (rule: Rule) => {
      // 🆕 PassengerStore와 동일한 변환 로직 적용
      const backendConditions: Record<string, string[]> = {};

      // Display label을 실제 column key로 변환하는 맵핑
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

      // 값 변환 맵핑 (필요시)
      const valueMapping: Record<string, Record<string, string>> = {
        operating_carrier_iata: {
          'Korean Air': 'KE',
          'Asiana Airlines': 'OZ',
          // 필요에 따라 추가
        },
      };

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

      addPaxGenerationRule(backendConditions, convertToDecimal(rule.loadFactor));
    },
    [addPaxGenerationRule, convertToDecimal]
  );

  const updateLoadFactorRule = useCallback(
    (ruleId: string, updatedRule: Partial<Rule>) => {
      const ruleIndex = parseInt(ruleId.replace('rule-', ''));

      // 전체 규칙 업데이트인경우 (조건 + loadFactor + 플라이트카운트)
      if (updatedRule.conditions || updatedRule.flightCount !== undefined || updatedRule.loadFactor !== undefined) {
        // 현재 규칙 가져오기
        const currentRule = paxGenerationRules[ruleIndex];
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
        updatePaxGenerationRuleStore(
          ruleIndex,
          backendConditions,
          convertToDecimal(
            updatedRule.loadFactor ??
              (typeof currentRule.value === 'object' && currentRule.value?.load_factor
                ? currentRule.value.load_factor * 100
                : 85)
          )
        );
      }
    },
    [updatePaxGenerationRuleStore, paxGenerationRules, labelToColumnMap, valueMapping, convertToDecimal]
  );

  const removeLoadFactorRule = useCallback(
    (ruleId: string) => {
      const ruleIndex = parseInt(ruleId.replace('rule-', ''));
      removePaxGenerationRule(ruleIndex);
    },
    [removePaxGenerationRule]
  );

  const reorderLoadFactorRules = useCallback(
    (newOrder: Rule[]) => {
      // Rule[] 형식을 SimulationStore 형식으로 변환 (동일한 변환 로직 사용)
      const convertedRules = newOrder.map((rule) => {
        const backendConditions: Record<string, string[]> = {};

        // Display label을 실제 column key로 변환하는 맵핑
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

        // 값 변환 맵핑 (필요시)
        const valueMapping: Record<string, Record<string, string>> = {
          operating_carrier_iata: {
            'Korean Air': 'KE',
            'Asiana Airlines': 'OZ',
            // 필요에 따라 추가
          },
        };

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
          value: { load_factor: convertToDecimal(rule.loadFactor) },
        };
      });

      reorderPaxGenerationRules(convertedRules);
    },
    [reorderPaxGenerationRules, convertToDecimal]
  );

  const updateLoadFactorDefault = useCallback(
    (value: number | null | undefined) => {
      const safeValue = convertToDecimal(value); // 정규화 + 변환 적용
      setPaxGenerationDefault(safeValue);
    },
    [setPaxGenerationDefault, convertToDecimal]
  );

  // 프론트엔드 기본값 (하드코딩)
  const FRONTEND_DEFAULT_LOAD_FACTOR = 80;

  // 로컬 UI 상태 (PassengerStore와 무관한 것들)
  const [definedProperties] = useState<string[]>(['Load Factor']); // 고정값
  const [newPropertyName, setNewPropertyName] = useState<string>('');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // 항목 변경 확인창 상태
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'add' | 'remove';
    payload: string[];
  } | null>(null);

  // 드래그 앤 드랍 상태
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);

  // 첫글자 대문자로 변환하는 헬퍼 함수
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Load Factor는 고정 속성이므로 조정 로직 불필요
  // const adjustDistributionsForNewProperties = () => {};

  // Load Factor는 고정 속성이므로 추가/제거 로직 불필요
  const handleAddProperty = () => {
    // Load Factor 탭은 속성 고정
  };

  const handleRemoveProperty = () => {
    // Load Factor 탭은 속성 고정
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProperty();
    }
  };

  // Rule 관련 함수들
  const handleOpenRuleModal = () => {
    // 🔄 새 규칙 생성을 위해 editing 상태 초기화
    setEditingRuleId(null);
    setIsRuleModalOpen(true);
  };

  // 🚫 Load Factor에서는 분배(distribution) 개념이 없음 (단순 탑승률 값만 사용)
  // Show-up Time처럼 복사된 불필요한 분배 함수 → 제거됨

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

    // 🆕 PassengerStore 업데이트
    reorderLoadFactorRules(newRules);
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  // 확인창 처리 (Load Factor는 속성 고정이므로 단순화)
  const handleConfirmChanges = () => {
    setPendingAction(null);
    setShowConfirmDialog(false);
  };

  const handleCancelChanges = () => {
    setPendingAction(null);
    setShowConfirmDialog(false);
  };

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
    (savedRuleData: { conditions: string[]; flightCount: number; loadFactor: number }) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateLoadFactorRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            loadFactor: savedRuleData.loadFactor,
          });
        }
        setEditingRuleId(null);
        setIsRuleModalOpen(false);
      } else {
        // Create 모드에서 새 규칙 생성
        if (savedRuleData) {
          const loadFactor = normalizeLoadFactor(
            savedRuleData.loadFactor || (defaultLoadFactor ? defaultLoadFactor * 100 : undefined)
          );

          const newRule = {
            id: `rule-${Date.now()}`,
            name: `Rule ${createdRules.length + 1}`,
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            loadFactor,
            isExpanded: true,
          };

          addLoadFactorRule(newRule);
          setIsRuleModalOpen(false);
        }
      }
    },
    [editingRuleId, createdRules.length, defaultLoadFactor, updateLoadFactorRule, addLoadFactorRule]
  );

  // 전역 함수 등록 (메모리 누수 방지)
  useEffect(() => {
    (window as any).handleSimpleRuleSaved = handleRuleSaved;

    return () => {
      delete (window as any).handleSimpleRuleSaved;
    };
  }, [handleRuleSaved]);

  // 퍼센트 총합 검증 (메모이제이션)
  const isValidDistribution = useCallback((values: Record<string, number>) => {
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    return Math.abs(total - 100) < 0.1; // 소수점 오차 고려
  }, []);

  // 총합 계산 (메모이제이션)
  const getDistributionTotal = useCallback((values: Record<string, number>) => {
    return Object.values(values).reduce((sum, value) => sum + value, 0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Add Rules Section - 항상 표시 */}
      <div>
        <div className="flex items-center justify-between border-l-4 border-primary pl-4">
          <div>
            <h4 className="text-lg font-semibold text-default-900">Assign Load Factor Rules</h4>
            <p className="text-sm text-default-500">
              Apply different load factors to flights based on specific conditions
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
                    onClick={() => removeLoadFactorRule(rule.id)}
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

              {/* Load Factor Input */}
              <div className="mt-3">
                <div className="flex items-center gap-4">
                  <label className="flex-shrink-0 text-sm font-medium text-gray-700">Load Factor:</label>
                  <div className="flex-1 px-4">
                    <LoadFactorSlider
                      value={normalizeLoadFactor(
                        rule.loadFactor || (defaultLoadFactor ? defaultLoadFactor * 100 : undefined)
                      )}
                      onChange={(value) => updateLoadFactorRule(rule.id, { loadFactor: normalizeLoadFactor(value) })}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
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

            {/* Default Load Factor Input */}
            <div className="mt-3">
              <div className="flex items-center gap-4">
                <label className="flex-shrink-0 text-sm font-medium text-gray-700">Default Load Factor:</label>
                <div className="flex-1 px-4">
                  <LoadFactorSlider
                    value={normalizeLoadFactor(defaultLoadFactor ? defaultLoadFactor * 100 : undefined)}
                    onChange={(value) => updateLoadFactorDefault(normalizeLoadFactor(value))}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                ? 'Modify the flight conditions and load factor value for this rule.'
                : 'Select flight conditions and assign load factor value.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <PassengerProfileCriteria
              parquetMetadata={parquetMetadata}
              definedProperties={definedProperties}
              configType="load_factor"
              editingRule={editingRuleId ? createdRules.find((rule) => rule.id === editingRuleId) : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Change Confirmation Alert Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Confirm Property Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'add'
                ? 'Adding new properties will affect existing load factor rules. Do you want to continue?'
                : 'Removing properties will affect existing load factor rules. Do you want to continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <div className="text-sm text-muted-foreground">Affected items:</div>
            <ul className="list-inside list-disc space-y-1 rounded bg-muted p-3 text-sm">
              {createdRules.length > 0 && (
                <li>
                  {createdRules.length} load factor rule{createdRules.length > 1 ? 's' : ''}
                </li>
              )}
              {hasDefaultRule && <li>Default load factor rule</li>}
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChanges}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChanges}
              className="bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
