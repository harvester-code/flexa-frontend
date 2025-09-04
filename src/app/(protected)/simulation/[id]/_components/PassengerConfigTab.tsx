'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit, Plus, Save, Trash2 } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../_stores';
import { DistributionSection } from './DistributionSection';
import { LoadFactorSection } from './LoadFactorSection';
import MultipleDistributionChart from './MultipleDistributionChart';
import { NormalDistributionSection } from './NormalDistributionSection';
import PassengerProfileCriteria from './PassengerProfileCriteria';
import { RuleValueDisplay } from './RuleValueDisplay';

interface TabConfig {
  type: 'load_factor' | 'nationality' | 'profile' | 'pax_arrival_patterns';
  defaultValues: Record<string, any>;
  labels: {
    step1Title: string;
    step3Title: string;
  };
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

interface PassengerConfigTabProps {
  config: TabConfig;
  parquetMetadata: ParquetMetadataItem[];
}

export default function PassengerConfigTab({ config, parquetMetadata }: PassengerConfigTabProps) {
  // 로컬 상태
  const [definedProperties, setDefinedProperties] = useState<string[]>([]);
  const [newPropertyName, setNewPropertyName] = useState<string>('');
  const [percentageValues, setPercentageValues] = useState<Record<string, number>>({});
  const [isValid, setIsValid] = useState<boolean>(true);
  const [totalPercentage, setTotalPercentage] = useState<number>(100);

  // Default 값 설정 여부 (전체 적용 vs 선택 항공편만 적용)
  const [useDefaultValues, setUseDefaultValues] = useState<boolean>(true);

  // 이름 편집 상태
  const [editingPropertyIndex, setEditingPropertyIndex] = useState<number | null>(null);
  const [editingPropertyValue, setEditingPropertyValue] = useState<string>('');
  const editingInputRef = useRef<HTMLInputElement>(null);

  // Dialog 상태 관리
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState<boolean>(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  // 확인 Dialog 상태 관리
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  // Save 상태 추적
  const [hasSaved, setHasSaved] = useState<boolean>(false);

  // Property 변경 상태 추적 (Add/Remove property 시에만 true가 됨)
  const [hasPropertyChanged, setHasPropertyChanged] = useState<boolean>(false);

  // Toast hook
  const { toast } = useToast();

  // Zustand 액션들
  const setNationalityValues = useSimulationStore((state) => state.setNationalityValues);
  const setProfileValues = useSimulationStore((state) => state.setProfileValues);
  const setPaxGenerationValues = useSimulationStore((state) => state.setPaxGenerationValues);
  const updateNationalityDistribution = useSimulationStore((state) => state.updateNationalityDistribution);
  const updateProfileDistribution = useSimulationStore((state) => state.updateProfileDistribution);
  const updatePaxGenerationDistribution = useSimulationStore((state) => state.updatePaxGenerationDistribution);
  const setNationalityDefault = useSimulationStore((state) => state.setNationalityDefault);
  const setProfileDefault = useSimulationStore((state) => state.setProfileDefault);
  const setPaxGenerationDefault = useSimulationStore((state) => state.setPaxGenerationDefault);

  // 저장된 rules 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const removeNationalityRule = useSimulationStore((state) => state.removeNationalityRule);
  const removeProfileRule = useSimulationStore((state) => state.removeProfileRule);
  const removePaxGenerationRule = useSimulationStore((state) => state.removePaxGenerationRule);

  // Nationality 기본값 설정 useEffect
  useEffect(() => {
    // Nationality 타입이고 빈 배열이면 기본값 설정
    if (config.type === 'nationality') {
      const currentNationalityValues = passengerData.pax_demographics.nationality.available_values || [];
      if (currentNationalityValues.length === 0) {
        const defaultValues = ['Domestic', 'Foreign'];
        setNationalityValues(defaultValues);
      }
    }
  }, [config.type, passengerData.pax_demographics.nationality.available_values]);

  // 초기화 useEffect
  useEffect(() => {
    const currentValues = getCurrentValues();
    setDefinedProperties(currentValues);

    if (currentValues.length > 0) {
      const initialPercentages: Record<string, number> = {};
      const equalPercentage = Math.floor(100 / currentValues.length);
      let remainder = 100 - equalPercentage * currentValues.length;

      currentValues.forEach((value, index) => {
        initialPercentages[value] = equalPercentage + (index < remainder ? 1 : 0);
      });

      setPercentageValues(initialPercentages);

      const total = Object.values(initialPercentages).reduce((sum, val) => sum + val, 0);
      setTotalPercentage(total);
      setIsValid(total === 100);
    }
  }, [
    config.type,
    passengerData.pax_demographics.nationality.available_values,
    passengerData.pax_demographics.profile.available_values,
  ]);

  // 현재 정의된 값들 가져오기 (중복 제거)
  const getCurrentValues = () => {
    let values: string[] = [];

    switch (config.type) {
      case 'nationality':
        values = passengerData.pax_demographics.nationality.available_values || [];
        break;
      case 'profile':
        values = passengerData.pax_demographics.profile.available_values || [];
        break;
      case 'load_factor':
        values = ['load_factor']; // Load Factor는 단일 값
        break;
      case 'pax_arrival_patterns':
        values = ['mean', 'std']; // Show-up-Time은 평균과 표준편차
        break;
      default:
        values = [];
        break;
    }

    // 중복 제거
    return Array.from(new Set(values));
  };

  // 각 단어의 첫 글자를 대문자로 변환하는 함수
  const capitalizeWords = (text: string) => {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Property 추가 핸들러 (콤마로 구분된 여러 값 지원)
  const handleAddProperty = () => {
    if (!newPropertyName.trim()) return;

    const currentValues = getCurrentValues();

    // 콤마로 구분하여 여러 property 처리
    const inputProperties = newPropertyName
      .split(',')
      .map((prop) => capitalizeWords(prop.trim())) // 각 단어의 첫 글자를 대문자로 변환
      .filter((prop) => prop.length > 0); // 빈 문자열 제거

    // 입력값 내에서도 중복 제거
    const uniqueInputProperties = Array.from(new Set(inputProperties));

    // 기존 값과 비교하여 중복 제거
    const propertiesToAdd = uniqueInputProperties.filter((prop) => !currentValues.includes(prop));

    if (propertiesToAdd.length > 0) {
      const newValues = [...currentValues, ...propertiesToAdd];

      // Zustand에 저장
      switch (config.type) {
        case 'nationality':
          setNationalityValues(newValues);
          break;
        case 'profile':
          setProfileValues(newValues);
          break;
        default:
          break;
      }

      // 균등분배로 새로운 퍼센티지 값 설정 (1% 단위로 올림 처리)
      if (config.type === 'nationality' || config.type === 'profile') {
        const equalPercentage = Math.floor(100 / newValues.length);
        let remainder = 100 - equalPercentage * newValues.length;

        const newPercentageValues: Record<string, number> = {};
        newValues.forEach((value, index) => {
          newPercentageValues[value] = equalPercentage + (index < remainder ? 1 : 0);
        });
        setPercentageValues(newPercentageValues);
      }

      // Property가 변경됨을 표시
      setHasPropertyChanged(true);
    }
    setNewPropertyName('');
  };

  // Property 제거 핸들러
  const handleRemoveProperty = (propertyToRemove: string) => {
    const currentValues = getCurrentValues();
    const newValues = currentValues.filter((v) => v !== propertyToRemove);

    // Zustand에서 제거
    switch (config.type) {
      case 'nationality':
        setNationalityValues(newValues);
        break;
      case 'profile':
        setProfileValues(newValues);
        break;
      default:
        break;
    }

    // Property가 변경됨을 표시
    setHasPropertyChanged(true);

    // 제거된 값을 제외한 나머지를 균등분배로 재설정 (1% 단위로 올림 처리)
    if (newValues.length > 0 && (config.type === 'nationality' || config.type === 'profile')) {
      const equalPercentage = Math.floor(100 / newValues.length);
      let remainder = 100 - equalPercentage * newValues.length;

      const newPercentageValues: Record<string, number> = {};
      newValues.forEach((value, index) => {
        newPercentageValues[value] = equalPercentage + (index < remainder ? 1 : 0);
      });
      setPercentageValues(newPercentageValues);
    } else {
      setPercentageValues({});
    }
  };

  // 퍼센티지 변경 핸들러
  const handlePercentageChange = (newValues: Record<string, number>) => {
    setPercentageValues(newValues);
  };

  // 확인 dialog에서 확인 클릭 시 실제 save 처리
  const handleConfirmSave = () => {
    setIsConfirmDialogOpen(false);

    const currentRules = getCurrentRules();

    if (hasPropertyChanged) {
      // Property가 변경된 경우: 기존 rules 모두 삭제
      currentRules.forEach((_, index) => {
        switch (config.type) {
          case 'nationality':
            removeNationalityRule(0); // 항상 0번 인덱스 제거 (배열이 줄어들기 때문)
            break;
          case 'profile':
            removeProfileRule(0);
            break;
          case 'load_factor':
            removePaxGenerationRule(0);
            break;
          default:
            break;
        }
      });
    } else {
      // Default switch만 변경된 경우: Default rule만 제거 (현재 default를 clear하면 됨)
      // performSave에서 default 값을 설정/클리어하므로 여기서는 추가 작업 불필요
    }

    performSave();
  };

  // 확인 dialog에서 취소 클릭
  const handleCancelSave = () => {
    setIsConfirmDialogOpen(false);
  };

  // 실제 저장 로직
  const performSave = () => {
    if (useDefaultValues) {
      // Default 값 설정 모드: 백분율을 소수점으로 변환해서 default에 저장
      const normalizedDistribution: Record<string, number> = {};
      Object.entries(percentageValues).forEach(([key, value]) => {
        normalizedDistribution[key] = value / 100;
      });

      // 각 타입에 맞게 default 값 저장
      switch (config.type) {
        case 'nationality':
          setNationalityDefault(normalizedDistribution);
          break;
        case 'profile':
          setProfileDefault(normalizedDistribution);
          break;
        case 'load_factor':
          setPaxGenerationDefault(normalizedDistribution.load_factor || null);
          break;
        default:
          break;
      }

      toast({
        title: 'Save Complete',
        description: 'Default values have been saved. Will apply to all flights.',
      });
    } else {
      // 선택 항공편만 적용 모드: default는 비우고 키 종류만 저장
      switch (config.type) {
        case 'nationality':
          setNationalityDefault({}); // default 비우기
          break;
        case 'profile':
          setProfileDefault({}); // default 비우기
          break;
        case 'load_factor':
          setPaxGenerationDefault(null); // default 비우기
          break;
        default:
          break;
      }

      toast({
        title: 'Save Complete',
        description: 'Property types have been saved. Configure specific values in search criteria below.',
      });
    }

    // Mark that Save button has been clicked
    setHasSaved(true);

    // Property 변경 상태 리셋
    setHasPropertyChanged(false);
  };

  // Save handler
  const handleSave = () => {
    if (useDefaultValues && !isValid) {
      toast({
        title: 'Save Failed',
        description: 'Total percentage must equal 100%',
        variant: 'destructive',
      });
      return;
    }

    const currentRules = getCurrentRules();

    // 기존 rules가 없거나 property가 변경되지 않은 경우 (Default switch만 변경) 바로 저장
    if (currentRules.length === 0 || !hasPropertyChanged) {
      performSave();
      return;
    }

    // 기존 rules가 있고 property가 변경된 경우에만 확인 dialog 표시
    setIsConfirmDialogOpen(true);
  };

  // Enter 키 핸들러
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddProperty();
    }
  };

  // 편집 input 포커스 시 자동 선택
  useEffect(() => {
    if (editingPropertyIndex !== null && editingInputRef.current) {
      editingInputRef.current.focus();
      editingInputRef.current.select();
    }
  }, [editingPropertyIndex]);

  // Property 이름 편집 시작
  const handleStartEditing = (index: number, currentValue: string) => {
    setEditingPropertyIndex(index);
    setEditingPropertyValue(currentValue);
  };

  // Property 이름 변경 완료
  const handlePropertyNameChange = () => {
    if (editingPropertyIndex === null || !editingPropertyValue.trim()) {
      handleCancelEditing();
      return;
    }

    const currentValues = getCurrentValues();
    const oldName = currentValues[editingPropertyIndex];
    const newName = capitalizeWords(editingPropertyValue.trim());

    // 같은 이름이거나 이미 존재하는 이름이면 취소
    if (newName === oldName || currentValues.includes(newName)) {
      handleCancelEditing();
      return;
    }

    // 이름 변경
    const updatedValues = [...currentValues];
    updatedValues[editingPropertyIndex] = newName;

    // Zustand에 저장
    switch (config.type) {
      case 'nationality':
        setNationalityValues(updatedValues);
        break;
      case 'profile':
        setProfileValues(updatedValues);
        break;
      default:
        break;
    }

    // 퍼센티지 값도 업데이트 (키 이름 변경)
    if (config.type === 'nationality' || config.type === 'profile') {
      const newPercentageValues = { ...percentageValues };
      if (newPercentageValues[oldName] !== undefined) {
        newPercentageValues[newName] = newPercentageValues[oldName];
        delete newPercentageValues[oldName];
        setPercentageValues(newPercentageValues);
      }
    }

    // Property가 변경됨을 표시
    setHasPropertyChanged(true);

    handleCancelEditing();
  };

  // Property 이름 편집 취소
  const handleCancelEditing = () => {
    setEditingPropertyIndex(null);
    setEditingPropertyValue('');
  };

  // 편집 중 키 입력 처리
  const handleEditingKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePropertyNameChange();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  // Rule 관리 헬퍼 함수들
  const getCurrentRules = () => {
    let rules: any[] = [];
    let defaultValues: any = null;

    if (config.type === 'nationality') {
      rules = passengerData.pax_demographics.nationality.rules || [];
      defaultValues = passengerData.pax_demographics.nationality.default;
    } else if (config.type === 'profile') {
      rules = passengerData.pax_demographics.profile.rules || [];
      defaultValues = passengerData.pax_demographics.profile.default;
    } else if (config.type === 'load_factor') {
      rules = passengerData.pax_generation.rules || [];
      defaultValues = passengerData.pax_generation.default;
    } else if (config.type === 'pax_arrival_patterns') {
      rules = passengerData.pax_arrival_patterns.rules || [];
      defaultValues = passengerData.pax_arrival_patterns.default;
    }

    // Default 값이 있으면 마지막 rule로 추가
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      const defaultRule = {
        conditions: {}, // 조건 없음 (모든 항공편에 적용)
        value: defaultValues,
        isDefault: true,
      };
      rules = [...rules, defaultRule];
    }

    return rules;
  };

