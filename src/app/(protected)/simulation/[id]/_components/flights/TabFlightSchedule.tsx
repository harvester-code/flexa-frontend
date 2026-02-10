"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  APIRequestLog,
  AirlineInfo,
  AvailableConditions,
  SelectedConditions,
} from "@/types/simulationTypes";
import {
  getFlightFilters,
  getFlightSchedules,
} from "@/services/simulationService";
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import SimulationLoading from "../../../_components/SimulationLoading";
import { useSimulationStore } from "../../_stores";
// TabFlightScheduleChart와 TabFlightScheduleFilterConditions 삭제됨
import FlightFilterConditions from "./FlightFilterConditions";
import FlightDataLoader from "./FlightDataLoader";
// TabFlightScheduleResponsePreview 제거됨
import FlightResultChart from "./FlightResultChart";

interface TabFlightScheduleProps {
  simulationId: string;
  visible: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

interface ApplyFilterData {
  total: number;
  chart_x_data: string[];
  chart_y_data: {
    [category: string]: Array<{
      name: string;
      order: number;
      y: number[];
      acc_y: number[];
    }>;
  };
  appliedAt: string;
}

interface FiltersData {
  total_flights: number;
  airlines: Record<string, string>;
  filters: Record<string, unknown>;
}

function TabFlightSchedule({
  simulationId,
  visible,
  apiRequestLog,
  setApiRequestLog,
}: TabFlightScheduleProps) {
  const { toast } = useToast();

  // 표준화된 훅으로 데이터와 액션들 가져오기
  // 🆕 1원칙: 통합 store에서만 데이터 가져오기
  const airport = useSimulationStore((s) => s.context.airport);
  const date = useSimulationStore((s) => s.context.date);

  // 🆕 통합 Store 액션들 (airport, date 동기화용)
  const setUnifiedAirport = useSimulationStore((s) => s.setAirport);
  const setUnifiedDate = useSimulationStore((s) => s.setDate);
  const setFlightFilters = useSimulationStore((s) => s.setFlightFilters);
  const resetFlightData = useSimulationStore((s) => s.resetFlightData);
  const setAppliedFilterResult = useSimulationStore(
    (s) => s.setAppliedFilterResult
  );

  // 🆕 zustand에서 flight 데이터 존재 여부 확인
  const hasFlightData = useSimulationStore(
    (s) => s.flight.total_flights !== null
  );

  // Tab Reset 시스템 제거 - 단순화

  // 🚧 로컬 상태 제거 예정 - 통합 store 전환 중

  // UI 상태 관리 (최소화)
  const [loadError, setLoadError] = useState(false);
  const [loadingFlightSchedule, setLoadingFlightSchedule] = useState(false);
  const [isSomethingChanged, setIsSomethingChanged] = useState(false);

  // 🆕 airport/date는 Load 버튼 클릭 시에만 zustand에 저장
  // (실시간 동기화 제거)

  // 🆕 Apply Filter 응답 상태 관리
  const [applyFilterLoading, setApplyFilterLoading] = useState(false);
  const [applyFilterData, setApplyFilterData] =
    useState<ApplyFilterData | null>(null);
  const [applyFilterError, setApplyFilterError] = useState<string | null>(null);
  const [showConditions, setShowConditions] = useState(false);

  // 🆕 새로운 필터 시스템용 데이터 state
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null);

  // 터미널 표시 형태를 raw 값으로 변환하는 함수 (API 요청용)
  const getTerminalRawValue = useCallback((displayName: string) => {
    if (displayName === "Unknown") {
      return "unknown";
    }
    // "Terminal 1" → "1"
    const match = displayName.match(/Terminal\s+(.+)/);
    return match ? match[1] : displayName;
  }, []);

  // 🚧 buildConditions 제거 - 통합 store 전환 중

