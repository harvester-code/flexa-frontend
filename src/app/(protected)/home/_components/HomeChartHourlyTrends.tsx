import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight, Circle, Check } from 'lucide-react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import { Checkbox } from '@/components/ui/Checkbox';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { cn } from '@/lib/utils';
import { capitalizeFirst } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';
import TheDropdownMenu from './TheDropdownMenu';
import HomeFacilityHeatmap from './HomeFacilityHeatmap';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });

const CHART_OPTION_COLORS: Record<string, string> = {
  inflow: '#06b6d4',     // cyan-500
  outflow: '#10b981',    // emerald-500
  queue_length: '#f59e0b', // amber-500
  waiting_time: '#f43f5e', // rose-500
};

const CHART_OPTIONS: Option[] = [
  { label: 'Inflow', value: 'inflow', color: CHART_OPTION_COLORS.inflow },
  { label: 'Outflow', value: 'outflow', color: CHART_OPTION_COLORS.outflow },
  { label: 'Queue Pax', value: 'queue_length', color: CHART_OPTION_COLORS.queue_length },
  { label: 'Wait Time', value: 'waiting_time', color: CHART_OPTION_COLORS.waiting_time },
];

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const sanitizeNumericSeries = (series: unknown, expectedLength: number): number[] | undefined => {
  if (!Array.isArray(series) || expectedLength <= 0) return undefined;

  const sanitized = (series as unknown[]).map((value) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  });

  if (sanitized.length === expectedLength) {
    return sanitized;
  }

  if (sanitized.length < expectedLength) {
    return [...sanitized, ...Array(expectedLength - sanitized.length).fill(0)];
  }

  return sanitized.slice(0, expectedLength);
};

interface HomeChartHourlyTrendsProps {
  scenario: ScenarioData | null;
  data?: any; // 배치 API에서 받은 flow_chart 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeChartHourlyTrends({ scenario, data, isLoading: propIsLoading }: HomeChartHourlyTrendsProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const hourlyTrendsData = data;
  const isFlowChartLoading = propIsLoading || false;
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [chartLayout, setChartLayout] = useState<Partial<Plotly.Layout>>({
    margin: { l: 60, r: 60, b: 60, t: 24 },
    showlegend: false,
  });

  const convertSecondsToMinutesInt = (data: Plotly.Data): Plotly.Data => ({
    ...data,
    y: Array.isArray((data as any).y)
      ? (data as any).y.map((v: any) => {
          const num = Number(v);
          return isNaN(num) ? null : Math.floor(num / 60);
        })
      : (data as any).y,
  });
  const getYAxisTitle = (optionValue: string) => (optionValue === 'waiting_time' ? '(min)' : '(pax)');