  const handleDeleteRule = (index: number) => {
    // Default rule이 마지막에 있으므로, 마지막 인덱스인지 확인
    const rules = getCurrentRules();
    const hasDefaultRule = rules.some((r) => r.isDefault);
    const isLastIndex = index === rules.length - 1;

    if (hasDefaultRule && isLastIndex) return; // Default rule은 삭제 불가

    if (config.type === 'nationality') {
      removeNationalityRule(index);
    } else if (config.type === 'profile') {
      removeProfileRule(index);
    } else if (config.type === 'load_factor') {
      removePaxGenerationRule(index);
    }
  };

  const handleEditRule = (index: number) => {
    // Default rule이 마지막에 있으므로, 마지막 인덱스인지 확인
    const rules = getCurrentRules();
    const hasDefaultRule = rules.some((r) => r.isDefault);
    const isLastIndex = index === rules.length - 1;

    if (hasDefaultRule && isLastIndex) return; // Default rule은 편집 불가

    setEditingRuleIndex(index);
    setIsRuleDialogOpen(true);
  };

  const handleAddRule = () => {
    setEditingRuleIndex(null);
    setIsRuleDialogOpen(true);
  };

  // 필드명을 사람이 읽기 쉬운 이름으로 변환
  const getFieldDisplayName = (key: string, values: any) => {
    const fieldMapping: Record<string, string> = {
      operating_carrier_iata: 'Airline',
      departure_airport_iata: 'Departure',
      arrival_airport_iata: 'Arrival',
      aircraft_type_iata: 'Aircraft',
      departure_time_local: 'Departure Time',
      arrival_time_local: 'Arrival Time',
    };

    // 항공사 코드를 이름으로 변환 (예시)
    const airlineMapping: Record<string, string> = {
      KE: 'Korean Air',
      OZ: 'Asiana Airlines',
      LJ: 'Jin Air',
      TW: "T'way Air",
    };

    if (key === 'operating_carrier_iata') {
      const codes = Array.isArray(values) ? values : [values];
      const names = codes.map((code: string) => airlineMapping[code] || code);
      return names.join(', ');
    }

    return fieldMapping[key] || key;
  };

