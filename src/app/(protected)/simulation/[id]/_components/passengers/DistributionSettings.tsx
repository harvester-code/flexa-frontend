"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ParquetMetadataItem } from "@/types/parquet";
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
import RuleConditionBadges from "./RuleConditionBadges";
import RuleDefaultRow from "./RuleDefaultRow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSimulationStore } from "../../_stores";
import RuleEditModal from "./RuleEditModal";
import PercentageControl, {
  getDistributionTotal,
  isValidDistribution,
} from "../shared/PercentageControl";

// 기존 InteractivePercentageBar와 동일한 색상 팔레트
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";
import { getColumnLabel, getColumnName } from "@/styles/columnMappings";
import { capitalizeIfAllLower } from "@/lib/string";
import { allocateFlightsSequential } from "./utils/flightAllocation";
import { usePassengerRuleDnD } from "./usePassengerRuleDnD";
import { countUniqueFlightsFromParquet } from "./utils/ruleConditions";

// Use all colors from COMPONENT_TYPICAL_COLORS
const COLORS = COMPONENT_TYPICAL_COLORS;

interface SavedRulePayload {
  conditions: string[];
  flightCount: number;
  distribution?: Record<string, number>;
  // 원본 조건 객체 (실제 컬럼 키 보존용)
  originalConditions?: Record<string, string[]>;
}

import { PassengerRuleBase } from "./types";

interface Rule extends PassengerRuleBase {
  distribution?: Record<string, number>;
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

  // No value mappings needed - data is already in correct format