  const FACILITY_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData) return [];
    return Object.keys(hourlyTrendsData)
      .filter((key) => key !== 'times')
      .map((key) => {
        const facilityData = hourlyTrendsData[key];
        const dataSource = facilityData?.data || facilityData;
        const facilities = facilityData?.facilities || [];

        // 총 처리 인원 계산 (facilities 리스트에 있는 시설들의 inflow만 합산)
        let totalThroughput = 0;
        if (dataSource && facilities.length > 0) {
          facilities.forEach((facilityName: string) => {
            if (facilityName === 'Skip') return; // Skip 제외
            const facilityZoneData = dataSource[facilityName];
            if (facilityZoneData?.inflow && Array.isArray(facilityZoneData.inflow)) {
              totalThroughput += facilityZoneData.inflow.reduce((sum: number, val: number) => sum + (val || 0), 0);
            }
          });
        }

        return {
          label: capitalizeFirst(key.replace('_', ' ')),
          value: key,
          throughput: totalThroughput,
        };
      });
  }, [hourlyTrendsData]);

  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  useEffect(() => {
    if (FACILITY_OPTIONS.length > 0) {
      // selectedFacilityValue가 비어있거나 현재 옵션에 없으면 첫 번째 옵션 선택
      const isValidSelection = selectedFacilityValue && FACILITY_OPTIONS.some(opt => opt.value === selectedFacilityValue);
      if (!isValidSelection) {
        setSelectedFacilityValue(FACILITY_OPTIONS[0].value);
      }
    }
  }, [FACILITY_OPTIONS]);

  const ZONE_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData || !selectedFacilityValue) return [];
    const facilityData = hourlyTrendsData[selectedFacilityValue];
    if (!facilityData) return [];

    // 새로운 구조 처리 - data 속성이 있으면 그 안의 키를 사용
    const dataSource = facilityData.data || facilityData;

    return Object.keys(dataSource)
      .filter(key => key !== 'process_name' && key !== 'facilities') // 메타 정보 제외
      .map((key) => ({
        label: key === 'all_zones' ? 'All Zones' : capitalizeFirst(key),
        value: key,
      }));
  }, [hourlyTrendsData, selectedFacilityValue]);

  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isZonePanelOpen, setIsZonePanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedAirlines, setSelectedAirlines] = useState<string[]>(['all']);
  const [isAirlinePanelOpen, setIsAirlinePanelOpen] = useState(false);
  const airlineDropdownRef = useRef<HTMLDivElement>(null);

  // 항공사 목록 추출
  const AIRLINE_OPTIONS = useMemo(() => {
    if (!hourlyTrendsData || !selectedFacilityValue) return [];

    const facilityData = hourlyTrendsData[selectedFacilityValue];
    const dataSource = facilityData?.data || facilityData;
    if (!dataSource) return [];

    // 항공사 이름 매핑 가져오기
    const airlineNames = facilityData?.airline_names || {};

    // 모든 zone의 airlines 수집
    const airlinesSet = new Set<string>();
    Object.values(dataSource).forEach((zoneData: any) => {
      if (zoneData.airlines) {
        Object.keys(zoneData.airlines).forEach(airlineCode => {
          airlinesSet.add(airlineCode);
        });
      }
    });

    const airlines = Array.from(airlinesSet).sort();

    return [
      { label: 'All Airlines', value: 'all' },
      ...airlines.map(code => ({
        label: airlineNames[code] ? `${code} | ${airlineNames[code]}` : code,
        value: code
      }))
    ];
  }, [hourlyTrendsData, selectedFacilityValue]);

  useEffect(() => {
    if (ZONE_OPTIONS.length > 0) {
      // 항상 All Zones를 첫 선택으로 설정
      const allZonesOption = ZONE_OPTIONS.find(opt => opt.value === 'all_zones');
      if (allZonesOption) {
        setSelectedZones(['all_zones']);
      } else {
        // all_zones가 없으면 첫 번째 옵션 선택
        setSelectedZones([ZONE_OPTIONS[0].value]);
      }
    }
  }, [ZONE_OPTIONS]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsZonePanelOpen(false);
      }
      if (airlineDropdownRef.current && !airlineDropdownRef.current.contains(event.target as Node)) {
        setIsAirlinePanelOpen(false);
      }
    };

    if (isZonePanelOpen || isAirlinePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isZonePanelOpen, isAirlinePanelOpen]);

  const [chartOption1, setChartOption1] = useState([0]);
  const handleChartOption1 = (buttonIndex: number) => {
    setChartOption1((prevData) => {
      if (prevData.includes(buttonIndex)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== buttonIndex);
      }
      if (prevData.length >= 2) {
        return [...prevData.slice(1), buttonIndex];
      }
      return [...prevData, buttonIndex];
    });
  };

  const toggleZone = (zoneValue: string) => {
    setSelectedZones((prev) => {
      // all_zones 선택 시 모든 개별 zone 해제
      if (zoneValue === 'all_zones') {
        return ['all_zones'];
      }

      // 개별 zone 선택 시 all_zones 해제하고 토글
      const withoutAllZones = prev.filter(z => z !== 'all_zones');
      if (withoutAllZones.includes(zoneValue)) {
        // 최소 1개는 선택되어야 함
        const newSelection = withoutAllZones.filter(z => z !== zoneValue);
        return newSelection.length > 0 ? newSelection : ['all_zones'];
      } else {
        return [...withoutAllZones, zoneValue];
      }
    });
  };

  const toggleAirline = (airlineValue: string) => {
    setSelectedAirlines((prev) => {
      // all 선택 시 모든 개별 airline 해제
      if (airlineValue === 'all') {
        return ['all'];
      }

      // 개별 airline 선택 시 all 해제하고 토글
      const withoutAll = prev.filter(a => a !== 'all');
      if (withoutAll.includes(airlineValue)) {
        // 최소 1개는 선택되어야 함
        const newSelection = withoutAll.filter(a => a !== airlineValue);
        return newSelection.length > 0 ? newSelection : ['all'];
      } else {
        return [...withoutAll, airlineValue];
      }
    });
  };

  useEffect(() => {
    if (!hourlyTrendsData || !selectedFacilityValue || selectedZones.length === 0) return;

    const allTimes = Array.isArray(hourlyTrendsData.times) ? hourlyTrendsData.times : [];

    // 자정(00:00) 포함, 그 이후 데이터 제거 - 당일까지만 표시
    const times = allTimes.filter((timeStr, idx) => {
      if (idx === 0) return true; // 첫 시간은 무조건 포함

      const currentTime = new Date(timeStr);
      const prevTime = new Date(allTimes[idx - 1]);

      // 00:00은 포함, 그 이후(00:15 등)부터 제외
      if (currentTime.getHours() < prevTime.getHours()) {
        // 00:00은 포함
        if (currentTime.getHours() === 0 && currentTime.getMinutes() === 0) {
          return true;
        }
        return false; // 다음날 데이터 제외
      }

      return true;
    });

    const facilityData = hourlyTrendsData[selectedFacilityValue];
    const dataSource = facilityData?.data || facilityData;

    if (!dataSource || !times.length) {
      setLineChartData([]);
      return;
    }

    // 선택된 zone들의 데이터 수집
    const zonesToAggregate = selectedZones.includes('all_zones')
      ? Object.keys(dataSource).filter(key => key !== 'all_zones')
      : selectedZones;

    // 데이터 합산을 위한 초기 객체
    const aggregatedData: Record<string, number[]> = {
      inflow: new Array(times.length).fill(0),
      outflow: new Array(times.length).fill(0),
      queue_length: new Array(times.length).fill(0),
      waiting_time: new Array(times.length).fill(0),
      capacity: new Array(times.length).fill(0),
    };

    let validZoneCount = 0;

    // 각 zone의 데이터를 합산
    zonesToAggregate.forEach((zoneKey) => {
      const zoneData = dataSource[zoneKey];
      if (!zoneData) return;

      // 항공사 필터링이 적용된 경우
      let dataToUse: any = {};

      if (!selectedAirlines.includes('all') && zoneData.airlines) {
        // 선택된 항공사들의 데이터 합산
        const metrics = ['inflow', 'outflow', 'queue_length', 'waiting_time'];
        metrics.forEach(metric => {
          dataToUse[metric] = new Array(times.length).fill(0);
        });

        let airlineCount = 0;
        selectedAirlines.forEach(airlineCode => {
          const airlineData = zoneData.airlines[airlineCode];
          if (!airlineData) return;

          airlineCount++;

          // inflow, outflow는 합산
          ['inflow', 'outflow'].forEach(key => {
            if (airlineData[key]) {
              // 필터링된 times 길이만큼만 사용
              const slicedData = airlineData[key].slice(0, times.length);
              dataToUse[key] = dataToUse[key].map((val: number, idx: number) =>
                val + (slicedData[idx] || 0)
              );
            }
          });

          // queue_length, waiting_time은 합산 (나중에 평균)
          ['queue_length', 'waiting_time'].forEach(key => {
            if (airlineData[key]) {
              const slicedData = airlineData[key].slice(0, times.length);
              dataToUse[key] = dataToUse[key].map((val: number, idx: number) =>
                val + (slicedData[idx] || 0)
              );
            }
          });
        });

        // queue_length, waiting_time 평균 계산
        if (airlineCount > 0) {
          dataToUse.queue_length = dataToUse.queue_length.map((val: number) => val / airlineCount);
          dataToUse.waiting_time = dataToUse.waiting_time.map((val: number) => val / airlineCount);
        }

        // capacity는 zone 전체 값 사용 (필터링된 길이로)
        dataToUse.capacity = zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [];
      } else {
        // 전체 항공사 또는 airlines 데이터가 없는 경우
        // 모든 배열을 필터링된 times 길이로 자르기
        dataToUse = {
          inflow: zoneData.inflow ? zoneData.inflow.slice(0, times.length) : [],
          outflow: zoneData.outflow ? zoneData.outflow.slice(0, times.length) : [],
          capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [],
          queue_length: zoneData.queue_length ? zoneData.queue_length.slice(0, times.length) : [],
          waiting_time: zoneData.waiting_time ? zoneData.waiting_time.slice(0, times.length) : [],
        };
      }

      validZoneCount++;

      // inflow, outflow, capacity는 합산
      ['inflow', 'outflow', 'capacity'].forEach((key) => {
        if (dataToUse[key]) {
          const sanitized = sanitizeNumericSeries(dataToUse[key], times.length);
          if (sanitized) {
            aggregatedData[key] = aggregatedData[key].map((val, idx) => val + (sanitized[idx] || 0));
          }
        }
      });

      // queue_length, waiting_time은 평균 계산을 위해 합산 (나중에 zone 개수로 나눔)
      ['queue_length', 'waiting_time'].forEach((key) => {
        if (dataToUse[key]) {
          const sanitized = sanitizeNumericSeries(dataToUse[key], times.length);
          if (sanitized) {
            aggregatedData[key] = aggregatedData[key].map((val, idx) => val + (sanitized[idx] || 0));
          }
        }
      });
    });

    // queue_length와 waiting_time은 평균 계산
    if (validZoneCount > 0) {
      aggregatedData.queue_length = aggregatedData.queue_length.map(val => val / validZoneCount);
      aggregatedData.waiting_time = aggregatedData.waiting_time.map(val => val / validZoneCount);
    }

    const sanitizedSeriesCache: Record<string, number[]> = aggregatedData;
    const capacitySeries = aggregatedData.capacity;

    const newLineChartData: Plotly.Data[] = [];
    const newLayout: Partial<Plotly.Layout> = {
      margin: { l: 60, r: 60, b: 60, t: 24 },
      showlegend: false,
      xaxis: {
        showgrid: false,
        tickfont: { size: 10 },
        dtick: 3600000,
        showline: false,
        automargin: false,
        ticklen: 15,
        ticks: 'outside',
        tickcolor: 'transparent',
      },
    };

    const yaxisAssignment = [undefined, 'y2'] as const;

    chartOption1.forEach((activeIndex, i) => {
      const option = CHART_OPTIONS[activeIndex];
      if (!option) return;

      const yaxisId = yaxisAssignment[i];

      const sanitizedSeries = aggregatedData[option.value];
      if (!sanitizedSeries) return;

      // Layout
      const yAxisConfig = {
        title: { text: `${option.label} ${getYAxisTitle(option.value)}`, standoff: 16, font: { color: option.color } },
        showgrid: true,
        gridcolor: option.color ? hexToRgba(option.color, 0.3) : '#e0e7ef',
        gridwidth: 1,
        griddash: 'dot',
        tickfont: { color: option.color, size: 10 },
        linecolor: option.color,
        showline: false,
      } as any;

      if (yaxisId === 'y2') {
        newLayout.yaxis2 = {
          ...yAxisConfig,
          overlaying: 'y',
          side: 'right',
        };
      } else {
        newLayout.yaxis = yAxisConfig;
      }

      // Line chart data
      let lineChartTrace: Plotly.Data = {
        x: times,
        y: sanitizedSeries,
        name: option.label,
        line: { color: option.color, shape: 'spline', smoothing: 1 },
        yaxis: yaxisId,
        showlegend: false,
      };
      if (option.value === 'waiting_time') {
        lineChartTrace = convertSecondsToMinutesInt(lineChartTrace);
      }
      newLineChartData.push(lineChartTrace);
    });

    if (chartOption1.length === 1) {
      delete newLayout.yaxis2;
    }

    const selectedOptionsWithAxis = chartOption1.map((activeIndex, i) => ({
      value: CHART_OPTIONS[activeIndex].value,
      axis: yaxisAssignment[i],
    }));

    const paxUnitOptions = ['inflow', 'outflow', 'queue_length'];

    // --- Calculate Max Value for Pax Units ---
    const selectedPaxOptions = selectedOptionsWithAxis.filter((opt) => paxUnitOptions.includes(opt.value));
    if (selectedPaxOptions.length > 0) {
      const dataToCompare = selectedPaxOptions.flatMap((opt) => sanitizedSeriesCache[opt.value] ?? []);

      let maxPaxValue = dataToCompare.length > 0 ? Math.max(...dataToCompare) : 0;

      const hasFlow = selectedPaxOptions.some((opt) => ['inflow', 'outflow'].includes(opt.value));
      if (hasFlow && capacitySeries) {
        const capacityMax = Math.max(...capacitySeries.filter((v) => typeof v === 'number'));
        maxPaxValue = Math.max(maxPaxValue, capacityMax);
      }

      const paxRangeMax = maxPaxValue > 0 ? maxPaxValue * 1.1 : 10;

      // Apply range to all selected pax axes
      selectedPaxOptions.forEach((opt) => {
        const axisToUpdate = opt.axis === 'y2' ? newLayout.yaxis2 : newLayout.yaxis;
        if (axisToUpdate) {
          axisToUpdate.range = [0, paxRangeMax];
          axisToUpdate.autorange = false;
        }
      });
    }

    // --- Calculate and Apply Max Value for Wait Time Unit ---
    const selectedWaitTimeOption = selectedOptionsWithAxis.find((opt) => opt.value === 'waiting_time');
    if (selectedWaitTimeOption) {
      const waitTimeRaw = sanitizedSeriesCache['waiting_time'] ?? [];
      const waitTimeData = waitTimeRaw.map((v) => Math.floor(v / 60));
      const maxWaitTimeValue = waitTimeData.length > 0 ? Math.max(...waitTimeData) : 0;
      const waitTimeRangeMax = maxWaitTimeValue > 0 ? maxWaitTimeValue * 1.1 : 10;

      const axisToUpdate = selectedWaitTimeOption.axis === 'y2' ? newLayout.yaxis2 : newLayout.yaxis;
      if (axisToUpdate) {
        axisToUpdate.range = [0, waitTimeRangeMax];
        axisToUpdate.autorange = false;
      }
    }

    const showCapacity =
      chartOption1.some((i) => ['inflow', 'outflow'].includes(CHART_OPTIONS[i].value)) && capacitySeries;

    if (showCapacity) {
      const firstFlowSelectionIndex = chartOption1.findIndex((i) =>
        ['inflow', 'outflow'].includes(CHART_OPTIONS[i].value)
      );
      const capacityYAxis = yaxisAssignment[firstFlowSelectionIndex];

      const capacityTrace: Plotly.Data = {
        x: times,
        y: capacitySeries,
        name: 'Capacity',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#dc2626', dash: 'dashdot', shape: 'hv', width: 2 },
        yaxis: capacityYAxis,
      };
      newLineChartData.push(capacityTrace);
      newLayout.showlegend = true;
      newLayout.legend = {
        x: 1,
        y: 1.05,
        xanchor: 'right',
        yanchor: 'top',
      };
    }

    setLineChartData(newLineChartData);
    setChartLayout(newLayout);
  }, [chartOption1, selectedFacilityValue, selectedZones, selectedAirlines, hourlyTrendsData]);

  // 선택된 zone들의 라벨 생성
  const selectedZonesLabel = useMemo(() => {
    if (selectedZones.includes('all_zones')) {
      return 'All Zones';
    }
    if (selectedZones.length === 0) {
      return 'Select Zones';
    }
    if (selectedZones.length === 1) {
      return ZONE_OPTIONS.find(opt => opt.value === selectedZones[0])?.label || selectedZones[0];
    }
    return `${selectedZones.length} zones selected`;
  }, [selectedZones, ZONE_OPTIONS]);

  // 선택된 항공사들의 라벨 생성
  const selectedAirlinesLabel = useMemo(() => {
    if (selectedAirlines.includes('all')) {
      return 'All Airlines';
    }
    if (selectedAirlines.length === 0) {
      return 'Select Airlines';
    }
    if (selectedAirlines.length === 1) {
      const airline = AIRLINE_OPTIONS.find(opt => opt.value === selectedAirlines[0]);
      return airline?.label || selectedAirlines[0];
    }
    return `${selectedAirlines.length} airlines`;
  }, [selectedAirlines, AIRLINE_OPTIONS]);

  if (!scenario) {
    return <HomeNoScenario />;
  }
  if (isFlowChartLoading) {
    return <HomeLoading />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pl-5">
        <h5 className="flex h-[50px] items-center text-lg font-semibold">Hourly Trends</h5>
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        <div className="chart-header-container">
          <div className="chart-header-selects">
            <div ref={dropdownRef} className="relative min-w-48 flex-1">
              <button
                onClick={() => setIsZonePanelOpen(!isZonePanelOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <span>
                  {FACILITY_OPTIONS.find((opt) => opt.value === selectedFacilityValue)?.label || 'Select Facility'}
                  {' · '}
                  <span className="text-muted-foreground">{selectedZonesLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>

              {isZonePanelOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 flex min-w-[400px] rounded-md border bg-popover text-popover-foreground shadow-md">
                  {/* Facility 리스트 */}
                  <div className="w-1/2 border-r">
                    {FACILITY_OPTIONS.map((facility) => (
                      <button
                        key={facility.value}
                        onClick={() => setSelectedFacilityValue(facility.value)}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent',
                          selectedFacilityValue === facility.value && 'bg-accent'
                        )}
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span>{facility.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {facility.throughput.toLocaleString()} pax
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>

                  {/* Zone 멀티셀렉트 패널 */}
                  <div className="w-1/2 p-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Select Zones</div>
                    <div className="max-h-64 overflow-y-auto">
                      {ZONE_OPTIONS.map((zone) => (
                        <label
                          key={zone.value}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedZones.includes(zone.value)}
                            onCheckedChange={() => toggleZone(zone.value)}
                          />
                          <span className="text-sm">{zone.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Passengers (Airline) 드롭다운 */}
            <div ref={airlineDropdownRef} className="relative min-w-48 flex-1">
              <button
                onClick={() => setIsAirlinePanelOpen(!isAirlinePanelOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <span>
                  Passengers
                  {' · '}
                  <span className="text-muted-foreground">{selectedAirlinesLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>

              {isAirlinePanelOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 flex min-w-[400px] rounded-md border bg-popover text-popover-foreground shadow-md">
                  {/* Airline 카테고리 */}
                  <div className="w-1/2 border-r">
                    <button
                      className="flex w-full items-center justify-between px-3 py-2 text-sm bg-accent"
                    >
                      <span>Airline</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Airline 멀티셀렉트 패널 */}
                  <div className="w-1/2 p-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Select Airlines</div>
                    <div className="max-h-64 overflow-y-auto">
                      {AIRLINE_OPTIONS.map((airline) => (
                        <label
                          key={airline.value}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedAirlines.includes(airline.value)}
                            onCheckedChange={() => toggleAirline(airline.value)}
                          />
                          <span className="text-sm">{airline.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="chart-header-buttons">
            <ToggleButtonGroup
              options={CHART_OPTIONS}
              selectedValues={chartOption1}
              onSelect={(opt, i) => handleChartOption1(i)}
              labelExtractor={(opt) => opt.label}
              buttonClassName="whitespace-nowrap"
              renderIcon={(opt, i, isSelected) =>
                isSelected && (
                  <Circle className="mr-1 !size-2.5" fill={opt.color} color={opt.color} stroke="transparent" />
                )
              }
            />
          </div>
        </div>
        <div className="mt-2 min-h-96 bg-white">
          <LineChart chartData={lineChartData} chartLayout={chartLayout} />
        </div>

        {/* Facility-level Heatmap */}
        {hourlyTrendsData && selectedFacilityValue && (() => {
          const allTimes = Array.isArray(hourlyTrendsData.times) ? hourlyTrendsData.times : [];

          // 자정(00:00) 포함, 그 이후 데이터 제거 - 당일까지만 표시
          const times = allTimes.filter((timeStr, idx) => {
            if (idx === 0) return true;

            const currentTime = new Date(timeStr);
            const prevTime = new Date(allTimes[idx - 1]);

            // 00:00은 포함, 그 이후(00:15 등)부터 제외
            if (currentTime.getHours() < prevTime.getHours()) {
              // 00:00은 포함
              if (currentTime.getHours() === 0 && currentTime.getMinutes() === 0) {
                return true;
              }
              return false;
            }

            return true;
          });

          const facilityData = hourlyTrendsData[selectedFacilityValue];
          const dataSource = facilityData?.data || facilityData;
          const zoneFacilities = facilityData?.facilities || [];

          if (!dataSource || zoneFacilities.length === 0 || times.length === 0) {
            return null;
          }

          // 선택된 zone 확인
          const isAllZones = selectedZones.includes('all_zones');
          // 항공사 필터 확인
          const isAirlineFiltered = !selectedAirlines.includes('all');

          // 항공사별 데이터 집계 헬퍼 함수
          const aggregateAirlineData = (airlinesData: Record<string, any>, timeLength: number) => {
            const result = {
              inflow: new Array(timeLength).fill(0),
              outflow: new Array(timeLength).fill(0),
              queue_length: new Array(timeLength).fill(0),
              waiting_time: new Array(timeLength).fill(0),
            };

            let airlineCount = 0;
            selectedAirlines.forEach((airlineCode) => {
              const airlineData = airlinesData[airlineCode];
              if (airlineData) {
                airlineCount++;
                // inflow, outflow는 합산
                ['inflow', 'outflow'].forEach((key) => {
                  if (airlineData[key]) {
                    airlineData[key].forEach((value: number, idx: number) => {
                      if (idx < timeLength) {
                        result[key as 'inflow' | 'outflow'][idx] += value;
                      }
                    });
                  }
                });
                // queue_length, waiting_time은 합산 후 평균
                ['queue_length', 'waiting_time'].forEach((key) => {
                  if (airlineData[key]) {
                    airlineData[key].forEach((value: number, idx: number) => {
                      if (idx < timeLength) {
                        result[key as 'queue_length' | 'waiting_time'][idx] += value;
                      }
                    });
                  }
                });
              }
            });

            // queue_length, waiting_time 평균 계산
            if (airlineCount > 0) {
              result.queue_length = result.queue_length.map(v => Math.round(v / airlineCount));
              result.waiting_time = result.waiting_time.map(v => Math.round(v / airlineCount));
            }

            return result;
          };

          let facilities: string[];
          let filteredFacilityData: Record<string, any>;

          if (isAllZones) {
            // All Zones 선택 → zone 레벨 표시
            facilities = zoneFacilities;
            filteredFacilityData = {};
            Object.keys(dataSource).forEach((key) => {
              const zoneData = dataSource[key];
              if (typeof zoneData === 'object' && zoneData !== null) {
                let facilityMetrics;

                if (isAirlineFiltered && zoneData.airlines) {
                  // 항공사 필터 적용
                  facilityMetrics = aggregateAirlineData(zoneData.airlines, times.length);
                } else {
                  // 전체 데이터 사용
                  facilityMetrics = {
                    inflow: zoneData.inflow ? zoneData.inflow.slice(0, times.length) : [],
                    outflow: zoneData.outflow ? zoneData.outflow.slice(0, times.length) : [],
                    queue_length: zoneData.queue_length ? zoneData.queue_length.slice(0, times.length) : [],
                    waiting_time: zoneData.waiting_time ? zoneData.waiting_time.slice(0, times.length) : [],
                  };
                }

                filteredFacilityData[key] = {
                  ...zoneData,
                  ...facilityMetrics,
                  capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [],
                };
              }
            });
          } else {
            // 일부 zone 선택 (1개 이상) → 선택된 zone들의 모든 개별 facility 표시
            const tempFacilities: string[] = [];
            const tempFacilityData: Record<string, any> = {};

            selectedZones.forEach((zoneName) => {
              const zoneData = dataSource[zoneName];
              if (zoneData && zoneData.sub_facilities && zoneData.facility_data) {
                // 해당 zone의 개별 facility 추가
                tempFacilities.push(...zoneData.sub_facilities);

                // facility_data의 각 facility 데이터를 시간에 맞춰 자르기
                Object.keys(zoneData.facility_data).forEach((facilityName) => {
                  const facData = zoneData.facility_data[facilityName];
                  if (typeof facData === 'object' && facData !== null) {
                    let facilityMetrics;

                    if (isAirlineFiltered && facData.airlines) {
                      // 항공사 필터 적용
                      facilityMetrics = aggregateAirlineData(facData.airlines, times.length);
                    } else {
                      // 전체 데이터 사용
                      facilityMetrics = {
                        inflow: facData.inflow ? facData.inflow.slice(0, times.length) : [],
                        outflow: facData.outflow ? facData.outflow.slice(0, times.length) : [],
                        queue_length: facData.queue_length ? facData.queue_length.slice(0, times.length) : [],
                        waiting_time: facData.waiting_time ? facData.waiting_time.slice(0, times.length) : [],
                      };
                    }

                    tempFacilityData[facilityName] = {
                      ...facData,
                      ...facilityMetrics,
                      capacity: facData.capacity ? facData.capacity.slice(0, times.length) : [],
                    };
                  }
                });
              } else if (zoneData) {
                // sub_facilities가 없으면 해당 zone만 표시
                tempFacilities.push(zoneName);

                let facilityMetrics;
                if (isAirlineFiltered && zoneData.airlines) {
                  // 항공사 필터 적용
                  facilityMetrics = aggregateAirlineData(zoneData.airlines, times.length);
                } else {
                  // 전체 데이터 사용
                  facilityMetrics = {
                    inflow: zoneData.inflow ? zoneData.inflow.slice(0, times.length) : [],
                    outflow: zoneData.outflow ? zoneData.outflow.slice(0, times.length) : [],
                    queue_length: zoneData.queue_length ? zoneData.queue_length.slice(0, times.length) : [],
                    waiting_time: zoneData.waiting_time ? zoneData.waiting_time.slice(0, times.length) : [],
                  };
                }

                tempFacilityData[zoneName] = {
                  ...zoneData,
                  ...facilityMetrics,
                  capacity: zoneData.capacity ? zoneData.capacity.slice(0, times.length) : [],
                };
              }
            });

            facilities = tempFacilities;
            filteredFacilityData = tempFacilityData;
          }

          if (facilities.length === 0) {
            return null;
          }

          return (
            <HomeFacilityHeatmap
              times={times}
              facilities={facilities}
              facilityData={filteredFacilityData}
              scenarioDate={scenario?.target_flight_schedule_date}
            />
          );
        })()}
      </div>
    </div>
  );
}

export default HomeChartHourlyTrends;