  // 순차적 Rule 적용으로 실제 적용 편수 계산
  const calculateSequentialFlightCounts = () => {
    const rules = getCurrentRules().filter((r) => !r.isDefault); // Default 제외
    const appliedFlightSets: Set<string>[] = [];
    const results: { ruleIndex: number; actualCount: number; originalCount: number }[] = [];

    rules.forEach((rule, index) => {
      // 현재 Rule 조건에 맞는 항공편들 계산
      const matchingFlights = calculateFlightsForConditions(rule.conditions);
      const originalCount = matchingFlights.length;

      // 이전 Rule들에서 이미 적용된 항공편들 제외
      const availableFlights = new Set(matchingFlights);
      appliedFlightSets.forEach((appliedSet) => {
        appliedSet.forEach((flight) => availableFlights.delete(flight));
      });

      // 이번 Rule에서 실제 적용될 항공편들 저장
      appliedFlightSets.push(new Set(availableFlights));
      results.push({
        ruleIndex: index,
        actualCount: availableFlights.size,
        originalCount: originalCount,
      });
    });

    // Default 계산: 전체에서 모든 Rule 적용 편수 빼기
    const totalAppliedCount = appliedFlightSets.reduce((sum, set) => sum + set.size, 0);
    const totalFlights = getAllFlightsCount();
    const defaultCount = Math.max(0, totalFlights - totalAppliedCount);

    return { ruleResults: results, defaultCount, totalFlights };
  };

