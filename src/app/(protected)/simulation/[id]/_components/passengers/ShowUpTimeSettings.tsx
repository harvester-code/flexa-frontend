"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Play,
  Plus,
  Trash2,
  X,
  XCircle,
  Plane,
} from "lucide-react";
import { createPassengerShowUp } from "@/services/simulationService";
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
import { IntegerNumberInput } from "@/components/ui/IntegerNumberInput";
import { useToast } from "@/hooks/useToast";
import { useSimulationStore } from "../../_stores";
import ProfileCriteriaSettings from "./ProfileCriteriaSettings";
import { getColumnLabel, getColumnName } from "@/styles/columnMappings";
import { allocateFlightsSequential } from "./utils/flightAllocation";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";

// Plotly를 동적으로 로드 (SSR 문제 방지)
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center text-gray-500">
      Loading chart...
    </div>
  ),
});

// Use all colors from COMPONENT_TYPICAL_COLORS
const COLORS = COMPONENT_TYPICAL_COLORS;

interface Rule {
  id: string;
  name: string;
  conditions: string[];
  flightCount: number;
  parameters?: { Mean: number; Std: number }; // 🔄 distribution → parameters (평균, 표준편차)
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

interface ShowUpTimeSettingsProps {
  parquetMetadata?: ParquetMetadataItem[];
  simulationId?: string;
  hideGenerateButton?: boolean;
}

export default function ShowUpTimeSettings({
  parquetMetadata = [],
  simulationId,
  hideGenerateButton = false,
}: ShowUpTimeSettingsProps) {
  // 🆕 SimulationStore 연결
  const paxArrivalPatternRules = useSimulationStore(
    (s) => s.passenger.pax_arrival_patterns.rules
  );
  const arrivalPatternsDefault = useSimulationStore(
    (s) => s.passenger.pax_arrival_patterns.default
  );
  const addPaxArrivalPatternRule = useSimulationStore(
    (s) => s.addPaxArrivalPatternRule
  );
  const updatePaxArrivalPatternRule = useSimulationStore(
    (s) => s.updatePaxArrivalPatternRule
  );
  const removePaxArrivalPatternRule = useSimulationStore(
    (s) => s.removePaxArrivalPatternRule
  );
  const setPaxArrivalPatternDefault = useSimulationStore(
    (s) => s.setPaxArrivalPatternDefault
  );

  // 🆕 SimulationStore에서 passenger 데이터 및 context 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const contextData = useSimulationStore((state) => state.context);

  // 🔄 다른 탭 데이터들도 SimulationStore에서 직접 가져오기 (Generate Pax API용)
  const loadFactorData = useSimulationStore((s) => s.passenger.pax_generation);
  const nationalityData = useSimulationStore(
    (s) => s.passenger.pax_demographics.nationality
  );
  const profileData = useSimulationStore(
    (s) => s.passenger.pax_demographics.profile
  );

  // 🆕 Toast 및 API 호출 관련 상태
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // No value mappings needed - data is already in correct format

  // SimulationStore 데이터 변환
  const createdRules: Rule[] = useMemo(() => {
    return paxArrivalPatternRules.map((rule, index) => ({
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
      parameters: {
        Mean: rule.value?.mean || 120,
        Std: rule.value?.std || 30,
      },
      isExpanded: false,
    }));
  }, [paxArrivalPatternRules]);

  const hasDefaultRule =
    arrivalPatternsDefault.mean !== null && arrivalPatternsDefault.std !== null;
  const defaultMean = arrivalPatternsDefault.mean;
  const defaultStd = arrivalPatternsDefault.std;

  // 🆕 탭이 처음 열릴 때만 초기값 설정 - 지연 실행으로 탭 활성화 확인
  useEffect(() => {
    const timer = setTimeout(() => {
      // 탭이 실제로 보여지고 있고, 값이 null인 경우에만 초기값 설정
      if (defaultMean === null || defaultStd === null) {
        setPaxArrivalPatternDefault({
          mean: 120,
          std: 30,
        });
      }
    }, 100); // 100ms 지연으로 탭이 완전히 렌더링된 후 실행

    return () => clearTimeout(timer);
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 액션 어댑터들
  const addShowUpTimeRule = useCallback(
    (rule: Rule) => {
      // UI 조건을 백엔드 형식으로 변환
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

      addPaxArrivalPatternRule({
        conditions: backendConditions,
        value: {
          mean: rule.parameters?.["Mean"] || 120, // 룰 생성 시에만 기본값 사용
          std: rule.parameters?.["Std"] || 30, // 룰 생성 시에만 기본값 사용
        },
      });
    },
    [addPaxArrivalPatternRule]
  );

  const updateShowUpTimeRule = useCallback(
    (ruleId: string, updatedRule: Partial<Rule> & { originalConditions?: Record<string, string[]> }) => {
      const ruleIndex = parseInt(ruleId.replace("rule-", ""));

      // 전체 규칙 업데이트인경우 (조건 + parameters + 플라이트카운트)
      if (
        updatedRule.conditions ||
        updatedRule.flightCount !== undefined ||
        updatedRule.parameters
      ) {
        // 현재 규칙 가져오기
        const currentRule = paxArrivalPatternRules[ruleIndex];
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
        updatePaxArrivalPatternRule(ruleIndex, {
          conditions: backendConditions,
          value: {
            mean:
              updatedRule.parameters?.Mean ?? currentRule.value?.mean ?? 120,
            std: updatedRule.parameters?.Std ?? currentRule.value?.std ?? 30,
          },
        });
      }
    },
    [
      updatePaxArrivalPatternRule,
      paxArrivalPatternRules
    ]
  );

  const removeShowUpTimeRule = useCallback(
    (ruleId: string) => {
      const ruleIndex = parseInt(ruleId.replace("rule-", ""));
      removePaxArrivalPatternRule(ruleIndex);
    },
    [removePaxArrivalPatternRule]
  );

  const reorderShowUpTimeRules = useCallback((newOrder: Rule[]) => {
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
        value: {
          mean: rule.parameters?.["Mean"] || 120,
          std: rule.parameters?.["Std"] || 30,
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
        title: "Error",
        description: "Simulation ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      // 🔧 SimulationStore에서 실제 데이터 수집하여 API 요청 body 구성
      const requestBody = {
        settings: {
          airport: contextData.airport,
          date: contextData.date || new Date().toISOString().split("T")[0], // 빈 날짜면 오늘 날짜 사용
          min_arrival_minutes: 15,
        },
        pax_generation: {
          rules: loadFactorData.rules || [],
          default: {
            // 🆕 확실한 기본값 보장: null, undefined가 아닌 경우만 사용
            load_factor:
              loadFactorData.default?.load_factor !== null &&
              loadFactorData.default?.load_factor !== undefined
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
            // 🆕 null 값이면 그대로 전송 - 백엔드에서 처리
            mean: defaultMean,
            std: defaultStd,
          },
        },
      };

      const { data: response } = await createPassengerShowUp(
        simulationId,
        requestBody
      );

      // S3 저장은 Save 버튼을 통해서만 수행됨

      toast({
        title: "Passenger Schedule Generated",
        description: "Passenger data has been generated successfully.",
      });

      // TODO: 응답 데이터 처리 (필요에 따라)
      // useSimulationStore.getState().setPassengerResults(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate passenger data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 로컬 UI 상태
  const [definedProperties] = useState<string[]>(["mean", "std"]); // 고정값
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
      const parts = condition.split(": ");
      if (parts.length === 2) {
        const category = parts[0]; // Category name
        const value = parts[1]; // Category value

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
      parameters: { Mean: number; Std: number };
      originalConditions?: Record<string, string[]>;
    }) => {
      if (editingRuleId) {
        // Edit 모드에서 규칙 업데이트
        if (savedRuleData) {
          updateShowUpTimeRule(editingRuleId, {
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            parameters: savedRuleData.parameters, // { Mean: number, Std: number }
            originalConditions: savedRuleData.originalConditions,
          });
        }
        setEditingRuleId(null);
        setIsRuleModalOpen(false);
      } else {
        // Create 모드에서 새 규칙 생성
        if (savedRuleData) {
          const parameters = savedRuleData.parameters || {
            Mean: defaultMean || 120, // 룰 생성 시에만 기본값 사용
            Std: defaultStd || 30, // 룰 생성 시에만 기본값 사용
          };

          const newRule = {
            id: `rule-${Date.now()}`,
            name: `Rule ${createdRules.length + 1}`,
            conditions: savedRuleData.conditions,
            flightCount: savedRuleData.flightCount,
            parameters: savedRuleData.parameters || parameters, // { Mean: number, Std: number }
            originalConditions: savedRuleData.originalConditions,
            isExpanded: true,
          };

          addShowUpTimeRule(newRule);
          setIsRuleModalOpen(false);
        }
      }
    },
    [
      editingRuleId,
      defaultMean,
      defaultStd,
      createdRules.length,
      updateShowUpTimeRule,
      addShowUpTimeRule,
    ]
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
    const colors = [
      "#8B5CF6",
      "#06B6D4",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#6366F1",
      "#EC4899",
    ];

    // 전체 범위 계산 (null이 아닌 분포들만 포함)
    const validMeans = [
      ...(defaultMean !== null ? [defaultMean] : []),
      ...createdRules
        .map((rule) => rule.parameters?.Mean)
        .filter((mean) => mean !== null && mean !== undefined),
    ];
    const validStds = [
      ...(defaultStd !== null ? [defaultStd] : []),
      ...createdRules
        .map((rule) => rule.parameters?.Std)
        .filter((std) => std !== null && std !== undefined),
    ];

    // 유효한 분포가 없으면 차트를 렌더링하지 않음
    if (validMeans.length === 0 || validStds.length === 0) {
      return { data: [], layout: null };
    }

    const allMeans = validMeans;
    const allStds = validStds;

    const maxMean = Math.max(...allMeans);
    const maxStd = Math.max(...allStds);

    // ✅ X축을 출발 시각 기준으로 변경 (왼쪽이 이른 도착, 오른쪽이 출발시각 0)
    let rangeStart: number;
    const rangeEnd = 0; // 출발 시각

    // 범위 설정: 가장 이른 도착부터 출발시각(0)까지
    rangeStart = -(maxMean + 3 * maxStd); // 가장 이른 도착 시간 (음수)

    // 최소 범위 보장
    const minRange = 60; // 최소 60분 범위
    if (Math.abs(rangeStart) < minRange) {
      rangeStart = -minRange;
    }

    const steps = 200;
    const stepSize = (rangeEnd - rangeStart) / steps;

    // X축 값 생성 (음수에서 0까지)
    const xValues: number[] = [];
    for (let i = 0; i <= steps; i++) {
      xValues.push(rangeStart + i * stepSize);
    }

    // Default 분포 추가 (x축 값을 음수로 변환)
    if (
      defaultMean !== null &&
      defaultStd !== null &&
      !isNaN(defaultMean) &&
      !isNaN(defaultStd) &&
      defaultStd > 0
    ) {
      const defaultY = xValues.map(
        (x) =>
          (1 / (defaultStd * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * Math.pow((x + defaultMean) / defaultStd, 2)) // x를 -defaultMean 중심으로 이동
      );

      traces.push({
        x: xValues,
        y: defaultY,
        type: "scatter",
        mode: "lines",
        name: `Default (μ=${defaultMean}min)`,
        line: {
          color: colors[0],
          width: 3,
        },
        fill: "tonexty",
        fillcolor: `${colors[0]}15`,
        hovertemplate:
          "Minutes before departure: %{x}<br>Probability: %{y:.4f}<extra></extra>",
      });
    }

    // Rule 분포들 추가
    createdRules.forEach((rule, index) => {
      const mean = rule.parameters?.Mean;
      const std = rule.parameters?.Std;

      if (
        mean !== null &&
        mean !== undefined &&
        std !== null &&
        std !== undefined &&
        !isNaN(mean) &&
        !isNaN(std) &&
        std > 0
      ) {
        const ruleY = xValues.map(
          (x) =>
            (1 / (std * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x + mean) / std, 2))
        );

        traces.push({
          x: xValues,
          y: ruleY,
          type: "scatter",
          mode: "lines",
          name: `${rule.name} (μ=${mean}min)`,
          line: {
            color: colors[(index + 1) % colors.length],
            width: 2,
          },
          fill: "tonexty",
          fillcolor: `${colors[(index + 1) % colors.length]}10`,
          hovertemplate:
            "Minutes before departure: %{x}<br>Probability: %{y:.4f}<extra></extra>",
        });
      }
    });

    // 레이아웃 설정
    const layout = {
      title: {
        text: "Passenger Arrival Distribution<br><sub>Time before scheduled departure</sub>",
        font: { size: 16 },
      },
      xaxis: {
        title: "", // 축 제목 제거
        showgrid: true,
        zeroline: true,
        range: [rangeStart - 10, rangeEnd + 10], // 양쪽에 여백 추가
        gridcolor: "#E5E7EB",
        zerolinecolor: "#EF4444", // 출발시각 빨간색
        zerolinewidth: 2,
        tickmode: "array" as const,
        tickvals: [...Array(Math.ceil(Math.abs(rangeStart) / 30) + 1)]
          .map((_, i) => -i * 30)
          .reverse(),
        ticktext: [...Array(Math.ceil(Math.abs(rangeStart) / 30) + 1)]
          .map((_, i) => (i === 0 ? "0" : `-${i * 30}min`))
          .reverse(),
        automargin: true,
        tickangle: 0,
        tickfont: {
          size: 11,
        },
        ticksuffix: "  ", // 틱 레이블 뒤에 공백 추가
        tickpadding: 8, // 틱과 그래프 사이 간격
      },
      yaxis: {
        title: "", // 축 제목 제거
        showgrid: true,
        zeroline: false,
        gridcolor: "#E5E7EB",
        tickformat: ".3f",
        tickfont: {
          size: 11,
        },
        tickpadding: 8, // 틱과 그래프 사이 간격
      },
      margin: { t: 80, r: 50, b: 60, l: 80 },
      height: 400,
      showlegend: true,
      legend: {
        x: 0.02,
        xanchor: "left",
        y: 0.98,
        yanchor: "top",
        bgcolor: "rgba(255, 255, 255, 0.9)",
        bordercolor: "#E5E7EB",
        borderwidth: 1,
      },
      hovermode: "x unified",
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "rgba(0,0,0,0)",
      annotations: [
        {
          x: 0,
          y: -0.08,
          xref: "x",
          yref: "paper",
          text: "✈️ Departure",
          showarrow: false, // 화살표 제거
          bgcolor: "#FEE2E2",
          bordercolor: "#EF4444",
          borderwidth: 1,
          borderpad: 4,
          font: {
            color: "#EF4444",
            size: 11,
          },
          xanchor: "center",
        },
        {
          x: defaultMean ? -defaultMean : -120,
          y: 0.5,
          xref: "x",
          yref: "paper",
          text: `Peak Arrival<br>${defaultMean || 120}min before`,
          showarrow: true,
          arrowhead: 2,
          arrowsize: 1,
          arrowwidth: 1,
          arrowcolor: colors[0],
          ax: 0,
          ay: -40,
          bgcolor: "white",
          bordercolor: colors[0],
          borderwidth: 1,
          borderpad: 4,
          font: {
            color: colors[0],
            size: 11,
          },
        },
      ],
      shapes: [
        // 출발 시각 수직선
        {
          type: "line" as const,
          x0: 0,
          x1: 0,
          y0: 0,
          y1: 1,
          yref: "paper" as const,
          line: {
            color: "#EF4444",
            width: 2,
            dash: "dashdot" as const,
          },
        },
      ],
    };

    return { data: traces, layout };
  }, [defaultMean, defaultStd, createdRules]);

  return (
    <div className="space-y-6">
      {/* Add Rules Section - 항상 표시 */}
      <div>
        <div className="flex items-center justify-between border-l-4 border-primary pl-4">
          <div>
            <h4 className="text-lg font-semibold text-default-900">
              Assign Show-up Time Rules
            </h4>
            <p className="text-sm text-default-500">
              Apply different show-up time parameters to flights based on
              specific conditions
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
              {rule.parameters && (
                <div className="mt-3">
                  <div className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mean (minutes)
                        </label>
                        <IntegerNumberInput
                          value={
                            rule.parameters.Mean !== undefined
                              ? rule.parameters.Mean
                              : defaultMean || 120 // 룰 수정 시에만 기본값 사용
                          }
                          onChange={(newMean) => {
                            updateShowUpTimeRule(rule.id, {
                              parameters: {
                                Mean: newMean,
                                Std: rule.parameters?.Std || defaultStd || 30,
                              },
                            });
                          }}
                          placeholder={
                            defaultMean
                              ? `${defaultMean} minutes`
                              : "120 minutes"
                          }
                          unit="minutes"
                          min={0}
                          max={999}
                          className={
                            rule.parameters &&
                            (rule.parameters.Mean < 0 ||
                              rule.parameters.Std <= 0)
                              ? "border-red-500 bg-red-50"
                              : ""
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Standard Deviation
                        </label>
                        <IntegerNumberInput
                          value={
                            rule.parameters.Std !== undefined
                              ? rule.parameters.Std
                              : defaultStd || 30 // 룰 수정 시에만 기본값 사용
                          }
                          onChange={(newStd) => {
                            updateShowUpTimeRule(rule.id, {
                              parameters: {
                                Mean:
                                  rule.parameters?.Mean || defaultMean || 120,
                                Std: newStd,
                              },
                            });
                          }}
                          placeholder={
                            defaultStd ? defaultStd.toString() : "30"
                          }
                          min={1}
                          max={999}
                          className={
                            rule.parameters &&
                            (rule.parameters.Mean < 0 ||
                              rule.parameters.Std <= 0)
                              ? "border-red-500 bg-red-50"
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {rule.parameters &&
                    rule.parameters.Mean >= 0 &&
                    rule.parameters.Std > 0 ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        Valid parameters (μ={rule.parameters.Mean}, σ=
                        {rule.parameters.Std})
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

            {/* Default Distribution Parameters */}
            <div className="mt-3">
              <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mean (minutes)
                    </label>
                    <IntegerNumberInput
                      value={defaultMean || 120} // 디폴트 입력값에서만 기본값 표시
                      onChange={(newMean) => {
                        updateShowUpTimeDefault(newMean, defaultStd || 30);
                      }}
                      placeholder={
                        defaultMean ? `${defaultMean} minutes` : "120 minutes"
                      }
                      unit="minutes"
                      min={0}
                      max={999}
                      className={
                        defaultMean !== null && defaultMean < 0
                          ? "border-red-500 bg-red-50"
                          : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Standard Deviation
                    </label>
                    <IntegerNumberInput
                      value={defaultStd || 30} // 디폴트 입력값에서만 기본값 표시
                      onChange={(newStd) => {
                        updateShowUpTimeDefault(defaultMean || 120, newStd);
                      }}
                      placeholder={defaultStd ? defaultStd.toString() : "30"}
                      min={1}
                      max={999}
                      className={
                        defaultStd !== null && defaultStd <= 0
                          ? "border-red-500 bg-red-50"
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Default Validation Status */}
              <div className="mt-2 flex items-center gap-2 text-sm">
                {defaultMean !== null &&
                defaultStd !== null &&
                defaultMean >= 0 &&
                defaultStd > 0 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={14} />
                    Valid parameters (μ={defaultMean}, σ={defaultStd})
                  </span>
                ) : defaultMean !== null || defaultStd !== null ? (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={14} />
                    Invalid parameters (mean must be ≥0, std must be &gt;0)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <AlertTriangle size={14} />
                    No parameters set - enter values to configure show-up time
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Distribution Chart - 유효한 데이터가 있을 때만 표시 */}
      {combinedChartConfig.layout !== null &&
        combinedChartConfig.data.length > 0 && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <h4 className="mb-4 text-lg font-medium text-gray-900">
              Show-up Time Distributions Comparison
            </h4>
            {React.createElement(Plot as any, {
              data: combinedChartConfig.data,
              layout: combinedChartConfig.layout,
              config: {
                displayModeBar: false,
                responsive: true,
              },
              style: { width: "100%", height: "400px" },
            })}
          </div>
        )}

      {/* Generate Pax Button - 조건부 렌더링 */}
      {!hideGenerateButton && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleGeneratePax} disabled={isGenerating}>
            <Play size={16} />
            {isGenerating ? "Generating..." : "Generate Pax"}
          </Button>
        </div>
      )}

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
                ? "Modify the flight conditions and show-up time parameters for this rule."
                : "Select flight conditions and assign show-up time parameters."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <ProfileCriteriaSettings
              parquetMetadata={parquetMetadata}
              definedProperties={definedProperties}
              configType="show_up_time"
              editingRule={
                editingRuleId
                  ? createdRules.find((rule) => rule.id === editingRuleId)
                  : undefined
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Show-up Time 탭에서는 속성 변경 확인창이 필요하지 않음 */}
    </div>
  );
}
