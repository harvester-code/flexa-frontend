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
      .map((key) => ({
        label: capitalizeFirst(key.replace('_', ' ')),
        value: key,
      }));
  }, [hourlyTrendsData]);

  const [selectedFacilityValue, setSelectedFacilityValue] = useState('');
  useEffect(() => {
    if (FACILITY_OPTIONS.length > 0 && !selectedFacilityValue) {
      setSelectedFacilityValue(FACILITY_OPTIONS[0].value);
    }
  }, [FACILITY_OPTIONS, selectedFacilityValue]);

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

  useEffect(() => {
    if (ZONE_OPTIONS.length > 0) {
      // 기본값으로 all_zones 선택
      const allZonesOption = ZONE_OPTIONS.find(opt => opt.value === 'all_zones');
      setSelectedZones(allZonesOption ? ['all_zones'] : [ZONE_OPTIONS[0].value]);
    }
  }, [ZONE_OPTIONS]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsZonePanelOpen(false);
      }
    };

    if (isZonePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isZonePanelOpen]);

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

  useEffect(() => {
    if (!hourlyTrendsData || !selectedFacilityValue || selectedZones.length === 0) return;

    const times = Array.isArray(hourlyTrendsData.times) ? hourlyTrendsData.times : [];
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

      validZoneCount++;

      // inflow, outflow, capacity는 합산
      ['inflow', 'outflow', 'capacity'].forEach((key) => {
        if (zoneData[key]) {
          const sanitized = sanitizeNumericSeries(zoneData[key], times.length);
          if (sanitized) {
            aggregatedData[key] = aggregatedData[key].map((val, idx) => val + (sanitized[idx] || 0));
          }
        }
      });

      // queue_length, waiting_time은 평균 계산을 위해 합산 (나중에 zone 개수로 나눔)
      ['queue_length', 'waiting_time'].forEach((key) => {
        if (zoneData[key]) {
          const sanitized = sanitizeNumericSeries(zoneData[key], times.length);
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
  }, [chartOption1, selectedFacilityValue, selectedZones, hourlyTrendsData]);

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
                        <span>{facility.label}</span>
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
      </div>
    </div>
  );
}

export default HomeChartHourlyTrends;
