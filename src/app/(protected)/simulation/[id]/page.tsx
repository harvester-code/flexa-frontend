"use client";

import React, {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Clock, Save, Trash2, Bot } from "lucide-react";
import { APIRequestLog } from "@/types/simulationTypes";
import {
  deleteScenarioMetadata,
  saveScenarioMetadata,
} from "@/services/simulationService";
import TheContentHeader from "@/components/TheContentHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useUser } from "@/queries/userQueries";
import { timeToRelativeTime } from "@/lib/utils";
import SimulationLoading from "../_components/SimulationLoading";
import JSONDebugViewer from "./_components/shared/DebugViewer";
import TabDefault from "./_components/shared/TabDefault";
import TabFlightSchedule from "./_components/flights/TabFlightSchedule";
import TabPassengerSchedule from "./_components/passengers/TabPassengerSchedule";
import TabProcessingProcedures from "./_components/facilities/TabProcessingProcedures";
import AIChatSidebar from "./_components/facilities/AIChatSidebar";
import { useLoadScenarioData } from "./_hooks/useLoadScenarioData";
import { useScenarioProfileStore, useSimulationStore } from "./_stores";

const tabs: { text: string; number: number }[] = [
  { text: "Flights", number: 0 },
  { text: "Passengers", number: 1 },
  { text: "Facilities", number: 2 },
];

// Scenario name display defaults to the simulation ID when no name is available
function ScenarioNameDisplay({ label }: { label: string }) {
  return <dd suppressHydrationWarning>{label}</dd>;
}

