"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon, ChevronDown, Database, Filter, Plane, Plus, Search, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  APIRequestLog,
} from "@/types/simulationTypes";
import {
  getFlightFilters,
  getFlightSchedules,
} from "@/services/simulationService";
import SimulationLoading from "../../../_components/SimulationLoading";
import { useSimulationStore } from "../../_stores";
import FlightFilterConditions from "./FlightFilterConditions";
import FlightDataLoader from "./FlightDataLoader";
import FlightResultChart from "./FlightResultChart";
import Spinner from "@/components/ui/Spinner";
import {
  type SelectedFilter,
  convertFilterToApiConditions,
} from "./flight-utils";
import airportFlat from "../../_json/airport_flat.json";

// ==================== Types ====================

interface TabFlightScheduleProps {
  simulationId: string;
  visible: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

interface TabFiltersData {
  total_flights: number;
  airlines: Record<string, string>;
  filters: Record<string, any>;
}

interface AirportTab {
  id: string;
  airport: string;
  date: string;
  filtersData: TabFiltersData | null;
  selectedFilter: SelectedFilter;
  loading: boolean;
  estimatedFiltered: number;
  totalFlightsForMode: number;
}

// ==================== Component ====================

function TabFlightSchedule({
  simulationId,
  visible,
  apiRequestLog,
  setApiRequestLog,
}: TabFlightScheduleProps) {
  const { toast } = useToast();

  // Zustand store
  const storeAirport = useSimulationStore((s) => s.context.airport);
  const storeDate = useSimulationStore((s) => s.context.date);
  const storeTotalFlights = useSimulationStore((s) => s.flight.total_flights);
  const setUnifiedAirport = useSimulationStore((s) => s.setAirport);
  const setUnifiedDate = useSimulationStore((s) => s.setDate);
  const setFlightFilters = useSimulationStore((s) => s.setFlightFilters);
  const resetFlightData = useSimulationStore((s) => s.resetFlightData);
  const setAppliedFilterResult = useSimulationStore((s) => s.setAppliedFilterResult);
  const setSelectedConditions = useSimulationStore((s) => s.setSelectedConditions);
  const resetPassenger = useSimulationStore((s) => s.resetPassenger);
  const resetProcessFlow = useSimulationStore((s) => s.resetProcessFlow);

  // ==================== Tab State ====================

  const hasInitializedRef = useRef(false);

  const [airportTabs, setAirportTabs] = useState<AirportTab[]>(() => [{
    id: "tab-1",
    airport: storeAirport || "",
    date: storeDate || dayjs().format("YYYY-MM-DD"),
    filtersData: null,
    selectedFilter: { mode: "departure", categories: {} },
    loading: false,
    estimatedFiltered: 0,
    totalFlightsForMode: 0,
  }]);

  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [nextTabNum, setNextTabNum] = useState(2);
  const [applyFilterLoading, setApplyFilterLoading] = useState(false);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAirport, setModalAirport] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalAirportPopoverOpen, setModalAirportPopoverOpen] = useState(false);
  const [modalCustomInput, setModalCustomInput] = useState("");
  const [modalDatePopoverOpen, setModalDatePopoverOpen] = useState(false);

  const isMultiTab = airportTabs.length > 1;
  const allTabsLoaded = airportTabs.every((t) => t.filtersData !== null);
  const anyTabLoaded = airportTabs.some((t) => t.filtersData !== null);
  const anyTabLoading = airportTabs.some((t) => t.loading);

  const loadedTabs = useMemo(
    () => airportTabs.filter((t) => t.filtersData !== null),
    [airportTabs]
  );

  // Restore tab 1 from Zustand when store is hydrated (S3 restore)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!storeTotalFlights) return;

    const state = useSimulationStore.getState();
    const flight = state.flight;

    setAirportTabs((prev) => {
      const tab1 = prev.find((t) => t.id === "tab-1");
      if (!tab1 || tab1.filtersData) return prev;

      let restoredFilter: SelectedFilter = { mode: "departure", categories: {} };
      if (flight.selectedConditions?.originalLocalState) {
        restoredFilter = {
          mode: flight.selectedConditions.type,
          categories: flight.selectedConditions.originalLocalState as Record<string, any>,
        };
      } else if (flight.selectedConditions?.conditions) {
        const cats: Record<string, any> = {};
        flight.selectedConditions.conditions.forEach((c) => {
          cats[c.field] = c.values;
        });
        restoredFilter = { mode: flight.selectedConditions.type, categories: cats };
      }

      hasInitializedRef.current = true;

      return prev.map((t) =>
        t.id === "tab-1"
          ? {
              ...t,
              airport: state.context.airport,
              date: state.context.date,
              filtersData: {
                total_flights: storeTotalFlights,
                airlines: flight.airlines || {},
                filters: flight.filters || {},
              },
              selectedFilter: restoredFilter,
              loading: false,
              estimatedFiltered: flight.selectedConditions?.expected_flights?.selected || storeTotalFlights,
              totalFlightsForMode: flight.selectedConditions?.expected_flights?.total || storeTotalFlights,
            }
          : t
      );
    });
  }, [storeTotalFlights]);

  // Ensure active tab ID is always valid
  useEffect(() => {
    if (!airportTabs.find((t) => t.id === activeTabId) && airportTabs.length > 0) {
      setActiveTabId(airportTabs[0].id);
    }
  }, [airportTabs, activeTabId]);

  // ==================== Tab Management ====================

  const addTab = useCallback(() => {
    const newId = `tab-${nextTabNum}`;
    setAirportTabs((prev) => [
      ...prev,
      {
        id: newId,
        airport: "",
        date: dayjs().format("YYYY-MM-DD"),
        filtersData: null,
        selectedFilter: { mode: "departure", categories: {} },
        loading: false,
        estimatedFiltered: 0,
        totalFlightsForMode: 0,
      },
    ]);
    setActiveTabId(newId);
    setNextTabNum((n) => n + 1);
  }, [nextTabNum]);

  const removeTab = useCallback((tabId: string) => {
    setAirportTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      return filtered.length > 0 ? filtered : prev;
    });
  }, []);

  // ==================== Per-Tab Update Helpers ====================

  const updateTab = useCallback((tabId: string, updates: Partial<AirportTab>) => {
    setAirportTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, ...updates } : t))
    );
  }, []);

  const handleTabAirportChange = useCallback(
    (tabId: string, airport: string) => updateTab(tabId, { airport }),
    [updateTab]
  );

  const handleTabDateChange = useCallback(
    (tabId: string, date: string) => updateTab(tabId, { date }),
    [updateTab]
  );

  const handleTabFilterChange = useCallback(
    (tabId: string, filter: SelectedFilter) => updateTab(tabId, { selectedFilter: filter }),
    [updateTab]
  );

  const handleTabEstimatedChange = useCallback(
    (tabId: string, estimated: number, total: number) =>
      updateTab(tabId, { estimatedFiltered: estimated, totalFlightsForMode: total }),
    [updateTab]
  );

  // ==================== Load Data Per Tab ====================

  const handleLoadDataForTab = useCallback(
    async (tabId: string, airport: string, date: string) => {
      if (!simulationId || !airport) return;

      updateTab(tabId, { loading: true, airport, date });

      const timestamp = new Date().toISOString();
      setApiRequestLog({
        timestamp,
        request: { method: "GET", endpoint: `/api/v1/simulations/${simulationId}/flight-filters`, params: { airport, date } },
        response: null,
        status: "loading",
      });

      try {
        const { data } = await getFlightFilters(simulationId, airport, date);

        setApiRequestLog({
          timestamp,
          request: { method: "GET", endpoint: `/api/v1/simulations/${simulationId}/flight-filters`, params: { airport, date } },
          response: data,
          status: "success",
        });

        if (data && data.filters) {
          const tabData: TabFiltersData = {
            total_flights: data.total_flights,
            airlines: data.airlines,
            filters: data.filters,
          };

          const defaultTotal = data.filters.departure?.total_flights || 0;

          updateTab(tabId, {
            filtersData: tabData,
            loading: false,
            selectedFilter: { mode: "departure", categories: {} },
            estimatedFiltered: defaultTotal,
            totalFlightsForMode: defaultTotal,
          });

          if (!isMultiTab) {
            resetFlightData();
            setUnifiedAirport(airport);
            setUnifiedDate(date);
            setFlightFilters(tabData);
          }
        } else {
          updateTab(tabId, { loading: false });
        }
      } catch (error: any) {
        let errorMessage = "Failed to load flight data";
        if (error?.response?.status === 503) errorMessage = "Server is temporarily overloaded. Please try again in a moment.";
        else if (error?.response?.status === 504 || error?.code === "ECONNABORTED") errorMessage = "Request timed out.";

        updateTab(tabId, { loading: false });

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: { method: "GET", endpoint: `/api/v1/simulations/${simulationId}/flight-filters`, params: { airport, date } },
          response: null,
          status: "error",
          error: errorMessage,
        });

        toast({ title: "Load Failed", description: errorMessage, variant: "destructive" });
      }
    },
    [simulationId, isMultiTab, setApiRequestLog, updateTab, resetFlightData, setUnifiedAirport, setUnifiedDate, setFlightFilters, toast]
  );

  // ==================== Apply Filter (Single Tab) ====================

  const handleSingleTabApplyFilter = useCallback(
    async (type: string, conditions: Array<{ field: string; values: string[] }>) => {
      const tab = airportTabs.find((t) => t.id === activeTabId);
      if (!simulationId || !tab?.airport) return null;

      resetPassenger();
      resetProcessFlow();

      setSelectedConditions({
        type: type as "departure" | "arrival",
        conditions,
        expected_flights: { selected: tab.estimatedFiltered, total: tab.totalFlightsForMode },
        originalLocalState: tab.selectedFilter.categories,
      });

      const params = { airport: tab.airport, date: tab.date, type, conditions };

      try {
        setAppliedFilterResult(null);
        setApplyFilterLoading(true);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: null,
          status: "loading",
        });

        const { data } = await getFlightSchedules(simulationId, params);

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: data,
          status: "success",
        });

        const processedChartData: Record<string, any[]> = {};
        if (data.chart_y_data) {
          Object.keys(data.chart_y_data).forEach((category) => {
            processedChartData[category] = (data.chart_y_data[category] || []).map((item: any) => ({
              ...item,
              acc_y: item.acc_y || [],
            }));
          });
        }

        setAppliedFilterResult({
          total: data.total,
          chart_x_data: data.chart_x_data,
          chart_y_data: processedChartData,
          appliedAt: new Date().toISOString(),
          parquet_metadata: (data as any).parquet_metadata || [],
        });

        toast({
          title: "Filter Applied",
          description: `Successfully filtered ${(data.total || 0).toLocaleString()} flights`,
          variant: "default",
        });

        return data;
      } catch (error: any) {
        let errorMessage = "Unknown error";
        if (error?.response?.status === 503) errorMessage = "Server is temporarily overloaded.";
        else if (error?.response?.status === 504 || error?.code === "ECONNABORTED") errorMessage = "Request timed out.";
        else if (error?.response?.data?.detail) errorMessage = error.response.data.detail;
        else if (error?.message) errorMessage = error.message;

        setApiRequestLog({
          timestamp: new Date().toISOString(),
          request: params,
          response: null,
          status: "error",
          error: errorMessage,
        });

        throw error;
      } finally {
        setApplyFilterLoading(false);
      }
    },
    [simulationId, airportTabs, activeTabId, resetPassenger, resetProcessFlow, setSelectedConditions, setAppliedFilterResult, setApiRequestLog, toast]
  );

  // ==================== Aggregated Summary ====================

  const aggregatedSummary = useMemo(() => {
    let estimated = 0;
    let total = 0;
    let loadedCount = 0;
    airportTabs.forEach((tab) => {
      if (tab.filtersData) {
        estimated += tab.estimatedFiltered;
        total += tab.totalFlightsForMode;
        loadedCount++;
      }
    });
    return { estimated, total, loadedCount };
  }, [airportTabs]);

  // ==================== Modal: Open & Confirm ====================

  const openConfirmModal = useCallback(() => {
    const loaded = airportTabs.filter((t) => t.filtersData);
    if (loaded.length === 0) return;

    setModalAirport(loaded[0].airport);
    setModalDate(loaded[0].date);
    setShowConfirmModal(true);
  }, [airportTabs]);

  const isModalValid = useMemo(() => {
    return modalAirport.trim().length > 0 && modalDate.length > 0;
  }, [modalAirport, modalDate]);

  // ==================== Apply Filter (Multi-Tab Global) ====================

  const executeGlobalApplyFilter = useCallback(async (representativeAirport: string, representativeDate: string) => {
    const loaded = airportTabs.filter((t) => t.filtersData);
    if (loaded.length === 0) return;

    setApplyFilterLoading(true);

    try {
      resetPassenger();
      resetProcessFlow();

      setUnifiedAirport(representativeAirport);
      setUnifiedDate(representativeDate);

      const allResults = await Promise.all(
        loaded.map(async (tab) => {
          const conditions = convertFilterToApiConditions(tab.selectedFilter, tab.filtersData);
          const params = { airport: tab.airport, date: tab.date, type: tab.selectedFilter.mode, conditions };
          const { data } = await getFlightSchedules(simulationId, params);
          return data;
        })
      );

      let totalFlights = 0;
      const mergedParquetMetadata: any[] = [];
      let mergedChartXData: string[] = [];
      const mergedChartYData: Record<string, any[]> = {};

      allResults.forEach((data) => {
        totalFlights += data.total || 0;
        if (data.parquet_metadata) {
          if (Array.isArray(data.parquet_metadata)) {
            mergedParquetMetadata.push(...data.parquet_metadata);
          } else {
            mergedParquetMetadata.push(data.parquet_metadata);
          }
        }
        if (data.chart_x_data && data.chart_x_data.length > mergedChartXData.length) {
          mergedChartXData = data.chart_x_data;
        }
        if (data.chart_y_data) {
          Object.keys(data.chart_y_data).forEach((category) => {
            if (!mergedChartYData[category]) mergedChartYData[category] = [];
            mergedChartYData[category].push(
              ...(data.chart_y_data[category] || []).map((item: any) => ({
                ...item,
                acc_y: item.acc_y || [],
              }))
            );
          });
        }
      });

      const combinedFiltersData = {
        total_flights: totalFlights,
        airlines: loaded.reduce((acc, tab) => ({ ...acc, ...(tab.filtersData?.airlines || {}) }), {} as Record<string, string>),
        filters: loaded[0].filtersData?.filters || {},
      };
      setFlightFilters(combinedFiltersData);

      setAppliedFilterResult({
        total: totalFlights,
        chart_x_data: mergedChartXData,
        chart_y_data: mergedChartYData,
        appliedAt: new Date().toISOString(),
        parquet_metadata: mergedParquetMetadata,
      });

      const allConditions = loaded.flatMap((tab) =>
        convertFilterToApiConditions(tab.selectedFilter, tab.filtersData)
      );
      setSelectedConditions({
        type: loaded[0].selectedFilter.mode as "departure" | "arrival",
        conditions: allConditions,
        expected_flights: { selected: aggregatedSummary.estimated, total: aggregatedSummary.total },
      });

      toast({
        title: "Filter Applied",
        description: `Successfully filtered ${totalFlights.toLocaleString()} flights across ${loaded.length} airports`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Filter Failed",
        description: error instanceof Error ? error.message : "Failed to apply filters",
        variant: "destructive",
      });
    } finally {
      setApplyFilterLoading(false);
    }
  }, [
    simulationId, airportTabs, aggregatedSummary,
    resetPassenger, resetProcessFlow, setUnifiedAirport, setUnifiedDate,
    setFlightFilters, setAppliedFilterResult, setSelectedConditions, toast,
  ]);

  const handleModalConfirm = useCallback(() => {
    const airport = modalAirport.trim().toUpperCase();
    if (!airport || !modalDate) return;
    setShowConfirmModal(false);
    executeGlobalApplyFilter(airport, modalDate);
  }, [modalAirport, modalDate, executeGlobalApplyFilter]);

  // ==================== Clear All ====================

  const handleGlobalClearAll = useCallback(() => {
    setAirportTabs((prev) =>
      prev.map((t) => ({
        ...t,
        selectedFilter: { mode: "departure" as const, categories: {} },
        estimatedFiltered: t.filtersData?.filters?.departure?.total_flights || 0,
        totalFlightsForMode: t.filtersData?.filters?.departure?.total_flights || 0,
      }))
    );
    setSelectedConditions({ type: "departure", conditions: [], originalLocalState: {} });
  }, [setSelectedConditions]);

  // ==================== Render ====================

  if (!visible) return null;

  // Unique airports/dates from loaded tabs (for modal selectors)
  const uniqueAirports = [...new Set(loadedTabs.map((t) => t.airport))];
  const uniqueDates = [...new Set(loadedTabs.map((t) => t.date))];

  return (
    <div className="space-y-6 pt-8">
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

        <CardContent className="space-y-6">
          {/* Airport Tabs Bar */}
          <div className="flex items-center gap-1 border-b">
            {airportTabs.map((tab, index) => {
              const isActive = tab.id === activeTabId;
              const label = tab.airport
                ? `${tab.airport} (${dayjs(tab.date).format("MM/DD")})`
                : `Airport ${index + 1}`;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
                    ${isActive
                      ? "text-primary border-b-2 border-primary -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {tab.loading && <Spinner size={12} className="shrink-0" />}
                  {!tab.loading && tab.filtersData && (
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[160px]">{label}</span>
                  {isMultiTab && (
                    <X
                      className="h-3 w-3 text-muted-foreground hover:text-destructive ml-1 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTab(tab.id);
                      }}
                    />
                  )}
                </button>
              );
            })}
            <button
              onClick={addTab}
              disabled={!allTabsLoaded}
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
                allTabsLoaded
                  ? "text-muted-foreground hover:text-primary cursor-pointer"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tab Contents */}
          {airportTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div key={tab.id} className={isActive ? "" : "hidden"}>
                <FlightDataLoader
                  controlledAirport={tab.airport}
                  controlledDate={tab.date}
                  onAirportChange={(a) => handleTabAirportChange(tab.id, a)}
                  onDateChange={(d) => handleTabDateChange(tab.id, d)}
                  skipStoreSync={isMultiTab}
                  loadingFlightSchedule={tab.loading}
                  setIsSomethingChanged={() => {}}
                  onLoadData={(a, d) => handleLoadDataForTab(tab.id, a, d)}
                  isEmbedded={true}
                />

                {tab.filtersData && !tab.loading && (
                  <div className="mt-6">
                    <FlightFilterConditions
                      key={`filter-${tab.id}`}
                      controlled={true}
                      overrideFlightData={tab.filtersData}
                      initialSelectedFilter={tab.selectedFilter}
                      onFilterChange={(f) => handleTabFilterChange(tab.id, f)}
                      onEstimatedFlightsChange={(est, tot) => handleTabEstimatedChange(tab.id, est, tot)}
                      showActions={!isMultiTab}
                      loading={false}
                      onApplyFilter={handleSingleTabApplyFilter}
                      isEmbedded={true}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Aggregated Selection Summary (multi-tab only) */}
          {isMultiTab && anyTabLoaded && (
            <>
              <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-full bg-primary/20 p-1">
                        <Filter className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-primary">Selection Summary</span>
                      <Badge variant="secondary" className="text-xs">
                        {aggregatedSummary.loadedCount} airport{aggregatedSummary.loadedCount > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {loadedTabs.map((tab) => (
                        <div key={tab.id} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{tab.airport}</span>
                          <span>
                            {tab.estimatedFiltered.toLocaleString()} / {tab.totalFlightsForMode.toLocaleString()} flights
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Combined Flights</div>
                    <div className="text-lg font-bold text-primary">
                      {aggregatedSummary.estimated.toLocaleString()} / {aggregatedSummary.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div></div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGlobalClearAll}>
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={openConfirmModal}
                    disabled={applyFilterLoading || !anyTabLoaded}
                    className="overflow-hidden"
                  >
                    <span className="flex items-center">
                      {applyFilterLoading ? (
                        <>
                          <Spinner size={16} className="mr-2 shrink-0" />
                          <span className="truncate">Filtering...</span>
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">Filter All Airports</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Loading / Chart */}
      {anyTabLoading || applyFilterLoading ? (
        <div className="mt-6">
          <SimulationLoading minHeight="min-h-[400px]" size={70} />
        </div>
      ) : (
        <FlightResultChart />
      )}

      {/* ==================== Confirm Modal ==================== */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1 text-left">
                <DialogTitle>Representative Airport & Date</DialogTitle>
                <DialogDescription>
                  Select the representative values for downstream tabs.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Airport */}
            <div className="grid gap-2">
              <Label>Airport</Label>
              <Popover open={modalAirportPopoverOpen} onOpenChange={(open) => {
                setModalAirportPopoverOpen(open);
                if (open) setModalCustomInput("");
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-primary" />
                      <span className={modalAirport ? "font-semibold" : "text-muted-foreground"}>
                        {modalAirport
                          ? (() => {
                              const info = airportFlat.find((a) => a.iata === modalAirport);
                              return info ? `${info.iata} (${info.city}, ${info.country})` : modalAirport;
                            })()
                          : "Select airport..."}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="py-1">
                    {uniqueAirports.map((code) => {
                      const info = airportFlat.find((a) => a.iata === code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setModalAirport(code);
                            setModalAirportPopoverOpen(false);
                          }}
                          className={`w-full flex items-center justify-start gap-1.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                            modalAirport === code ? "bg-primary/5 text-primary" : ""
                          }`}
                        >
                          <span className="font-semibold">{code}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground truncate">
                              ({info.city}, {info.country})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t px-3 py-2">
                    <Input
                      value={modalCustomInput}
                      onChange={(e) => setModalCustomInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && modalCustomInput.trim().length > 0) {
                          setModalAirport(modalCustomInput.trim().toUpperCase());
                          setModalAirportPopoverOpen(false);
                          setModalCustomInput("");
                        }
                      }}
                      placeholder="Custom code (Enter)"
                      maxLength={10}
                      className="h-8 text-sm"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover open={modalDatePopoverOpen} onOpenChange={setModalDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {modalDate ? dayjs(modalDate).format("MMM DD, YYYY") : "Select date..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {uniqueDates.length > 0 && (
                    <div className="border-b p-2 flex flex-wrap gap-1.5">
                      {uniqueDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setModalDate(d);
                            setModalDatePopoverOpen(false);
                          }}
                          className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                            modalDate === d
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          {dayjs(d).format("MMM DD, YYYY")}
                        </button>
                      ))}
                    </div>
                  )}
                  <Calendar
                    mode="single"
                    selected={modalDate ? dayjs(modalDate).toDate() : undefined}
                    defaultMonth={modalDate ? dayjs(modalDate).toDate() : undefined}
                    onSelect={(selected) => {
                      if (selected) {
                        setModalDate(dayjs(selected).format("YYYY-MM-DD"));
                        setModalDatePopoverOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground shrink-0">Saved as:</span>
            <span className="font-semibold text-primary">{modalAirport.trim().toUpperCase() || "—"}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{modalDate ? dayjs(modalDate).format("MMM DD, YYYY") : "—"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{aggregatedSummary.estimated.toLocaleString()} / {aggregatedSummary.total.toLocaleString()} flights from {aggregatedSummary.loadedCount} airports</span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleModalConfirm} disabled={!isModalValid}>
              <Search className="mr-2 h-4 w-4" />
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default React.memo(TabFlightSchedule);