  // 조건에 맞는 항공편들 계산 (PassengerProfileCriteria 로직 참조)
  const calculateFlightsForConditions = (conditions: Record<string, string[]>): string[] => {
    if (!conditions || Object.keys(conditions).length === 0) return [];

    console.log('🔍 calculateFlightsForConditions - conditions:', conditions);
    console.log(
      '🔍 calculateFlightsForConditions - parquetMetadata columns:',
      parquetMetadata.map((item) => item.column)
    );

    const flightSetsByColumn: Set<string>[] = [];

    Object.entries(conditions).forEach(([columnKey, values]) => {
      console.log(`🔍 Processing column: ${columnKey}, values:`, values);

      // 저장된 값을 그대로 사용 (변환 로직 제거)
      let actualColumnKey = columnKey;
      let actualValues = values;

      const columnData = parquetMetadata.find((item) => item.column === actualColumnKey);
      if (!columnData) {
        console.log(`❌ Column ${actualColumnKey} not found in parquetMetadata`);
        return;
      }

      console.log(`✅ Found column ${actualColumnKey}, available values:`, Object.keys(columnData.values));

      const flightsInColumn = new Set<string>();
      actualValues.forEach((value) => {
        if (columnData.values[value]) {
          console.log(`✅ Found value ${value} with ${columnData.values[value].flights.length} flights`);
          columnData.values[value].flights.forEach((flight) => {
            flightsInColumn.add(flight);
          });
        } else {
          console.log(`❌ Value ${value} not found in column ${actualColumnKey}`);
        }
      });

      console.log(`📊 Column ${columnKey} matched ${flightsInColumn.size} flights`);
      if (flightsInColumn.size > 0) {
        flightSetsByColumn.push(flightsInColumn);
      }
    });

    if (flightSetsByColumn.length === 0) return [];

    // AND 조건: 모든 컬럼의 조건을 만족하는 항공편들
    let matchingFlights = flightSetsByColumn[0];
    for (let i = 1; i < flightSetsByColumn.length; i++) {
      const intersection = new Set<string>();
      matchingFlights.forEach((flight) => {
        if (flightSetsByColumn[i].has(flight)) {
          intersection.add(flight);
        }
      });
      matchingFlights = intersection;
    }

    return Array.from(matchingFlights);
  };