  // API에서 데이터를 불러온다.
  // isAirportOrDateChanged: true면 새로운 공항/날짜로 로드(빈 조건), false면 기존 데이터에 필터만 적용
  const loadFlightSchedule = useCallback(
    async (isAirportOrDateChanged: boolean = false) => {
      if (!simulationId) return;
      if (!airport) return;

      setLoadError(false);

      // API 요청 파라미터와 타임스탬프를 미리 준비 (스코프 밖에서 정의)
      const params = {
        airport,
        date,
        conditions: [], // 🚧 buildConditions 제거 - 통합 store 전환 중
      };
      const timestamp = new Date().toISOString();

      try {
        setLoadingFlightSchedule(true);
        setApiRequestLog({
          timestamp,
          request: params,
          response: null,
          status: "loading",
        });

        const { data } = await getFlightSchedules(simulationId, params);

        // API 응답 로그 업데이트 (timestamp 기준으로 새 객체 생성)
        setApiRequestLog({
          timestamp,
          request: params,
          response: data,
          status: "success",
        });

        // Available conditions 추출 - 실제 API 응답 구조에 맞춤

        // API 응답이 배열인지 객체인지 확인하고 처리
        const allAirlines: Array<AirlineInfo> = [];
        let typesData: {
          International: AirlineInfo[];
          Domestic: AirlineInfo[];
        } = { International: [], Domestic: [] };
        let terminalsData: { [terminalName: string]: AirlineInfo[] } = {};

        // Case 1: 응답이 직접 항공사 배열인 경우
        if (Array.isArray(data)) {
          data.forEach((airline: AirlineInfo) => {
            if (airline && airline.iata && airline.name) {
              allAirlines.push({ iata: airline.iata, name: airline.name });
            }
          });
        }
        // Case 2: 기존 구조 (types, terminals 등이 있는 경우)
        else if (data && typeof data === "object") {
          typesData = (
            data as {
              types?: { International: AirlineInfo[]; Domestic: AirlineInfo[] };
            }
          )?.types || {
            International: [],
            Domestic: [],
          };
          terminalsData =
            (data as { terminals?: { [terminalName: string]: AirlineInfo[] } })
              ?.terminals || {};

          // Types에서 항공사 정보 추출
          const typesAirlines = [
            ...Array.from(typesData.International || []),
            ...Array.from(typesData.Domestic || []),
          ];

          typesAirlines.forEach((airline: AirlineInfo) => {
            if (
              airline &&
              airline.iata &&
              airline.name &&
              !allAirlines.find(
                (a) => a.iata === airline.iata && a.name === airline.name
              )
            ) {
              allAirlines.push({ ...airline });
            }
          });

          // Terminals에서 항공사 정보 추출
          Object.values(terminalsData).forEach(
            (terminalAirlines: AirlineInfo[]) => {
              Array.from(terminalAirlines || []).forEach(
                (airline: AirlineInfo) => {
                  if (
                    airline &&
                    airline.iata &&
                    airline.name &&
                    !allAirlines.find(
                      (a) => a.iata === airline.iata && a.name === airline.name
                    )
                  ) {
                    allAirlines.push({ ...airline });
                  }
                }
              );
            }
          );
        }

        // 항공사 리스트 정렬 (IATA 코드 기준) - null 값 안전 처리
        allAirlines.sort((a, b) => {
          const aIata = a.iata || "";
          const bIata = b.iata || "";
          return aIata.localeCompare(bIata);
        });

        // 터미널 리스트 생성 (unknown 제외하고 정렬)
        const availableTerminals = Object.keys(terminalsData)
          .filter((terminal) => terminal !== "unknown")
          .sort((a, b) => {
            // raw 값("1", "2")을 숫자로 정렬
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            return a.localeCompare(b);
          });

        // 🚧 기존 조건 처리 로직 제거 - 통합 store 전환 중

        if (data?.chart_x_data && data?.chart_y_data) {
          // 차트 데이터를 안전하게 복사하고 처리
          const chartYDataCopy = JSON.parse(JSON.stringify(data.chart_y_data));

          for (const criteriaCur in chartYDataCopy) {
            const criteriaDataCur = chartYDataCopy[criteriaCur].sort(
              (a, b) => a.order - b.order
            );
            const acc_y = Array(criteriaDataCur[0]?.y?.length || 0).fill(0);

            for (const itemCur of criteriaDataCur) {
              itemCur.acc_y = Array(itemCur.y?.length || 0).fill(0);

              for (let i = 0; i < (itemCur.y?.length || 0); i++) {
                acc_y[i] += itemCur.y[i] || 0;
                itemCur.acc_y[i] = Number(acc_y[i]);
              }
            }
          }

          const newChartData = {
            total: data?.total,
            x: Array.from(data?.chart_x_data || []),
            data: chartYDataCopy,
          };
          // 🚧 setChartData 제거 - 통합 store 전환 중

          // 🚧 setIsCompleted 제거 - 통합 store 전환 중
        }
      } catch (error) {
        // API 에러 로그 업데이트 (timestamp와 request 정보 유지)
        setApiRequestLog({
          timestamp,
          request: params,
          response: null,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });

        setLoadError(true);
      } finally {
        setIsSomethingChanged(false);
        setLoadingFlightSchedule(false);
      }
    },
    [simulationId, airport, date, setApiRequestLog]
  );

