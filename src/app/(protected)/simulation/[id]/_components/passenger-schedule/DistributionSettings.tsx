"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useSimulationStore } from "../../_stores";
import ProfileCriteriaSettings from "./ProfileCriteriaSettings";
import PercentageControl, {
  getDistributionTotal,
  isValidDistribution,
} from "../shared/PercentageControl";

// 기존 InteractivePercentageBar와 동일한 색상 팔레트
const COLORS = [
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5A2B", // Brown
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#64748B", // Slate
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

interface DistributionSettingsProps {
  parquetMetadata?: ParquetMetadataItem[];
  configType?: "nationality" | "profile";
}

export default function DistributionSettings({
  parquetMetadata = [],
  configType = "nationality",
}: DistributionSettingsProps) {
  // 🆕 SimulationStore 연결 - configType에 따라 분기
  const isNationality = configType === "nationality";
  const demographicsData = useSimulationStore((s) =>
    isNationality
      ? s.passenger.pax_demographics.nationality
      : s.passenger.pax_demographics.profile
  );
  const setValues = useSimulationStore((s) =>
    isNationality ? s.setNationalityValues : s.setProfileValues
  );
  const addRule = useSimulationStore((s) =>
    isNationality ? s.addNationalityRule : s.addProfileRule
  );
  const removeRule = useSimulationStore((s) =>
    isNationality ? s.removeNationalityRule : s.removeProfileRule
  );
  const updateDistribution = useSimulationStore((s) =>
    isNationality
      ? s.updateNationalityDistribution
      : s.updateProfileDistribution
  );
  const updateRuleStore = useSimulationStore((s) =>
    isNationality ? s.updateNationalityRule : s.updateProfileRule
  );
  const reorderRulesStore = useSimulationStore((s) =>
    isNationality ? s.reorderNationalityRules : s.reorderProfileRules
  );
  const setDefault = useSimulationStore((s) =>
    isNationality ? s.setNationalityDefault : s.setProfileDefault
  );

  // 🔧 필터링된 항공편 수를 zustand store에서 가져오기
  const filteredFlightResult = useSimulationStore(
    (s) => s.flight.appliedFilterResult
  );
  const totalFlightsFromStore = filteredFlightResult?.total || 0;

  // 🆕 조건 변환 로직 (Step 1, 2와 동일) - 함수들보다 앞에 위치
  const labelToColumnMap: Record<string, string> = {
    Airline: "operating_carrier_iata",
    "Aircraft Type": "aircraft_type_icao",
    "Flight Type": "flight_type",
    "Total Seats": "total_seats",
    "Arrival Airport": "arrival_airport_iata",
    "Arrival Terminal": "arrival_terminal",
    "Arrival City": "arrival_city",
    "Arrival Country": "arrival_country",
    "Arrival Region": "arrival_region",
    "Departure Airport Iata": "departure_airport_iata",
    "Departure Terminal": "departure_terminal",
    "Departure City": "departure_city",
    "Departure Country": "departure_country",
    "Departure Region": "departure_region",
  };

  const valueMapping: Record<string, Record<string, string>> = {
    operating_carrier_iata: {
      "Korean Air": "KE",
      "Asiana Airlines": "OZ",
      // 필요에 따라 추가
    },
  };

  // 백엔드 → UI 역변환 맵핑
  const columnToLabelMap: Record<string, string> = {
    operating_carrier_iata: "Airline",
    aircraft_type_icao: "Aircraft Type",
    flight_type: "Flight Type",
    total_seats: "Total Seats",
    arrival_airport_iata: "Arrival Airport",
    arrival_terminal: "Arrival Terminal",
    arrival_city: "Arrival City",
    arrival_country: "Arrival Country",
    arrival_region: "Arrival Region",
    departure_airport_iata: "Departure Airport Iata",
    departure_terminal: "Departure Terminal",
    departure_city: "Departure City",
    departure_country: "Departure Country",
    departure_region: "Departure Region",
  };

  const reverseValueMapping: Record<string, Record<string, string>> = {
    operating_carrier_iata: {
      KE: "Korean Air",
      OZ: "Asiana Airlines",
      // 필요에 따라 추가
    },
  };

  // SimulationStore 데이터 변환
  const definedProperties = demographicsData?.available_values || [];
  const createdRules: Rule[] = useMemo(() => {
    return (demographicsData?.rules || []).map((rule, index) => ({
      id: `rule-${index}`,
      name: `Rule ${index + 1}`,
      conditions: Object.entries(rule.conditions || {}).flatMap(
        ([columnKey, values]) => {
          const displayLabel = columnToLabelMap[columnKey] || columnKey;
          return values.map((value) => {
            const displayValue =
              reverseValueMapping[columnKey]?.[value] || value;
            return `${displayLabel}: ${displayValue}`;
          });
        }
      ),
      flightCount: rule.flightCount || 0,
      distribution: rule.value || {},
      isExpanded: false,
    }));
  }, [demographicsData?.rules]);

  const hasDefaultRule =
    demographicsData?.default &&
    Object.keys(demographicsData.default).filter((key) => key !== "flightCount")
      .length > 0;
  const defaultDistribution = demographicsData?.default || {};

  // Rules 존재 여부 확인
  const hasRules = createdRules.length > 0;

  // 액션 어댑터들 - configType에 따라 동적으로 처리
  const setProperties = useCallback(
    (properties: string[]) => {
      setValues(properties);

      // 🆕 properties가 모두 제거되면 관련 rules와 default도 함께 제거
      if (properties.length === 0) {
        reorderRulesStore([]); // 모든 rules 제거
        setDefault({}); // default 설정 제거
      }
    },
    [setValues, reorderRulesStore, setDefault]
  );

  const updateRule = useCallback(
    (ruleId: string, updatedRule: Partial<Rule>) => {
      const ruleIndex = parseInt(ruleId.replace("rule-", ""));

      // 전체 규칙 업데이트인경우 (조건 + 분배 + 플라이트카운트)
      if (
        updatedRule.conditions ||
        updatedRule.flightCount !== undefined ||
        updatedRule.distribution
      ) {
        // 현재 규칙 가져오기
        const currentRule = demographicsData?.rules[ruleIndex];
        if (!currentRule) return;

        // UI 조건을 백엔드 형식으로 변환 (조건이 변경된 경우)
        let backendConditions = currentRule.conditions;
        if (updatedRule.conditions) {
          backendConditions = {};
          updatedRule.conditions.forEach((condition) => {
            const parts = condition.split(": ");
            if (parts.length === 2) {
              const displayLabel = parts[0];
              const value = parts[1];
              const columnKey =
                labelToColumnMap[displayLabel] ||
                displayLabel.toLowerCase().replace(" ", "_");
              const convertedValue = valueMapping[columnKey]?.[value] || value;

              if (!backendConditions[columnKey]) {
                backendConditions[columnKey] = [];
              }
              backendConditions[columnKey].push(convertedValue);
            }
          });
        }

        // 전체 규칙 업데이트
        updateRuleStore(
          ruleIndex,
          backendConditions,
          updatedRule.flightCount ?? currentRule.flightCount ?? 0,
          updatedRule.distribution ?? currentRule.value ?? {}
        );
      }
    },
    [updateRuleStore, demographicsData?.rules, labelToColumnMap, valueMapping]
  );

  const removeRuleById = useCallback(
    (ruleId: string) => {
      const ruleIndex = parseInt(ruleId.replace("rule-", ""));
      removeRule(ruleIndex);
    },
    [removeRule]
  );

  const setDefaultRule = useCallback(
    (hasDefault: boolean) => {
      if (!hasDefault) {
        setDefault({});
      }
    },
    [setDefault]
  );

  const updateDefaultDistribution = useCallback(
    (distribution: Record<string, number>) => {
      setDefault(distribution);
    },
    [setDefault]
  );

  const reorderRules = useCallback(
    (newOrder: Rule[]) => {
      // UI Rule[]을 백엔드 형식으로 변환
      const backendRules = newOrder.map((rule) => {
        // UI 조건을 백엔드 형식으로 변환
        const backendConditions: Record<string, string[]> = {};

        rule.conditions.forEach((condition) => {
          const parts = condition.split(": ");
          if (parts.length === 2) {
            const displayLabel = parts[0];
            const value = parts[1];
            const columnKey =
              labelToColumnMap[displayLabel] ||
              displayLabel.toLowerCase().replace(" ", "_");
            const convertedValue = valueMapping[columnKey]?.[value] || value;

            if (!backendConditions[columnKey]) {
              backendConditions[columnKey] = [];
            }
            backendConditions[columnKey].push(convertedValue);
          }
        });

        return {
          conditions: backendConditions,
          flightCount: rule.flightCount || 0,
          value: rule.distribution || {},
        };
      });

      // SimulationStore에 새로운 순서 적용
      reorderRulesStore(backendRules);
    },
    [reorderRulesStore, labelToColumnMap, valueMapping]
  );

  const addRuleWithConversion = useCallback(
    (rule: Rule) => {
      // UI 조건을 백엔드 형식으로 변환
      const backendConditions: Record<string, string[]> = {};

      rule.conditions.forEach((condition) => {
        const parts = condition.split(": ");
        if (parts.length === 2) {
          const displayLabel = parts[0];
          const value = parts[1];
          const columnKey =
            labelToColumnMap[displayLabel] ||
            displayLabel.toLowerCase().replace(" ", "_");

          // 값 변환 적용 (있으면)
          const convertedValue = valueMapping[columnKey]?.[value] || value;

          if (!backendConditions[columnKey]) {
            backendConditions[columnKey] = [];
          }
          backendConditions[columnKey].push(convertedValue);
        }
      });

      // 🎯 수정: 백엔드에서 처리하도록 정수 그대로 전달
      addRule(backendConditions, rule.flightCount || 0, rule.distribution || {});
    },
    [addRule]
  );

  // 로컬 UI 상태
  const [newPropertyName, setNewPropertyName] = useState<string>("");
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // 항목 변경 확인창 상태
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "add" | "remove";
    payload: string[];
  } | null>(null);

  // 드래그 앤 드랍 상태
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);

  // 첫글자 대문자로 변환하는 헬퍼 함수
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // 균등 분배 조정 로직

  // 속성 추가
  const handleAddProperty = () => {
    if (!newPropertyName.trim()) return;

    // 콤마로 구분해서 여러 개 처리
    const newProperties = newPropertyName
      .split(",")
      .map((prop) => capitalizeFirst(prop.trim()))
      .filter((prop) => prop.length > 0 && !definedProperties.includes(prop));

    if (newProperties.length > 0) {
      const resultProperties = [...definedProperties, ...newProperties];
      if (createdRules.length > 0 || hasDefaultRule) {
        // 규칙이 있으면 확인창 표시 (추가 시에도)
        setPendingAction({ type: "add", payload: resultProperties });
        setShowConfirmDialog(true);
      } else {
        // 규칙이 없으면 바로 추가
        setProperties(resultProperties);
      }
      setNewPropertyName("");
    }
  };

  // 속성 제거
  const handleRemoveProperty = (propertyToRemove: string) => {
    const newProperties = definedProperties.filter(
      (property) => property !== propertyToRemove
    );

    if (createdRules.length > 0 || hasDefaultRule) {
      // 규칙이 있으면 확인창 표시
      setPendingAction({ type: "remove", payload: newProperties });
      setShowConfirmDialog(true);
    } else {
      // 규칙이 없으면 바로 제거
      setProperties(newProperties);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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

  // 🔧 개선된 균등분배 계산 함수 - decimal로 변환 (메모이제이션)
  const calculateEqualDistribution = useCallback((properties: string[]) => {
    const equalPercentage = Math.floor(100 / properties.length);
    let remainder = 100 - equalPercentage * properties.length;

    const distribution: Record<string, number> = {};
    properties.forEach((prop, index) => {
      const percentageValue = equalPercentage + (index < remainder ? 1 : 0);
      // 🎯 수정: 정수 그대로 저장 (50 → 50)
      distribution[prop] = percentageValue;
    });
    return distribution;
  }, []);


  // 🔧 전체 항공편 수를 zustand store에서 가져오기 (기본값 0)
  const TOTAL_FLIGHTS = totalFlightsFromStore || 0;

  // 조건 겹침을 고려한 순차적 항공편 수 계산 (메모이제이션)
  const flightCalculations = useMemo(() => {
    const sequentialCounts: Record<string, number> = {};
    let totalUsedFlights = 0;

    // 각 규칙을 순서대로 적용
    createdRules.forEach((rule, index) => {
      let availableCount = rule.flightCount;

      // 이전 규칙들과의 겹침 확인
      for (let prevIndex = 0; prevIndex < index; prevIndex++) {
        const prevRule = createdRules[prevIndex];
        const prevActualCount = sequentialCounts[prevRule.id] || 0;

        if (prevActualCount > 0) {
          // 조건 겹침 확인 (정확한 교집합 계산)
          const currentConditions = rule.conditions;
          const prevConditions = prevRule.conditions;

          // 겹치는 조건들 찾기
          const intersection = currentConditions.filter((condition) =>
            prevConditions.includes(condition)
          );

          if (intersection.length > 0) {
            // OR 조건을 고려한 정확한 겹침 계산
            // 예: Rule 1 (Korean Air) = 118편 사용
            //     Rule 2 (Asiana Airlines | Korean Air + A21N | A333 | B77W) = 95편 요청
            //     겹치는 부분: Korean Air 조건만 겹침
            //     사용 가능한 부분: Asiana Airlines 조건은 여전히 사용 가능

            // 이전 규칙이 현재 규칙에 완전히 포함되는 경우만 제외
            const isPrevCompletelyIncluded = prevConditions.every((condition) =>
              currentConditions.includes(condition)
            );

            if (isPrevCompletelyIncluded) {
              // 이전 규칙이 현재 규칙에 완전히 포함되는 경우에만 해당 부분 제외
              // 하지만 OR 조건이 있으면 일부는 여전히 사용 가능할 수 있음

              // 겹치는 비율을 더 정확하게 계산
              // 전체 조건 중에서 겹치는 조건의 비율로 계산
              const totalConditions = currentConditions.length;
              const overlappingConditions = intersection.length;

              // OR 조건을 고려한 겹침 비율 (보수적으로 계산)
              let overlapRatio;
              if (overlappingConditions === totalConditions) {
                // 모든 조건이 겹치면 완전히 제외
                overlapRatio = 1.0;
              } else {
                // 일부만 겹치면 OR 조건을 고려해서 비례적으로 계산
                // 더 관대하게 계산 (OR 조건에서는 대안이 있기 때문)
                overlapRatio =
                  overlappingConditions /
                  Math.max(totalConditions * 2, prevConditions.length * 2);
              }

              const reduction = Math.floor(prevActualCount * overlapRatio);
              availableCount = Math.max(0, availableCount - reduction);
            } else {
              // 이전 규칙이 현재 규칙에 부분적으로만 겹치는 경우
              // OR 조건을 고려해서 매우 관대하게 계산
              const overlapRatio =
                intersection.length /
                (currentConditions.length + prevConditions.length);
              const reduction = Math.floor(
                prevActualCount * overlapRatio * 0.5
              ); // 50% 할인
              availableCount = Math.max(0, availableCount - reduction);
            }
          }
        }
      }

      // 전체 남은 항공편 수를 초과하지 않도록 제한
      const remainingTotal = TOTAL_FLIGHTS - totalUsedFlights;
      availableCount = Math.min(availableCount, remainingTotal);

      sequentialCounts[rule.id] = Math.max(0, availableCount);
      totalUsedFlights += availableCount;
    });

    const remainingFlights = Math.max(0, TOTAL_FLIGHTS - totalUsedFlights);

    return {
      sequentialCounts,
      remainingFlights,
      usedFlights: totalUsedFlights,
      totalFlights: TOTAL_FLIGHTS,
    };
  }, [createdRules]); // createdRules가 변경될 때만 재계산

  // 드래그 앤 드랍 핸들러들
  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggingRuleId(ruleId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ruleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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

    const dragIndex = createdRules.findIndex(
      (rule) => rule.id === draggingRuleId
    );
    const dropIndex = createdRules.findIndex(
      (rule) => rule.id === targetRuleId
    );

    if (dragIndex === -1 || dropIndex === -1) return;

    const newRules = [...createdRules];
    const draggedRule = newRules[dragIndex];

    // 배열에서 드래그된 항목 제거
    newRules.splice(dragIndex, 1);
    // 새 위치에 삽입
    newRules.splice(dropIndex, 0, draggedRule);

    // Store 업데이트
    reorderRules(newRules);
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
    setDragOverRuleId(null);
  };

  // 확인창 처리
  const handleConfirmChanges = () => {
    if (pendingAction) {
      // 속성 업데이트 함수 호출 (균등 분배 자동 적용)
      setProperties(pendingAction.payload);
      setPendingAction(null);
    }
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
      const parts = condition.split(": ");
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

  // ProfileCriteriaSettings와 통신하기 위한 최적화된 콜백
  const handleRuleSaved = useCallback(
    (savedRuleData: {
      conditions: string[];
      flightCount: number;
      distribution: Record<string, number>;
    }) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            distribution: savedRuleData.distribution,
          });
        }
        setEditingRuleId(null);
        setIsRuleModalOpen(false);
      } else {
        // Create 모드에서 새 규칙 생성
        if (savedRuleData) {
          const distribution =
            savedRuleData.distribution ||
            calculateEqualDistribution(definedProperties);

          const newRule = {
            id: `rule-${Date.now()}`,
            name: `Rule ${createdRules.length + 1}`,
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            distribution,
            isExpanded: true,
          };

          addRuleWithConversion(newRule);
          setIsRuleModalOpen(false);
        }
      }
    },
    [
      editingRuleId,
      definedProperties,
      createdRules.length,
      calculateEqualDistribution,
      updateRule,
      addRuleWithConversion,
    ]
  );

  // 전역 함수 등록 (메모리 누수 방지)
  useEffect(() => {
    (window as any).handleSimpleRuleSaved = handleRuleSaved;

    return () => {
      delete (window as any).handleSimpleRuleSaved;
    };
  }, [handleRuleSaved]);

  // ✅ validation 함수들은 PercentageControl에서 import

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-primary pl-4">
        <h3 className="text-lg font-semibold text-default-900">
          Define {isNationality ? "Nationalities" : "Passenger Profiles"}
        </h3>
        <p className="text-sm text-default-500">
          Define{" "}
          {isNationality
            ? "what properties can be assigned"
            : "passenger profile categories for classification"}
        </p>
      </div>

      {/* Property Input */}
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={`Enter ${isNationality ? "property name (e.g., domestic, international or a,b,c)" : "profile name (e.g., business, leisure, premium or a,b,c)"}...`}
          value={newPropertyName}
          onChange={(e) =>
            setNewPropertyName((e.target as HTMLInputElement).value)
          }
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button
          onClick={handleAddProperty}
          disabled={!newPropertyName.trim()}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add {isNationality ? "Property" : "Profile"}
        </Button>
      </div>

      {/* Defined Properties */}
      {definedProperties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {definedProperties.map((property, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <Badge
                key={index}
                className="flex items-center gap-2 border-0 px-3 py-1 font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {property}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-white hover:bg-black/20"
                  onClick={() => handleRemoveProperty(property)}
                >
                  <X size={12} />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Add Rules Section - 항상 표시 */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between border-l-4 border-primary pl-4">
          <div>
            <h4 className="text-lg font-semibold text-default-900">
              Assign {isNationality ? "Distribution" : "Profile Distribution"}{" "}
              Rules
            </h4>
            <p className="text-sm text-default-500">
              Define how passengers will be distributed among the{" "}
              {isNationality ? "nationalities" : "profile categories"} you
              created above
            </p>
          </div>

          <Button
            variant={definedProperties.length > 0 ? "primary" : "outline"}
            disabled={definedProperties.length === 0}
            onClick={handleOpenRuleModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Rules
          </Button>
        </div>

        {/* Created Rules */}
        {createdRules.length > 0 && (
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
                className={`cursor-move rounded-lg border bg-white px-4 py-3 transition-all ${draggingRuleId === rule.id ? "scale-95 opacity-50" : ""} ${dragOverRuleId === rule.id ? "border-purple-400 bg-purple-50" : ""} hover:shadow-md`}
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
                          {flightCalculations.sequentialCounts[rule.id] ??
                            rule.flightCount}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {flightCalculations.totalFlights}
                        </span>
                        <span className="text-sm text-gray-500">flights</span>
                      </div>
                      {(() => {
                        const actualCount =
                          flightCalculations.sequentialCounts[rule.id];
                        const originalCount = rule.flightCount;
                        const isLimited =
                          actualCount !== undefined &&
                          actualCount < originalCount;
                        return isLimited ? (
                          <div className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                            -{originalCount - actualCount} limited
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
                      onClick={() => removeRuleById(rule.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                {/* Rule Conditions - 카테고리별 배지 형태 */}
                {rule.conditions.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        groupConditionsByCategory(rule.conditions)
                      ).map(([category, values]) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="border-0 bg-blue-100 px-3 py-1 text-xs text-blue-700"
                        >
                          {values.join(" | ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Distribution Bar */}
                {rule.distribution && (
                  <div className="mt-3">
                    <PercentageControl
                      properties={definedProperties}
                      values={rule.distribution || {}}
                      onChange={(newValues) =>
                        updateRule(rule.id, { distribution: newValues })
                      }
                      showValues={true}
                    />

                    {/* Validation Status */}
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {isValidDistribution(rule.distribution || {}) ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} />
                          Valid distribution (Total:{" "}
                          {Math.round(getDistributionTotal(
                            rule.distribution || {}
                          ))}
                          %)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle size={14} />
                          Total must equal 100% (Current:{" "}
                          {Math.round(getDistributionTotal(
                            rule.distribution || {}
                          ))}
                          %)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 🆕 Default Rule 카드를 Rules 조건 블록 밖으로 이동 */}
        {definedProperties.length > 0 && (
          <div className="mt-4">
            {/* Default Rule 또는 Apply Default 카드 */}
            {hasDefaultRule ? (
              /* Default Section */
              <div className="rounded-lg border bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="border-0 bg-green-100 text-green-700">
                      Default
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-700">
                        {flightCalculations.remainingFlights}
                      </span>
                      <span className="text-sm text-gray-500">
                        / {flightCalculations.totalFlights}
                      </span>
                      <span className="text-sm text-gray-500">flights</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => setDefaultRule(false)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                {/* Default Distribution Bar */}
                <div className="mt-3">
                  <PercentageControl
                    properties={definedProperties}
                    values={defaultDistribution || {}}
                    onChange={updateDefaultDistribution}
                    showValues={true}
                  />

                  {/* Default Validation Status */}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {isValidDistribution(defaultDistribution || {}) ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        Valid distribution (Total:{" "}
                        {Math.round(getDistributionTotal(
                          defaultDistribution || {}
                        ))}
                        %)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={14} />
                        Total must equal 100% (Current:{" "}
                        {Math.round(getDistributionTotal(
                          defaultDistribution || {}
                        ))}
                        %)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : !hasRules ? (
              /* Rules 없을 때: "No distribution rules defined" */
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className="mt-0.5 text-amber-500"
                      size={20}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        No distribution rules defined
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Would you like to apply a default{" "}
                        {isNationality ? "nationality" : "profile"} distribution
                        to all flights?
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setDefaultRule(true);
                      updateDefaultDistribution(
                        calculateEqualDistribution(definedProperties)
                      );
                    }}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
                  >
                    Apply Default Rule
                  </Button>
                </div>
              </div>
            ) : (
              flightCalculations.remainingFlights > 0 && (
                /* Rules 있을 때: "{남은 수} flights have no rules" */
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className="mt-0.5 text-amber-500"
                        size={20}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {flightCalculations.remainingFlights} flights have no
                          rules
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Would you like to apply a default{" "}
                          {isNationality ? "nationality" : "profile"}{" "}
                          distribution to these remaining flights?
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setDefaultRule(true);
                        updateDefaultDistribution(
                          calculateEqualDistribution(definedProperties)
                        );
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
                    >
                      Apply Default Rule
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Create New Rule Modal */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRuleId
                ? `Update ${createdRules.find((rule) => rule.id === editingRuleId)?.name || "Rule"}`
                : "Create New Rule"}
            </DialogTitle>
            <DialogDescription>
              {editingRuleId
                ? `Modify the flight conditions and ${isNationality ? "nationality" : "profile"} distribution for this rule.`
                : `Select flight conditions and assign ${isNationality ? "nationality" : "profile"} distribution values.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <ProfileCriteriaSettings
              parquetMetadata={parquetMetadata}
              definedProperties={definedProperties}
              configType="nationality"
              editingRule={
                editingRuleId
                  ? createdRules.find((rule) => rule.id === editingRuleId)
                  : undefined
              }
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
              Confirm {isNationality ? "Property" : "Profile"} Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "add"
                ? `Adding new ${isNationality ? "properties" : "profiles"} will automatically adjust all existing rule distributions to equal percentages. Do you want to continue?`
                : `Removing ${isNationality ? "properties" : "profiles"} will automatically adjust all existing rule distributions to equal percentages. Do you want to continue?`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <div className="text-sm text-muted-foreground">Affected items:</div>
            <ul className="list-inside list-disc space-y-1 rounded bg-muted p-3 text-sm">
              {createdRules.length > 0 && (
                <li>
                  {createdRules.length} distribution rule
                  {createdRules.length > 1 ? "s" : ""}
                </li>
              )}
              {hasDefaultRule && <li>Default distribution rule</li>}
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChanges}>
              Cancel
            </AlertDialogCancel>
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