export default function SimulationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: user, isLoading: isUserLoading } = useUser();

  // ✅ simulationId를 맨 위로 이동 (다른 훅들보다 먼저)
  const simulationId = use(params).id;

  const resolvedSearchParams = use(
    searchParams ?? Promise.resolve({} as Record<string, string | string[]>),
  );

  const queryScenarioName = useMemo(() => {
    const rawName = resolvedSearchParams?.name;
    const normalized = Array.isArray(rawName) ? rawName[0] : rawName;
    if (typeof normalized !== "string") {
      return undefined;
    }
    const trimmed = normalized.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [resolvedSearchParams]);

  const queryScenarioAirport = useMemo(() => {
    const rawAirport = resolvedSearchParams?.airport;
    const normalized = Array.isArray(rawAirport) ? rawAirport[0] : rawAirport;
    if (typeof normalized !== "string") {
      return undefined;
    }
    const trimmed = normalized.trim().toUpperCase();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [resolvedSearchParams]);

  // 개별 store에서 필요한 데이터만 직접 가져오기
  const currentScenarioTab = useScenarioProfileStore(
    (s) => s.currentScenarioTab,
  );
  const scenarioName = useScenarioProfileStore((s) => s.scenarioName);
  const scenarioHistory = useScenarioProfileStore((s) => s.scenarioHistory);

  const displayScenarioName = useMemo(() => {
    if (queryScenarioName) {
      return queryScenarioName;
    }
    if (typeof scenarioName === "string") {
      const trimmed = scenarioName.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    return simulationId;
  }, [queryScenarioName, scenarioName, simulationId]);

  const setCurrentScenarioTab = useScenarioProfileStore(
    (s) => s.setCurrentScenarioTab,
  );
  const loadScenarioProfileMetadata = useScenarioProfileStore(
    (s) => s.loadMetadata,
  );

  const flightScheduleCompleted = useSimulationStore(
    (s) => s.workflow.step1Completed,
  );
  const passengerScheduleCompleted = useSimulationStore(
    (s) => s.workflow.step2Completed,
  );
  const appliedFilterResult = useSimulationStore(
    (s) => s.flight.appliedFilterResult,
  );
  const passengerChartResult = useSimulationStore(
    (s) => s.passenger.chartResult,
  );
  const storeAirport = useSimulationStore((s) => s.context.airport);
  const setStoreAirport = useSimulationStore((s) => s.setAirport);
  const lastSavedAt = useSimulationStore(
    (s) => s.savedAt || s.context.lastSavedAt || null,
  );
  const lastSavedRelative = useMemo(
    () => (lastSavedAt ? timeToRelativeTime(lastSavedAt) : ""),
    [lastSavedAt],
  );
  const lastSavedTooltip = useMemo(
    () => (lastSavedAt ? dayjs(lastSavedAt).format("YYYY-MM-DD HH:mm") : ""),
    [lastSavedAt],
  );

  // 🎯 Role 기반 접근 제어: viewer는 Simulation 상세 페이지 접근 불가
  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.role === "viewer") {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        router.push("/home");
      }
    }
  }, [user, isUserLoading, router, toast]);

  useEffect(() => {
    if (queryScenarioAirport && !storeAirport) {
      setStoreAirport(queryScenarioAirport);
    }
  }, [queryScenarioAirport, setStoreAirport, storeAirport]);

  // S3 메타데이터를 모든 modular stores에 로드하는 함수
  const loadCompleteS3Metadata = useCallback(async (data: any) => {
    try {
      // 🔧 새로운 통합 Store 구조에 맞게 수정
      const metadata = data.metadata || {};
      const tabs = metadata.tabs || {};
      const savedTimestamp =
        metadata.savedAt ||
        metadata?.context?.lastSavedAt ||
        data.loaded_at ||
        null;

      // 🎯 S3에서 받은 데이터를 Zustand에 통째로 갈아끼우기
      if (
        metadata.context ||
        metadata.flight ||
        metadata.passenger ||
        metadata.process_flow ||
        metadata.workflow
      ) {
        // 🔄 시설 ID 마이그레이션: A_1 → A_01
        if (metadata.process_flow && Array.isArray(metadata.process_flow)) {
          const { migrateProcessFlowFacilityIds } =
            await import("./_components/facilities/helpers");
          metadata.process_flow = migrateProcessFlowFacilityIds(
            metadata.process_flow,
          );
        }
        // 현재 Store의 액션들만 보존하고 나머지는 S3 데이터로 교체
        const currentStore = useSimulationStore.getState();
        const metadataTerminalLayout = metadata.terminalLayout
          ? {
              imageUrl: metadata.terminalLayout.imageUrl ?? null,
              zoneAreas: metadata.terminalLayout.zoneAreas ?? {},
            }
          : { imageUrl: null, zoneAreas: {} };

        // S3 데이터 + 액션들 조합
        const newState = {
          // 데이터는 S3에서 받은 것으로 덮어쓰기
          ...metadata,
          terminalLayout: metadataTerminalLayout,

          // scenarioId는 현재 URL 값으로 보정
          context: {
            ...metadata.context,
            scenarioId: simulationId,
          },

          // 액션들은 현재 store에서 그대로 유지
          resetStore: currentStore.resetStore,
          setScenarioId: currentStore.setScenarioId,
          setAirport: currentStore.setAirport,
          setDate: currentStore.setDate,
          setLastSavedAt: currentStore.setLastSavedAt,
          setFlightFilters: currentStore.setFlightFilters,
          resetFlightData: currentStore.resetFlightData,
          setSelectedConditions: currentStore.setSelectedConditions,
          setFlightType: currentStore.setFlightType,
          addCondition: currentStore.addCondition,
          removeCondition: currentStore.removeCondition,
          updateConditionValues: currentStore.updateConditionValues,
          toggleConditionValue: currentStore.toggleConditionValue,
          clearAllConditions: currentStore.clearAllConditions,
          setAppliedFilterResult: currentStore.setAppliedFilterResult,
          setCurrentStep: currentStore.setCurrentStep,
          setStepCompleted: currentStore.setStepCompleted,
          updateAvailableSteps: currentStore.updateAvailableSteps,
          setSettings: currentStore.setSettings,
          setPaxDemographics: currentStore.setPaxDemographics,
          setNationalityValues: currentStore.setNationalityValues,
          setProfileValues: currentStore.setProfileValues,
          addNationalityRule: currentStore.addNationalityRule,
          addProfileRule: currentStore.addProfileRule,
          removeNationalityRule: currentStore.removeNationalityRule,
          removeProfileRule: currentStore.removeProfileRule,
          updateNationalityDistribution:
            currentStore.updateNationalityDistribution,
          updateProfileDistribution: currentStore.updateProfileDistribution,
          reorderPaxDemographics: currentStore.reorderPaxDemographics,
          setPaxArrivalPatternRules: currentStore.setPaxArrivalPatternRules,
          addPaxArrivalPatternRule: currentStore.addPaxArrivalPatternRule,
          updatePaxArrivalPatternRule: currentStore.updatePaxArrivalPatternRule,
          removePaxArrivalPatternRule: currentStore.removePaxArrivalPatternRule,
          resetPassenger: currentStore.resetPassenger,
          loadPassengerMetadata: currentStore.loadPassengerMetadata,
          setProcessFlow: currentStore.setProcessFlow,
          convertFromProcedures: currentStore.convertFromProcedures,
          setProcessCompleted: currentStore.setProcessCompleted,
          resetProcessFlow: currentStore.resetProcessFlow,
          loadProcessMetadata: currentStore.loadProcessMetadata,
          setFacilitiesForZone: currentStore.setFacilitiesForZone,
          updateFacilitySchedule: currentStore.updateFacilitySchedule,
          toggleFacilityTimeBlock: currentStore.toggleFacilityTimeBlock,
          updateTravelTime: currentStore.updateTravelTime,
          setTerminalLayoutImageUrl: currentStore.setTerminalLayoutImageUrl,
          setZoneArea: currentStore.setZoneArea,
          removeZoneArea: currentStore.removeZoneArea,
          clearAllZoneAreas: currentStore.clearAllZoneAreas,
        };

        // 🚀 한 방에 갈아끼우기
        useSimulationStore.setState(newState);

        // ⏱️ 최신 저장 시각 동기화
        useSimulationStore.setState({ savedAt: savedTimestamp || null });
        useSimulationStore.getState().setLastSavedAt(savedTimestamp || null);
      }

      // 🚧 Legacy tabs 구조 지원 (하위 호환성)
      else if (tabs.passengerSchedule || tabs.processingProcedures) {
        if (tabs.passengerSchedule) {
          useSimulationStore
            .getState()
            .loadPassengerMetadata(tabs.passengerSchedule);
        }

        if (tabs.processingProcedures) {
          useSimulationStore
            .getState()
            .loadProcessMetadata(tabs.processingProcedures);
        }
      } else {
      }
    } catch (error) {}
  }, []);

  // 탭 접근성 계산 - 버튼 클릭 기반으로 변경
  const getAvailableTabs = () => {
    // Flight Schedule 탭은 항상 접근 가능 (index 0)
    // Passenger Schedule 탭은 Filter Flights 버튼을 눌러야 접근 가능 (appliedFilterResult가 있어야 함)
    // Processing Procedures 탭은 Generate Pax 버튼을 눌러야 접근 가능 (passengerChartResult가 있어야 함)

    if (passengerChartResult) {
      // Generate Pax 완료 - 모든 탭 접근 가능
      return 2; // 0, 1, 2 탭 모두 접근 가능
    } else if (appliedFilterResult) {
      // Filter Flights 완료 - Flight Schedule과 Passenger Schedule 접근 가능
      return 1; // 0, 1 탭 접근 가능
    } else {
      // 아무것도 완료 안됨 - Flight Schedule만 접근 가능
      return 0; // 0 탭만 접근 가능
    }
  };

  // 🆕 통합 Store에서 메타데이터 수집용 함수
  const getCompleteMetadata = useCallback((scenarioId: string) => {
    try {
      // 통합 Store에서 전체 상태 가져오기
      const simulationState = useSimulationStore.getState();

      // 현재 시간으로 savedAt 업데이트
      const metadata = {
        ...simulationState,
        terminalLayout: simulationState.terminalLayout || { zoneAreas: {} },
        savedAt: new Date().toISOString(),
        // 날짜가 비어있으면 오늘 날짜로 설정
        context: {
          ...simulationState.context,
          date:
            simulationState.context.date ||
            new Date().toISOString().split("T")[0],
        },
      };

      return metadata;
    } catch (error) {
      const currentDate = new Date().toISOString().split("T")[0];
      return {
        context: {
          scenarioId: scenarioId,
          airport: "",
          date: currentDate,
          lastSavedAt: null,
        },
        flight: {
          total_flights: null,
          airlines: null,
          filters: null,
          selectedConditions: null,
          appliedFilterResult: null,
        },
        passenger: {
          settings: {},
          demographics: {},
          arrivalPatterns: {},
          showUpResults: null,
        },
        process: { flow: [] },
        terminalLayout: { imageUrl: null, zoneAreas: {} },
        workflow: {
          currentStep: 1,
          step1Completed: false,
          step2Completed: false,
          availableSteps: [1],
        },
        savedAt: new Date().toISOString(),
      };
    }
  }, []);

  const [isInitialized, setIsInitialized] = useState(false);
  const [apiRequestLog, setApiRequestLog] = useState<APIRequestLog | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // 🆕 통합 Store 액션들
  const setLastSavedAt = useSimulationStore((s) => s.setLastSavedAt);
  const setDate = useSimulationStore((s) => s.setDate);
  const setCurrentStep = useSimulationStore((s) => s.setCurrentStep);
  const currentDate = useSimulationStore((s) => s.context.date);

  // ✅ 클라이언트 측에서만 날짜 초기화 (hydration mismatch 방지)
  useEffect(() => {
    if (!currentDate) {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  }, [currentDate, setDate]);

  // 🔧 초기화 완료 후 workflow 기반 초기 탭 설정 (한 번만 실행)
  useEffect(() => {
    if (isInitialized) {
      const workflow = useSimulationStore.getState().workflow;
      const availableSteps = workflow.availableSteps || [1];

      // availableSteps의 마지막(최고) 단계로 초기 탭 설정
      const lastAvailableStep = Math.max(...availableSteps);
      const targetTab = lastAvailableStep - 1; // 0-based 탭 인덱스

      // 현재 탭이 기본값(0)이고, 마지막 사용 가능한 탭이 다르면 업데이트
      if (currentScenarioTab === 0 && targetTab !== 0 && targetTab <= 2) {
        useScenarioProfileStore.getState().setCurrentScenarioTab(targetTab);
      }
    }
  }, [isInitialized]); // 🔧 isInitialized만 dependency로 유지 (안정성 확보)

  // 🔧 탭 변경 시 currentStep 동기화 (별도 useEffect)
  useEffect(() => {
    if (isInitialized) {
      const newStep = currentScenarioTab + 1;
      useSimulationStore.getState().setCurrentStep(newStep);
    }
  }, [currentScenarioTab, isInitialized]); // 🔧 함수 호출을 getState()로 안정화

  // 임시저장 함수
  const handleTempSave = async () => {
    try {
      setIsSaving(true);

      const completeMetadata = getCompleteMetadata(simulationId);

      const { data: saveResult } = await saveScenarioMetadata(
        simulationId,
        completeMetadata,
      );

      // 🆕 저장 성공 시 lastSavedAt 업데이트
      const savedTimestamp = new Date().toISOString();
      setLastSavedAt(savedTimestamp);

      toast({
        title: "Saved",
        description: "Scenario has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the metadata.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 메타데이터 삭제 함수
  const handleDeleteMetadata = async () => {
    try {
      setIsDeleting(true);

      await deleteScenarioMetadata(simulationId);

      toast({
        title: "Metadata Deleted",
        description: "Scenario metadata has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the metadata.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🆕 탭 변경 시 두 store 모두 업데이트하는 통합 함수
  const handleTabChange = useCallback(
    (tabIndex: number) => {
      setCurrentScenarioTab(tabIndex);
      // 탭 인덱스를 step 번호로 변환 (0-based → 1-based)
      setCurrentStep(tabIndex + 1);
    },
    [setCurrentScenarioTab, setCurrentStep],
  );

  // ✅ S3 메타데이터 로드 기능 활성화 (초기 로드용)
  useLoadScenarioData(simulationId, {
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab, // 🔧 초기 로드는 기존 함수 사용
    setIsInitialized,
  });

  const latestHistory = useMemo(() => {
    return scenarioHistory && scenarioHistory?.length > 0
      ? { checkpoint: scenarioHistory[scenarioHistory?.length - 1] }
      : null;
  }, [scenarioHistory]);

  // Breadcrumbs for the simulation page
  const breadcrumbs = useMemo(() => {
    const displayName = displayScenarioName;

    return [
      { label: "Flexa", href: "/" },
      { label: "Simulation", href: "/simulation" },
      { label: displayName },
    ];
  }, [displayScenarioName]);

  // viewer인 경우 페이지 렌더링 방지
  if (!isUserLoading && user?.role === "viewer") {
    return null;
  }

  return (
    <>
      <TheContentHeader text="Simulation" breadcrumbs={breadcrumbs} />
      <div className="mx-auto max-w-page px-page-x pb-page-b">
        <div className="mt-[15px] flex justify-between">
          <div className="flex items-center gap-3">
            <dl className="sub-title">
              <Suspense fallback={<dd>{displayScenarioName}</dd>}>
                <ScenarioNameDisplay label={displayScenarioName} />
              </Suspense>
            </dl>
            {latestHistory?.checkpoint && (
              <span className="rounded-md bg-gray-100 px-2 py-1 text-sm text-default-500">
                {timeToRelativeTime(latestHistory?.checkpoint)}
              </span>
            )}
            {lastSavedRelative && (
              <span
                className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
                title={lastSavedTooltip}
              >
                <Clock className="h-4 w-4" />
                Updated {lastSavedRelative}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTempSave} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 size={16} />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Metadata</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this scenario&rsquo;s
                    metadata?
                    <br />
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={handleDeleteMetadata}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <TabDefault
          className={`mt-[40px]`}
          currentTab={currentScenarioTab}
          availableTabs={getAvailableTabs()}
          tabCount={tabs.length}
          tabs={tabs.map((tab) => ({ text: tab.text }))}
          onTabChange={handleTabChange}
        />

        {isInitialized ? (
          <React.Fragment key={simulationId}>
            <TabFlightSchedule
              visible={currentScenarioTab === 0}
              simulationId={simulationId}
              apiRequestLog={apiRequestLog}
              setApiRequestLog={setApiRequestLog}
            />
            <TabPassengerSchedule
              visible={currentScenarioTab === 1}
              simulationId={simulationId}
              apiRequestLog={apiRequestLog}
              setApiRequestLog={setApiRequestLog}
            />
            <TabProcessingProcedures
              visible={currentScenarioTab === 2}
              simulationId={simulationId}
              apiRequestLog={apiRequestLog}
              setApiRequestLog={setApiRequestLog}
            />
          </React.Fragment>
        ) : (
          <SimulationLoading minHeight="min-h-[200px]" />
        )}

        {/* 개발 환경에서만 Debug Viewer 표시 */}
        {process.env.NODE_ENV === "development" && (
          <JSONDebugViewer
            visible={true}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
          />
        )}

        {/* Floating AI Assistant Button */}
        <Button
          variant="primary"
          size="icon"
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-6 right-6 z-30 rounded-xl shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          title="Open AI Assistant"
        >
          <Bot className="h-5 w-5" />
        </Button>

        {/* AI Chat Sidebar */}
        <AIChatSidebar
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          simulationId={simulationId}
        />
      </div>
    </>
  );
}