  // 🚧 차트 관련 useEffect 제거 - 통합 store 전환 중

  // 데이터 로드 핸들러 - GET flight-filters로 변경
  const handleLoadData = useCallback(
    async (airport: string, date: string) => {
      if (!simulationId || !airport) return;

      // 🚧 조건 초기화 제거 - 통합 store 전환 중
      setShowConditions(false);

      // ✅ Apply Filter 결과 초기화 (기존 차트들 제거)
      setApplyFilterData(null);
      setApplyFilterError(null);
      // 🚧 setChartData 제거 - 통합 store 전환 중

      try {
        setLoadingFlightSchedule(true);
        setLoadError(false);

        // 🆕 기존 flight 데이터 완전 초기화 (Filter Conditions가 로딩 상태로 전환됨)
        resetFlightData();

        // 🆕 airport/date는 이미 FlightDataLoader에서 저장됨

        // ✅ Load 버튼 API 요청 로그 저장 (시작)
        const timestamp = new Date().toISOString();

        setApiRequestLog({
          timestamp,
          request: {
            method: "GET",
            endpoint: `/api/v1/simulations/${simulationId}/flight-filters`,
            params: { airport, date },
          },
          response: null,
          status: "loading",
        });

        // 🆕 GET flight-filters 호출 (URL 파라미터 방식)
        const { data } = await getFlightFilters(simulationId, airport, date);

        // ✅ Load 버튼 API 요청 로그 저장 (성공)
        setApiRequestLog({
          timestamp,
          request: {
            method: "GET",
            endpoint: `/api/v1/simulations/${simulationId}/flight-filters`,
            params: { airport, date },
          },
          response: data,
          status: "success",
        });

        // 🆕 새로운 필터 데이터 구조 처리
        if (data && data.filters) {
          setFiltersData(data); // 🆕 필터 데이터 저장

          // 🆕 통합 Store에도 저장
          setFlightFilters({
            total_flights: data.total_flights,
            airlines: data.airlines,
            filters: data.filters,
          });

          setShowConditions(true);

          // 🚧 setIsCompleted 제거 - 통합 store 전환 중
        }
      } catch (error: any) {
        // 🎯 503 에러에 대한 사용자 친화적 메시지
        let errorMessage = "Failed to load flight data";

        if (error?.response?.status === 503) {
          errorMessage =
            "Server is temporarily overloaded. Please try again in a moment.";
        } else if (
          error?.response?.status === 504 ||
          error?.code === "ECONNABORTED"
        ) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        }

        setLoadError(true);

        // ✅ Load 버튼 API 요청 로그 저장 (에러)
        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: {
            method: "GET",
            endpoint: `/api/v1/simulations/${simulationId}/flight-filters`,
            params: { airport, date },
          },
          response: null,
          status: "error",
          error: errorMessage,
        });
      } finally {
        setLoadingFlightSchedule(false);
      }
    },
    [simulationId, setApiRequestLog, resetFlightData, setFlightFilters]
  );

  // 🆕 새로운 Apply Filter 핸들러 (새 필터 시스템용) - 응답 반환 + 자동 저장
  const handleApplyFiltersNew = useCallback(
    async (
      type: string,
      conditions: Array<{ field: string; values: string[] }>
    ) => {
      // Store에서 현재 airport, date 가져오기
      const currentAirport = useSimulationStore.getState().context.airport;
      const currentDate = useSimulationStore.getState().context.date;

      if (!simulationId || !currentAirport) return null;

      const params = {
        airport: currentAirport,
        date: currentDate,
        type, // 🆕 1단계에서 선택한 mode 값
        conditions, // 🆕 새로운 조건 형식
      };

      try {
        // 🆕 먼저 appliedFilterResult를 초기상태로 리셋
        setAppliedFilterResult(null);

        // ✅ Apply Filter 전용 로딩 상태 사용 (Filter Conditions는 변화 없음)
        setApplyFilterLoading(true);
        setApplyFilterError(null);
        setApplyFilterData(null);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: null,
          status: "loading",
        });

        // 🆕 기존 POST flight-schedules 호출 (필터링된 실제 데이터)
        const { data } = await getFlightSchedules(simulationId, params);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: data,
          status: "success",
        });

        // 🆕 차트 데이터 처리는 일단 제거 (응답 확인이 우선)
        // if (data?.chart_x_data && data?.chart_y_data) { ... }

        // ✅ Apply Filter 응답 상태에 저장
        // 동적으로 모든 카테고리 처리
        const processedChartData: Record<string, any[]> = {};
        if (data.chart_y_data) {
          Object.keys(data.chart_y_data).forEach(category => {
            processedChartData[category] = (data.chart_y_data[category] || []).map((item: any) => ({
              ...item,
              acc_y: item.acc_y || [],
            }));
          });
        }

        setApplyFilterData({
          total: data.total,
          chart_x_data: data.chart_x_data,
          chart_y_data: processedChartData,
          appliedAt: new Date().toISOString(),
        });

        // 🆕 Apply Filter 응답을 zustand에 저장 + parquet_metadata 추가
        setAppliedFilterResult({
          total: data.total,
          chart_x_data: data.chart_x_data,
          chart_y_data: processedChartData,
          appliedAt: new Date().toISOString(),
          // Use actual parquet_metadata from data, or empty array if not available
          parquet_metadata: (data as any).parquet_metadata || [],
        });

        // 🎯 selectedConditions는 Filter Conditions UI 전용이므로 업데이트하지 않음
        // 실제 결과는 appliedFilterResult에만 저장하여 차트에서 사용
        // Filter Conditions 컴포넌트는 변화 없이 유지됨

        // 🆕 parquet_metadata는 하드코딩된 컬럼으로 대체됨 (제거됨)

        // S3 저장은 Save 버튼을 통해서만 수행됨

        return data;
      } catch (error: any) {
        // 🎯 503 에러에 대한 사용자 친화적 메시지
        let errorMessage = "Unknown error";

        if (error?.response?.status === 503) {
          errorMessage =
            "Server is temporarily overloaded. The request contains too much data to process. Try applying more specific filters or try again in a moment.";
        } else if (error?.response?.status === 504) {
          errorMessage =
            "Request timed out. Please try with more specific filter conditions.";
        } else if (error?.code === "ECONNABORTED") {
          errorMessage =
            "Request timed out. Please try with more specific filter conditions.";
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // ✅ Apply Filter 에러 상태에 저장
        setApplyFilterError(errorMessage);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: null,
          status: "error",
          error: errorMessage,
        });

        throw error;
      } finally {
        // ✅ Apply Filter 전용 로딩 완료
        setApplyFilterLoading(false);
      }
    },
    [simulationId, setApiRequestLog, setAppliedFilterResult, toast]
  );

  // ✅ Hook 호출 후 조건부 렌더링 (Rules of Hooks 준수)
  if (!visible) {
    return null;
  }

  return (
    <div className="space-y-6 pt-8">
      {/* 하나의 카드로 통합된 Flight Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="rounded-lg bg-primary/10 p-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-default-900">Flight Schedule</div>
              <p className="text-sm font-normal text-default-500">Load and filter flight schedule data</p>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Load Data Section */}
        <CardContent className="space-y-6">
          <div>
            <FlightDataLoader
              loadingFlightSchedule={loadingFlightSchedule}
              setIsSomethingChanged={setIsSomethingChanged}
              onLoadData={handleLoadData}
              isEmbedded={true}
            />
          </div>

          {/* Filter Conditions Section - zustand 데이터 존재할 때만 표시 */}
          {hasFlightData && !loadingFlightSchedule && (
            <FlightFilterConditions
              loading={false}
              onApplyFilter={handleApplyFiltersNew}
              isEmbedded={true}
            />
          )}
        </CardContent>
      </Card>

      {/* ✨ 공통 로딩 상태 기반 조건부 렌더링 */}
      {loadingFlightSchedule || applyFilterLoading ? (
        <div className="mt-6">
          <SimulationLoading minHeight="min-h-[400px]" size={70} />
        </div>
      ) : (
        <>
          {/* Apply Filter 결과 표시 - 성공 시 차트, 에러 시 에러 메시지 */}
          {/* 🎯 Zustand에서 appliedFilterResult가 있으면 자동으로 차트 표시 */}
          <FlightResultChart />

          {/* TabFlightScheduleResponsePreview 제거 - 불필요한 컴포넌트 */}
        </>
      )}

    </div>
  );
}

// React.memo로 컴포넌트 최적화 (props가 동일하면 리렌더링 방지)
export default React.memo(TabFlightSchedule);