  // 전체 항공편 수 계산
  const getAllFlightsCount = (): number => {
    const allFlights = new Set<string>();
    parquetMetadata.forEach((item) => {
      Object.values(item.values).forEach((valueData) => {
        valueData.flights.forEach((flight) => {
          allFlights.add(flight);
        });
      });
    });
    return allFlights.size;
  };

  // 순차 적용 결과 계산
  const sequentialCounts = useMemo(() => {
    if (parquetMetadata.length === 0) return null;
    return calculateSequentialFlightCounts();
  }, [passengerData, parquetMetadata]);

  // Rule 요약 데이터 생성
  const getRuleData = (rule: any, ruleIndex?: number) => {
    // 조건을 간단한 형태로 변환
    const conditionEntries = Object.entries(rule.conditions || {}).map(([key, values]: [string, any]) => ({
      key,
      values: Array.isArray(values) ? values : [values],
      displayName: getFieldDisplayName(key, values),
    }));

    // 값 데이터 (RuleValueDisplay에서 타입별로 처리됨)
    const ruleValue = rule.value || null;
    const properties = ruleValue ? Object.keys(ruleValue) : [];

    // 총 편수 - 순차 적용 계산 결과 사용
    let flightCount = rule.flightCount || null;
    let flightCountText = flightCount ? `${flightCount} flights` : null;

    // 순차 적용 결과가 있고, Default가 아닌 경우
    if (sequentialCounts && !rule.isDefault && ruleIndex !== undefined) {
      // Default가 마지막에 있으므로 실제 rule 인덱스 계산
      const currentRules = getCurrentRules();
      const hasDefault = currentRules.some((r) => r.isDefault);
      const actualRuleIndex =
        hasDefault && ruleIndex === currentRules.length - 1
          ? ruleIndex - 1 // Default인 경우는 이 분기에 오지 않음
          : ruleIndex;

      const sequentialResult = sequentialCounts.ruleResults[actualRuleIndex];
      if (sequentialResult) {
        const { actualCount, originalCount } = sequentialResult;
        if (actualCount !== originalCount) {
          flightCountText = `${actualCount} / ${originalCount} flights`;
        } else {
          flightCountText = `${actualCount} flights`;
        }
        flightCount = actualCount;
      }
    } else if (rule.isDefault && sequentialCounts) {
      // Default의 경우
      flightCountText = `${sequentialCounts.defaultCount} / ${sequentialCounts.totalFlights} flights`;
      flightCount = sequentialCounts.defaultCount;
    }

    return { conditionEntries, ruleValue, properties, flightCount, flightCountText };
  };

