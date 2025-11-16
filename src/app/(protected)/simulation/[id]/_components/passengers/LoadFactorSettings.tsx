"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit, Plus, Trash2, X } from "lucide-react";
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
import { LoadFactorSlider } from "@/components/ui/LoadFactorSlider";
import { useSimulationStore } from "../../_stores";
import ProfileCriteriaSettings from "./ProfileCriteriaSettings";
import { getColumnLabel, getColumnName } from "@/styles/columnMappings";
import { allocateFlightsSequential } from "./utils/flightAllocation";
// Removed import for conversion functions - no longer needed
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";

// Use all colors from COMPONENT_TYPICAL_COLORS
const COLORS = COMPONENT_TYPICAL_COLORS;

interface Rule {
  id: string;
  name: string;
  conditions: string[];
  flightCount: number;
  loadFactor?: number; // 🔄 distribution → loadFactor (단순 백분율 값)
  originalConditions?: Record<string, string[]>; // 실제 컬럼 키 유지용
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

interface LoadFactorSettingsProps {
  parquetMetadata?: ParquetMetadataItem[];
}

export default function LoadFactorSettings({
  parquetMetadata = [],
}: LoadFactorSettingsProps) {
  // 🆕 SimulationStore 연결
  const paxGenerationRules = useSimulationStore(
    (s) => s.passenger.pax_generation.rules
  );
  const defaultLoadFactor = useSimulationStore(
    (s) => s.passenger.pax_generation.default.load_factor
  );
  const addPaxGenerationRule = useSimulationStore(
    (s) => s.addPaxGenerationRule
  );
  const removePaxGenerationRule = useSimulationStore(
    (s) => s.removePaxGenerationRule
  );
  const updatePaxGenerationValue = useSimulationStore(
    (s) => s.updatePaxGenerationValue
  );
  const updatePaxGenerationRuleStore = useSimulationStore(
    (s) => s.updatePaxGenerationRule
  );
  const setPaxGenerationDefault = useSimulationStore(
    (s) => s.setPaxGenerationDefault
  );
  const reorderPaxGenerationRules = useSimulationStore(
    (s) => s.reorderPaxGenerationRules
  );

  // No value mappings needed - data is already in correct format

  // 🆕 입력값 정규화 (1~100 정수로 제한)
  const normalizeLoadFactor = useCallback(
    (value: number | null | undefined): number => {
      if (value === null || value === undefined || isNaN(value)) {
        return 85; // 입력값 정규화 시에만 기본값 사용
      }
      return Math.max(1, Math.min(100, Math.round(value)));
    },
    []
  );

  // 변환 함수 제거 - 모든 값은 정수 퍼센트로 처리

  // SimulationStore 데이터 변환
  const createdRules: Rule[] = useMemo(() => {
    return paxGenerationRules.map((rule, index) => ({
      id: `rule-${index}`,
      name: `Rule ${index + 1}`,
      conditions: Object.entries(rule.conditions || {}).flatMap(
        ([columnKey, values]) => {
          const displayLabel = getColumnLabel(columnKey);
          return values.map((value) => {
            return `${displayLabel}: ${value}`;
          });
        }
      ),
      flightCount: 0, // SimulationStore에는 flightCount가 없으므로 기본값 0
      loadFactor: rule.value?.load_factor ?? 80, // 백분율 값 (기본값 80%)
      isExpanded: false,
    }));
  }, [paxGenerationRules]);

  const hasDefaultRule =
    defaultLoadFactor !== null && defaultLoadFactor !== undefined;

  // 🆕 탭이 처음 열릴 때만 초기값 설정 - 지연 실행으로 탭 활성화 확인
  useEffect(() => {
    const timer = setTimeout(() => {
      // 탭이 실제로 보여지고 있고, defaultLoadFactor가 null인 경우에만 초기값 설정
      if (defaultLoadFactor === null || defaultLoadFactor === undefined) {
        setPaxGenerationDefault(85); // 85% 기본값 설정
      }
    }, 100); // 100ms 지연으로 탭이 완전히 렌더링된 후 실행

    return () => clearTimeout(timer);
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 액션 어댑터들
  const addLoadFactorRule = useCallback(
    (rule: Rule) => {
      // 변환 로직 적용
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

      addPaxGenerationRule(backendConditions, rule.loadFactor ?? 80);
    },
    [addPaxGenerationRule]
  );

  const updateLoadFactorRule = useCallback(
    (ruleId: string, updatedRule: Partial<Rule> & { originalConditions?: Record<string, string[]> }) => {
      const ruleIndex = parseInt(ruleId.replace("rule-", ""));

      // 전체 규칙 업데이트인경우 (조건 + loadFactor + 플라이트카운트)
      if (
        updatedRule.conditions ||
        updatedRule.flightCount !== undefined ||
        updatedRule.loadFactor !== undefined
      ) {
        // 현재 규칙 가져오기
        const currentRule = paxGenerationRules[ruleIndex];
        if (!currentRule) return;

        // UI 조건을 백엔드 형식으로 변환 (조건이 변경된 경우)
        let backendConditions =
          updatedRule.originalConditions || currentRule.conditions;
        if (!updatedRule.originalConditions && updatedRule.conditions) {
          backendConditions = {};
          updatedRule.conditions.forEach((condition) => {
            const parts = condition.split(": ");
            if (parts.length === 2) {
              const displayLabel = parts[0];
              const value = parts[1];

              // 기존 조건에서 동일 값을 가진 컬럼 키 우선 사용
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
        updatePaxGenerationRuleStore(
          ruleIndex,
          backendConditions,
          updatedRule.loadFactor ??
            (typeof currentRule.value === "object" &&
            currentRule.value?.load_factor
              ? currentRule.value.load_factor // 값을 그대로 사용
              : 80) // 기본값 80%
        );
      }
    },
    [
      updatePaxGenerationRuleStore,
      paxGenerationRules
    ]
  );

  const removeLoadFactorRule = useCallback(
    (ruleId: string) => {
      const ruleIndex = parseInt(ruleId.replace("rule-", ""));
      removePaxGenerationRule(ruleIndex);
    },
    [removePaxGenerationRule]
  );

  const reorderLoadFactorRules = useCallback(
    (newOrder: Rule[]) => {
      // Rule[] 형식을 SimulationStore 형식으로 변환 (동일한 변환 로직 사용)
      const convertedRules = newOrder.map((rule) => {
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

        return {
          conditions: backendConditions,
          value: { load_factor: rule.loadFactor ?? 80 },
        };
      });

      reorderPaxGenerationRules(convertedRules);
    },
    [reorderPaxGenerationRules]
  );

  const updateLoadFactorDefault = useCallback(
    (value: number | null | undefined) => {
      // 기본값 처리: null/undefined일 때는 85%로 설정
      const safeValue = value !== null && value !== undefined ? value : 85;
      setPaxGenerationDefault(safeValue);
    },
    [setPaxGenerationDefault]
  );

  // ❌ 프론트엔드 기본값 제거 - null 상태로 유지
  // const FRONTEND_DEFAULT_LOAD_FACTOR = 80;

  // 로컬 UI 상태
  const [definedProperties] = useState<string[]>(["Load Factor"]); // 고정값
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

  // 순차적 limited 계산 (메모이제이션)
  const flightCalculations = useMemo(() => {
    const allocation = allocateFlightsSequential(
      createdRules,
      parquetMetadata,
      TOTAL_FLIGHTS
    );

    return {
      actualCounts: allocation.actualCounts,
      limitedCounts: allocation.limitedCounts,
      remainingFlights: allocation.remainingFlights,
      usedFlights: allocation.usedFlights,
      totalFlights: TOTAL_FLIGHTS,
    };
  }, [createdRules, parquetMetadata, TOTAL_FLIGHTS]); // parquetMetadata도 의존성에 추가

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
      const parts = condition.split(": ");
      if (parts.length === 2) {
        const category = parts[0]; // "Airline", "Aircraft Type", etc.
        const value = parts[1]; // Value from condition

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
      loadFactor: number;
      originalConditions?: Record<string, string[]>;
    }) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateLoadFactorRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            loadFactor: savedRuleData.loadFactor,
            originalConditions: savedRuleData.originalConditions,
          });
        }
        setEditingRuleId(null);
        setIsRuleModalOpen(false);
      } else {
        // Create 모드에서 새 규칙 생성
        if (savedRuleData) {
          const loadFactor =
            savedRuleData.loadFactor ?? defaultLoadFactor ?? 85;

          const newRule = {
            id: `rule-${Date.now()}`,
            name: `Rule ${createdRules.length + 1}`,
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            loadFactor,
            originalConditions: savedRuleData.originalConditions,
            isExpanded: true,
          };

          addLoadFactorRule(newRule);
          setIsRuleModalOpen(false);
        }
      }
    },
    [
      editingRuleId,
      createdRules.length,
      defaultLoadFactor,
      updateLoadFactorRule,
      addLoadFactorRule,
    ]
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
            <h4 className="text-lg font-semibold text-default-900">
              Assign Load Factor Rules
            </h4>
            <p className="text-sm text-default-500">
              Apply different load factors to flights based on specific
              conditions
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleOpenRuleModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Rule
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
                        {flightCalculations.actualCounts[rule.id] ??
                          rule.flightCount}
                      </span>
                      <span className="text-sm text-gray-500">
                        / {flightCalculations.totalFlights}
                      </span>
                      <span className="text-sm text-gray-500">flights</span>
                    </div>
                    {(() => {
                      const limitedCount =
                        flightCalculations.limitedCounts[rule.id];
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

              {/* Load Factor Input */}
              <div className="mt-3">
                <div className="flex items-center gap-4">
                  <label className="flex-shrink-0 text-sm font-medium text-gray-700">
                    Load Factor:
                  </label>
                  <div className="flex-1 px-4">
                    <LoadFactorSlider
                      value={rule.loadFactor ?? defaultLoadFactor ?? 85}
                      onChange={(value) =>
                        updateLoadFactorRule(rule.id, { loadFactor: value })
                      }
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
                <Badge className="pointer-events-none border-0 bg-green-100 text-green-700">
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
            </div>

            {/* Default Load Factor Input */}
            <div className="mt-3">
              <div className="flex items-center gap-4">
                <label className="flex-shrink-0 text-sm font-medium text-gray-700">
                  Default Load Factor:
                </label>
                <div className="flex-1 px-4">
                  <LoadFactorSlider
                    value={defaultLoadFactor ?? 85}
                    onChange={(value) => updateLoadFactorDefault(value)}
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
                ? `Update ${createdRules.find((rule) => rule.id === editingRuleId)?.name || "Rule"}`
                : "Create New Rule"}
            </DialogTitle>
            <DialogDescription>
              {editingRuleId
                ? "Modify the flight conditions and load factor value for this rule."
                : "Select flight conditions and assign load factor value."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <ProfileCriteriaSettings
              parquetMetadata={parquetMetadata}
              definedProperties={definedProperties}
              configType="load_factor"
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
              Confirm Property Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "add"
                ? "Adding new properties will affect existing load factor rules. Do you want to continue?"
                : "Removing properties will affect existing load factor rules. Do you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <div className="text-sm text-muted-foreground">Affected items:</div>
            <ul className="list-inside list-disc space-y-1 rounded bg-muted p-3 text-sm">
              {createdRules.length > 0 && (
                <li>
                  {createdRules.length} load factor rule
                  {createdRules.length > 1 ? "s" : ""}
                </li>
              )}
              {hasDefaultRule && <li>Default load factor rule</li>}
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
