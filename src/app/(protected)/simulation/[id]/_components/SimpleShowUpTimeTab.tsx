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
import { usePassengerStore } from '../_stores/passengerStore';
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
  distribution?: Record<string, number>;
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
}

export default function SimpleShowUpTimeTab({ parquetMetadata = [], simulationId }: SimpleShowUpTimeTabProps) {
  // 🆕 PassengerStore 연결
  const {
    showUpTime: { createdRules, hasDefaultRule, defaultMean, defaultStd },
    addShowUpTimeRule,
    updateShowUpTimeRule,
    removeShowUpTimeRule,
    reorderShowUpTimeRules,
    updateShowUpTimeDefault,
  } = usePassengerStore();

  // 🆕 SimulationStore에서 passenger 데이터 및 context 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const contextData = useSimulationStore((state) => state.context);

  // 🆕 PassengerStore에서 모든 필요한 데이터 가져오기
  const { loadFactor, nationality, profile } = usePassengerStore();

  // 🆕 Toast 및 API 호출 관련 상태
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // 프론트엔드 기본값 (하드코딩)
  const FRONTEND_DEFAULT_MEAN = 120;
  const FRONTEND_DEFAULT_STD = 30;

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

      // 🔧 PassengerStore에서 실제 데이터 수집하여 API 요청 body 구성
      const requestBody = {
        settings: {
          ...passengerData.settings,
          airport: contextData.airport || 'ICN',
          date: contextData.date || new Date().toISOString().split('T')[0], // 빈 날짜면 오늘 날짜 사용
          min_arrival_minutes: passengerData.settings?.min_arrival_minutes || 15,
        },
        pax_generation: {
          rules:
            loadFactor?.createdRules?.map((rule: any) => ({
              conditions: rule.conditions.reduce(
                (acc: any, condition: string) => {
                  const [key, value] = condition.split(': ');
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(value);
                  return acc;
                },
                {} as Record<string, string[]>
              ),
              value: { load_factor: (rule.distribution?.load_factor || 85) / 100 }, // 퍼센트를 소수점으로 변환
            })) || [],
          default: {
            // 🆕 확실한 기본값 보장: null, undefined, 0이 아닌 경우만 사용
            load_factor:
              (loadFactor?.defaultLoadFactor !== null &&
              loadFactor?.defaultLoadFactor !== undefined &&
              loadFactor?.defaultLoadFactor !== 0
                ? loadFactor.defaultLoadFactor
                : 85) / 100, // 퍼센트를 소수점으로 변환
          },
        },
        pax_demographics: {
          nationality: {
            available_values: nationality?.definedProperties || [],
            rules:
              nationality?.createdRules?.map((rule: any) => ({
                conditions: rule.conditions.reduce(
                  (acc: any, condition: string) => {
                    const [key, value] = condition.split(': ');
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(value);
                    return acc;
                  },
                  {} as Record<string, string[]>
                ),
                value: rule.distribution || {},
              })) || [],
            default: nationality?.defaultDistribution || {},
          },
          profile: {
            available_values: profile?.definedProperties || [],
            rules:
              profile?.createdRules?.map((rule: any) => ({
                conditions: rule.conditions.reduce(
                  (acc: any, condition: string) => {
                    const [key, value] = condition.split(': ');
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(value);
                    return acc;
                  },
                  {} as Record<string, string[]>
                ),
                value: rule.distribution || {},
              })) || [],
            default: profile?.defaultDistribution || {},
          },
        },
        pax_arrival_patterns: {
          rules: createdRules.map((rule) => ({
            conditions: rule.conditions.reduce(
              (acc, condition) => {
                const [key, value] = condition.split(': ');
                if (!acc[key]) acc[key] = [];
                acc[key].push(value);
                return acc;
              },
              {} as Record<string, string[]>
            ),
            value: rule.distribution || {
              mean: defaultMean !== null && defaultMean !== undefined ? defaultMean : FRONTEND_DEFAULT_MEAN,
              std: defaultStd !== null && defaultStd !== undefined ? defaultStd : FRONTEND_DEFAULT_STD,
            },
          })),
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
      console.log('🔍 PassengerStore Show-up Time:', {
        defaultMean,
        defaultStd,
        createdRules: createdRules.length,
      });
      console.log('🔍 PassengerStore Load Factor:', {
        defaultLoadFactor: loadFactor?.defaultLoadFactor,
        hasDefaultRule: loadFactor?.hasDefaultRule,
        createdRules: loadFactor?.createdRules?.length || 0,
      });
      console.log('🔍 PassengerStore Nationality:', {
        definedProperties: nationality?.definedProperties?.length || 0,
        defaultDistribution: Object.keys(nationality?.defaultDistribution || {}).length,
      });
      console.log('🔍 PassengerStore Profile:', {
        definedProperties: profile?.definedProperties?.length || 0,
        defaultDistribution: Object.keys(profile?.defaultDistribution || {}).length,
      });

      // 🎯 최종 API 요청 Body의 기본값들 확인
      console.log('🎯 Final API Request - Key Values:');
      console.log('   date:', requestBody.settings.date);
      console.log('   airport:', requestBody.settings.airport);
      console.log(
        '   load_factor:',
        requestBody.pax_generation.default.load_factor,
        `(${loadFactor?.defaultLoadFactor || 85}% → 소수점 변환)`
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

  // 로컬 UI 상태 (PassengerStore와 무관한 것들)
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

  // 균등분배 계산 함수 (메모이제이션)
  const calculateEqualDistribution = useCallback((properties: string[]) => {
    const equalPercentage = Math.floor(100 / properties.length);
    let remainder = 100 - equalPercentage * properties.length;

    const distribution: Record<string, number> = {};
    properties.forEach((prop, index) => {
      distribution[prop] = equalPercentage + (index < remainder ? 1 : 0);
    });
    return distribution;
  }, []);

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

  // PassengerProfileCriteria와 통신하기 위한 최적화된 콜백 (PassengerStore 연동)
  const handleRuleSaved = useCallback(
    (savedRuleData: { conditions: string[]; flightCount: number; distribution: { mean: number; std: number } }) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateShowUpTimeRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            distribution: savedRuleData.distribution, // { mean: number, std: number }
          });
        }
        setEditingRuleId(null);
        setIsRuleModalOpen(false);
      } else {
        // Create 모드에서 새 규칙 생성
        if (savedRuleData) {
          const distribution = savedRuleData.distribution || {
            mean: defaultMean || FRONTEND_DEFAULT_MEAN,
            std: defaultStd || FRONTEND_DEFAULT_STD,
          };

          const newRule = {
            id: `rule-${Date.now()}`,
            name: `Rule ${createdRules.length + 1}`,
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            distribution: savedRuleData.distribution || distribution, // { mean: number, std: number }
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

  // Show-up time 유효성 검증 (mean >= 0 && std > 0)
  const isValidDistribution = useCallback((values: Record<string, number> | { mean: number; std: number }) => {
    if ('mean' in values && 'std' in values) {
      return values.mean >= 0 && values.std > 0;
    }
    // fallback for other types
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    return Math.abs(total - 100) < 0.1; // 소수점 오차 고려
  }, []);

  // Show-up time 값 표시용 (mean과 std는 총합 개념이 없음)
  const getDistributionTotal = useCallback((values: Record<string, number> | { mean: number; std: number }) => {
    if ('mean' in values && 'std' in values) {
      return `μ=${values.mean}, σ=${values.std}`;
    }
    return Object.values(values).reduce((sum, value) => sum + value, 0);
  }, []);

  // Combined Distribution Chart 데이터 및 레이아웃 생성 (메모이제이션)
  const combinedChartConfig = useMemo(() => {
    const traces: any[] = [];
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

    // 전체 범위 계산 (모든 분포를 포함)
    const allMeans = [
      defaultMean || FRONTEND_DEFAULT_MEAN,
      ...createdRules.map((rule) => rule.distribution?.mean || defaultMean || FRONTEND_DEFAULT_MEAN),
    ];
    const allStds = [
      defaultStd || FRONTEND_DEFAULT_STD,
      ...createdRules.map((rule) => rule.distribution?.std || defaultStd || FRONTEND_DEFAULT_STD),
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
      const mean = rule.distribution?.mean || defaultMean || FRONTEND_DEFAULT_MEAN;
      const std = rule.distribution?.std || defaultStd || FRONTEND_DEFAULT_STD;

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
              {rule.distribution && (
                <div className="mt-3">
                  <div className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Mean (minutes)</label>
                        <IntegerNumberInput
                          value={
                            rule.distribution.mean !== undefined
                              ? rule.distribution.mean
                              : defaultMean || FRONTEND_DEFAULT_MEAN
                          }
                          onChange={(newMean) => {
                            updateShowUpTimeRule(rule.id, {
                              distribution: {
                                ...rule.distribution,
                                mean: newMean,
                              },
                            });
                          }}
                          placeholder={`${defaultMean || FRONTEND_DEFAULT_MEAN} minutes`}
                          unit="minutes"
                          min={0}
                          max={999}
                          className={
                            rule.distribution && !isValidDistribution(rule.distribution)
                              ? 'border-red-500 bg-red-50'
                              : ''
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Standard Deviation</label>
                        <IntegerNumberInput
                          value={
                            rule.distribution.std !== undefined
                              ? rule.distribution.std
                              : defaultStd || FRONTEND_DEFAULT_STD
                          }
                          onChange={(newStd) => {
                            updateShowUpTimeRule(rule.id, {
                              distribution: {
                                ...rule.distribution,
                                std: newStd,
                              },
                            });
                          }}
                          placeholder={(defaultStd || FRONTEND_DEFAULT_STD).toString()}
                          min={1}
                          max={999}
                          className={
                            rule.distribution && !isValidDistribution(rule.distribution)
                              ? 'border-red-500 bg-red-50'
                              : ''
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {isValidDistribution(rule.distribution) ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        Valid distribution (
                        {typeof getDistributionTotal(rule.distribution) === 'string'
                          ? getDistributionTotal(rule.distribution)
                          : `Total: ${(getDistributionTotal(rule.distribution) as number).toFixed(1)}%`}
                        )
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={14} />
                        {typeof getDistributionTotal(rule.distribution) === 'string'
                          ? 'Invalid parameters (mean must be ≥0, std must be >0)'
                          : `Total must equal 100% (Current: ${(getDistributionTotal(rule.distribution) as number).toFixed(1)}%)`}
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
                        updateShowUpTimeDefault({ mean: newMean, std: defaultStd || FRONTEND_DEFAULT_STD });
                      }}
                      placeholder={`${defaultMean || FRONTEND_DEFAULT_MEAN} minutes`}
                      unit="minutes"
                      min={0}
                      max={999}
                      className={
                        !isValidDistribution({
                          mean: defaultMean || FRONTEND_DEFAULT_MEAN,
                          std: defaultStd || FRONTEND_DEFAULT_STD,
                        })
                          ? 'border-red-500 bg-red-50'
                          : ''
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Standard Deviation</label>
                    <IntegerNumberInput
                      value={defaultStd || FRONTEND_DEFAULT_STD}
                      onChange={(newStd) => {
                        updateShowUpTimeDefault({ mean: defaultMean || FRONTEND_DEFAULT_MEAN, std: newStd });
                      }}
                      placeholder={(defaultStd || FRONTEND_DEFAULT_STD).toString()}
                      min={1}
                      max={999}
                      className={
                        !isValidDistribution({
                          mean: defaultMean || FRONTEND_DEFAULT_MEAN,
                          std: defaultStd || FRONTEND_DEFAULT_STD,
                        })
                          ? 'border-red-500 bg-red-50'
                          : ''
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Default Validation Status */}
              <div className="mt-2 flex items-center gap-2 text-sm">
                {isValidDistribution({
                  mean: defaultMean || FRONTEND_DEFAULT_MEAN,
                  std: defaultStd || FRONTEND_DEFAULT_STD,
                }) ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={14} />
                    Valid distribution (
                    {typeof getDistributionTotal({
                      mean: defaultMean || FRONTEND_DEFAULT_MEAN,
                      std: defaultStd || FRONTEND_DEFAULT_STD,
                    }) === 'string'
                      ? getDistributionTotal({
                          mean: defaultMean || FRONTEND_DEFAULT_MEAN,
                          std: defaultStd || FRONTEND_DEFAULT_STD,
                        })
                      : `Total: ${(getDistributionTotal({ mean: defaultMean || FRONTEND_DEFAULT_MEAN, std: defaultStd || FRONTEND_DEFAULT_STD }) as number).toFixed(1)}%`}
                    )
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={14} />
                    {typeof getDistributionTotal({
                      mean: defaultMean || FRONTEND_DEFAULT_MEAN,
                      std: defaultStd || FRONTEND_DEFAULT_STD,
                    }) === 'string'
                      ? 'Invalid parameters (mean must be ≥0, std must be >0)'
                      : `Total must equal 100% (Current: ${(getDistributionTotal({ mean: defaultMean || FRONTEND_DEFAULT_MEAN, std: defaultStd || FRONTEND_DEFAULT_STD }) as number).toFixed(1)}%)`}
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

      {/* Generate Pax Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleGeneratePax} disabled={isGenerating}>
          <Play size={16} />
          {isGenerating ? 'Generating...' : 'Generate Pax'}
        </Button>
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