  // SimulationStore 데이터 변환
  const definedProperties = demographicsData?.available_values || [];
  const createdRules: Rule[] = useMemo(() => {
    return (demographicsData?.rules || []).map((rule, index) => ({
      id: `rule-${index}`,
      name: `Rule ${index + 1}`,
      conditions: Object.entries(rule.conditions || {}).flatMap(
        ([columnKey, values]) => {
          const displayLabel = getColumnLabel(columnKey);
          // 🆕 원본 컬럼 키를 포함하여 저장 (복구 시 정확한 매칭을 위해)
          return values.map((value) => {
            return `${displayLabel}: ${value}`;
          });
        }
      ),
      // 🆕 원본 조건 객체를 보존 (복구 시 정확한 컬럼 키 사용)
      originalConditions: rule.conditions || {},
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
    (ruleId: string, updatedRule: Partial<Rule> & { originalConditions?: Record<string, string[]> }) => {
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
        // 원본 조건 객체가 들어오면 우선적으로 그대로 사용하여 컬럼 키를 보존
        let backendConditions =
          updatedRule.originalConditions || currentRule.conditions;

        if (!updatedRule.originalConditions && updatedRule.conditions) {
          backendConditions = {};
          updatedRule.conditions.forEach((condition) => {
            const parts = condition.split(": ");

            if (parts.length === 2) {
              const displayLabel = parts[0];
              const value = parts[1];

              // 기존 조건에서 동일한 값을 가진 컬럼 키를 우선 사용 (operating_carrier_name vs _iata 대응)
              const existingKey = Object.entries(currentRule.conditions).find(
                ([columnKey, values]) =>
                  getColumnLabel(columnKey) === displayLabel &&
                  values?.includes(value)
              )?.[0];

              const columnKey = existingKey || getColumnName(displayLabel);

              if (!backendConditions[columnKey]) {
                backendConditions[columnKey] = [];
              }
              backendConditions[columnKey].push(value);
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
    [updateRuleStore, demographicsData?.rules]
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
        const backendConditions: Record<string, string[]> =
          rule.originalConditions ? { ...rule.originalConditions } : {};

        if (!rule.originalConditions) {
          rule.conditions.forEach((condition) => {
            const parts = condition.split(": ");
            if (parts.length === 2) {
              const displayLabel = parts[0];
              const value = parts[1];
              const columnKey = getColumnName(displayLabel);
              const convertedValue = value;

              if (!backendConditions[columnKey]) {
                backendConditions[columnKey] = [];
              }
              backendConditions[columnKey].push(convertedValue);
            }
          });
        }

        return {
          conditions: backendConditions,
          flightCount: rule.flightCount || 0,
          value: rule.distribution || {},
        };
      });

      // SimulationStore에 새로운 순서 적용
      reorderRulesStore(backendRules);
    },
    [reorderRulesStore]
  );

  const addRuleWithConversion = useCallback(
    (rule: Rule) => {
      // UI 조건을 백엔드 형식으로 변환
      // originalConditions가 있으면 그대로 사용하여 컬럼 키를 보존
      const backendConditions: Record<string, string[]> = rule.originalConditions
        ? { ...rule.originalConditions }
        : {};

      if (!rule.originalConditions) {
        rule.conditions.forEach((condition) => {
          const parts = condition.split(": ");
          if (parts.length === 2) {
            const displayLabel = parts[0];
            const value = parts[1];
            const columnKey = getColumnName(displayLabel);

            if (!backendConditions[columnKey]) {
              backendConditions[columnKey] = [];
            }
            backendConditions[columnKey].push(value);
          }
        });
      }

      // 🎯 수정: 백엔드에서 처리하도록 정수 그대로 전달
      addRule(
        backendConditions,
        rule.flightCount || 0,
        rule.distribution || {}
      );
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

  const { getDragProps, getDragClassName } = usePassengerRuleDnD({
    rules: createdRules,
    onReorder: reorderRules,
  });

  // 균등 분배 조정 로직

  // 속성 추가
  const handleAddProperty = () => {
    if (!newPropertyName.trim()) return;

    // 콤마로 구분해서 여러 개 처리
    const newProperties = newPropertyName
      .split(",")
      .map((prop) => capitalizeIfAllLower(prop.trim()))
      .filter((prop) => prop.length > 0 && !definedProperties.includes(prop));

    if (newProperties.length > 0) {
      const resultProperties = [...definedProperties, ...newProperties];
      // Only show confirmation if there are created rules (not just default rule)
      if (createdRules.length > 0) {
        // 규칙이 있으면 확인창 표시 (추가 시에도)
        setPendingAction({ type: "add", payload: resultProperties });
        setShowConfirmDialog(true);
      } else {
        // Default rule만 있거나 규칙이 없으면 바로 추가
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

    // Only show confirmation if there are created rules (not just default rule)
    if (createdRules.length > 0) {
      // 규칙이 있으면 확인창 표시
      setPendingAction({ type: "remove", payload: newProperties });
      setShowConfirmDialog(true);
    } else {
      // Default rule만 있거나 규칙이 없으면 바로 제거
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
    const remainder = 100 - equalPercentage * properties.length;

    const distribution: Record<string, number> = {};
    properties.forEach((prop, index) => {
      const percentageValue = equalPercentage + (index < remainder ? 1 : 0);
      // 🎯 수정: 정수 그대로 저장 (50 → 50)
      distribution[prop] = percentageValue;
    });
    return distribution;
  }, []);

  // 🔧 전체 항공편 수를 zustand store에서 가져오기 (기본값 0)
  const TOTAL_FLIGHTS = countUniqueFlightsFromParquet(parquetMetadata) || totalFlightsFromStore || 0;

  // 조건 겹침을 고려한 순차적 항공편 수 계산 (메모이제이션)
  const flightCalculations = useMemo(() => {
    const allocation = allocateFlightsSequential(
      createdRules,
      parquetMetadata,
      TOTAL_FLIGHTS
    );
    const sequentialCounts = allocation.actualCounts;
    const remainingFlights = allocation.remainingFlights;
    const totalFlightsUsed = allocation.usedFlights;

    return {
      sequentialCounts,
      remainingFlights,
      usedFlights: totalFlightsUsed,
      totalFlights: TOTAL_FLIGHTS,
    };
  }, [createdRules, parquetMetadata, TOTAL_FLIGHTS]);

  // 드래그 앤 드랍 핸들러들
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

  // Rule 편집 시작
  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    setIsRuleModalOpen(true);
  };

  // Rule 편집 저장

  // ProfileCriteriaSettings와 통신하기 위한 최적화된 콜백
  const handleRuleSaved = useCallback(
    (savedRuleData: SavedRulePayload) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            distribution: savedRuleData.distribution,
            originalConditions: savedRuleData.originalConditions,
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
            originalConditions: savedRuleData.originalConditions,
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
    window.handleSimpleRuleSaved = (payload) => handleRuleSaved(payload as SavedRulePayload);

    return () => {
      delete window.handleSimpleRuleSaved;
    };
  }, [handleRuleSaved]);

  // properties가 있고 default가 없으면 자동 생성
  useEffect(() => {
    if (definedProperties.length > 0 && !hasDefaultRule) {
      const distribution = calculateEqualDistribution(definedProperties);
      setDefault(distribution);
    }
  }, [
    definedProperties.length,
    hasDefaultRule,
    calculateEqualDistribution,
    setDefault,
  ]);

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
      <div className="flex gap-2">
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
        {/* Clear button - moved here */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // Only show confirmation if there are created rules (not just default rule)
            if (createdRules.length > 0) {
              setPendingAction({ type: "remove", payload: [] });
              setShowConfirmDialog(true);
            } else {
              // Default rule만 있거나 규칙이 없으면 바로 Clear
              setProperties([]);
            }
          }}
          disabled={definedProperties.length === 0}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent"
          title="Clear all properties"
        >
          <Trash2 size={16} />
        </Button>
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

          <div className="flex gap-2">
            {/* Clear button for rules - always visible */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                reorderRulesStore([]);
              }}
              disabled={createdRules.length === 0}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent"
              title="Clear all rules"
            >
              <Trash2 size={16} />
            </Button>

            <Button
              variant="outline"
              disabled={definedProperties.length === 0}
              onClick={handleOpenRuleModal}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Rule
            </Button>
          </div>
        </div>

        {/* Created Rules */}
        {createdRules.length > 0 && (
          <div className="mt-4 space-y-4">
            {createdRules.map((rule) => (
              <div
                key={rule.id}
                {...getDragProps(rule.id)}
                className={getDragClassName(rule.id, "cursor-move rounded-lg border bg-white px-4 py-3 transition-all hover:shadow-md")}
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
                <RuleConditionBadges conditions={rule.conditions} parquetMetadata={parquetMetadata} />

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
                          {Math.round(
                            getDistributionTotal(rule.distribution || {})
                          )}
                          %)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle size={14} />
                          Total must equal 100% (Current:{" "}
                          {Math.round(
                            getDistributionTotal(rule.distribution || {})
                          )}
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

        {/* Default Rule 카드 - 항상 표시 */}
        {definedProperties.length > 0 && (
          <div className="mt-4">
          {/* Default Section - 항상 표시되고 삭제 불가 */}
            <RuleDefaultRow
              remainingFlights={flightCalculations.remainingFlights}
              totalFlights={flightCalculations.totalFlights}
            >
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
                      {Math.round(
                        getDistributionTotal(defaultDistribution || {})
                      )}
                      %)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle size={14} />
                      Total must equal 100% (Current:{" "}
                      {Math.round(
                        getDistributionTotal(defaultDistribution || {})
                      )}
                      %)
                    </span>
                  )}
                </div>
              </div>
            </RuleDefaultRow>
          </div>
        )}
      </div>

      {/* Create New Rule Modal */}
      <RuleEditModal
        open={isRuleModalOpen}
        onOpenChange={setIsRuleModalOpen}
        editingRuleId={editingRuleId}
        editingRuleName={createdRules.find((r) => r.id === editingRuleId)?.name}
        editDescription={`Modify the flight conditions and ${isNationality ? "nationality" : "profile"} distribution for this rule.`}
        createDescription={`Select flight conditions and assign ${isNationality ? "nationality" : "profile"} distribution values.`}
        parquetMetadata={parquetMetadata}
        definedProperties={definedProperties}
        configType={configType}
        editingRule={editingRuleId ? createdRules.find((r) => r.id === editingRuleId) : undefined}
      />

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
                : pendingAction?.payload.length === 0
                ? `Clearing all ${isNationality ? "properties" : "profiles"} will remove all existing rules and distributions. Do you want to continue?`
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
              <AlertDialogAction onClick={handleConfirmChanges}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