  // 현재 값들
  const currentValues = getCurrentValues();

  return (
    <div className="space-y-6">
      {/* Load Factor Section - 특정 타입에서만 표시 */}
      {config.type === 'load_factor' && <LoadFactorSection onSave={() => setHasSaved(true)} />}

      {/* Distribution Section - Nationality와 Profile 탭에서만 표시 */}
      {(config.type === 'nationality' || config.type === 'profile') && (
        <DistributionSection
          config={config as any} // Type assertion for now
          currentValues={currentValues}
          newPropertyName={newPropertyName}
          setNewPropertyName={setNewPropertyName}
          useDefaultValues={useDefaultValues}
          setUseDefaultValues={setUseDefaultValues}
          percentageValues={percentageValues}
          isValid={isValid}
          setIsValid={setIsValid}
          totalPercentage={totalPercentage}
          setTotalPercentage={setTotalPercentage}
          editingPropertyIndex={editingPropertyIndex}
          editingPropertyValue={editingPropertyValue}
          setEditingPropertyValue={setEditingPropertyValue}
          editingInputRef={editingInputRef as React.RefObject<HTMLInputElement>}
          onAddProperty={handleAddProperty}
          onRemoveProperty={handleRemoveProperty}
          onStartEditing={handleStartEditing}
          onPropertyNameChange={handlePropertyNameChange}
          onEditingKeyPress={handleEditingKeyPress}
          onKeyPress={handleKeyPress}
          onPercentageChange={handlePercentageChange}
          onSave={handleSave}
        />
      )}

      {/* Show-up-time Section - pax_arrival_patterns 탭에서만 표시 */}
      {config.type === 'pax_arrival_patterns' && <NormalDistributionSection onSave={() => setHasSaved(true)} />}

      {/* Step 2: Search Criteria */}
      <div className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-default-900">Search Criteria</h3>
              <p className="text-sm text-default-500">Select flight conditions and assign values</p>
            </div>
            <Button
              onClick={handleAddRule}
              disabled={!hasSaved}
              className="flex items-center gap-2"
              title={!hasSaved ? 'Please click Save button first' : undefined}
            >
              <Plus className="h-4 w-4" />
              Add Rules
            </Button>
          </div>
        </div>

        <div className="space-y-3 pl-6">
          {getCurrentRules().length === 0 ? (
            <div className="py-8 text-center text-default-500">
              <p>No rules created yet.</p>
              <p className="text-sm">Click "Add Rules" to create your first rule.</p>
            </div>
          ) : (
            getCurrentRules().map((rule, index) => {
              const { conditionEntries, ruleValue, properties, flightCount, flightCountText } = getRuleData(
                rule,
                index
              );
              const conditionCount = conditionEntries.length;
              const isDefaultRule = rule.isDefault;

              return (
                <Card key={`${isDefaultRule ? 'default' : 'rule'}-${index}`} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Rule Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              isDefaultRule ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {isDefaultRule ? 'Default' : `Rule ${index + 1}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {isDefaultRule ? flightCountText || 'All flights' : flightCountText || 'All flights'}
                          </span>
                        </div>

                        {/* Conditions - badge format with scroll for > 4 items */}
                        {conditionEntries.length > 0 && (
                          <div
                            className={
                              conditionEntries.length > 4
                                ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-20 overflow-y-auto'
                                : ''
                            }
                          >
                            <div className="flex flex-wrap gap-2">
                              {conditionEntries.map((condition, condIndex) => {
                                // 카테고리명 매핑
                                const fieldMapping: Record<string, string> = {
                                  operating_carrier_iata: 'Airline',
                                  departure_airport_iata: 'Departure',
                                  arrival_airport_iata: 'Arrival',
                                  aircraft_type_iata: 'Aircraft',
                                  departure_time_local: 'Departure Time',
                                  arrival_time_local: 'Arrival Time',
                                  arrival_terminal: 'Arrival Terminal',
                                  departure_terminal: 'Departure Terminal',
                                  arrival_city: 'Arrival City',
                                  departure_city: 'Departure City',
                                  arrival_country: 'Arrival Country',
                                  departure_country: 'Departure Country',
                                  arrival_region: 'Arrival Region',
                                  departure_region: 'Departure Region',
                                  flight_type: 'Flight Type',
                                  total_seats: 'Total Seats',
                                  operating_carrier_name: 'Airline',
                                  aircraft_type_icao: 'Aircraft Type',
                                };

                                const categoryName =
                                  fieldMapping[condition.key] ||
                                  condition.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                                // 같은 카테고리 내 값들을 | 로 연결 (OR 조건)
                                const valuesText = condition.values.join(' | ');

                                return (
                                  <Badge key={condIndex} variant="secondary" className="text-xs font-medium">
                                    {categoryName}: {valuesText}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Values - unified display using RuleValueDisplay */}
                        <div>
                          <RuleValueDisplay
                            configType={config.type}
                            ruleValue={ruleValue}
                            properties={properties}
                            isReadOnly={true}
                          />
                        </div>
                      </div>
                      <div className="ml-4 flex min-w-[72px] items-center gap-1">
                        {!isDefaultRule ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRule(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRule(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          /* Default rule을 위한 빈 공간 확보 */
                          <div className="w-[64px]"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Show-up-time Distribution Chart - pax_arrival_patterns 탭에서만 표시 */}
          {config.type === 'pax_arrival_patterns' && getCurrentRules().length > 0 && (
            <div className="mt-6">
              <MultipleDistributionChart height={350} />
            </div>
          )}
        </div>

        {/* Rule Creation/Edit Dialog */}
        <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRuleIndex !== null ? `Edit Rule ${editingRuleIndex + 1}` : 'Create New Rule'}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <PassengerProfileCriteria
                parquetMetadata={parquetMetadata}
                definedProperties={currentValues}
                configType={config.type}
                onRuleSaved={() => setIsRuleDialogOpen(false)}
                editingRule={
                  editingRuleIndex !== null
                    ? (() => {
                        const rules = getCurrentRules();
                        return rules[editingRuleIndex];
                      })()
                    : undefined
                }
                editingRuleIndex={editingRuleIndex ?? undefined}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation AlertDialog */}
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Settings Change</AlertDialogTitle>
              <AlertDialogDescription>
                Modifying this item will reset all settings in 'Select flight conditions and assign values' section. Do
                you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelSave}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSave}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
