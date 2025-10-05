import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';

import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';
import HomeNoData from './HomeNoData';
import { capitalizeFirst, formatNumberWithComma } from './HomeFormat';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { ScenarioData, FacilityChartsResponse } from '@/types/homeTypes';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex h-60 items-center justify-center text-muted-foreground">Loading chart...</div>,
}) as any;

interface HomeFacilityChartsProps {
  scenario: ScenarioData | null;
  data?: FacilityChartsResponse;
  isLoading?: boolean;
}

type FacilityChartItem = FacilityChartsResponse['steps'][number]['facilityCharts'][number];

interface ZoneGroup {
  id: string;
  name: string;
  facilities: FacilityChartItem[];
}

interface HeatmapCell {
  time: string;
  inflow: number;
  outflow: number;
}

interface HeatmapRow {
  facility: FacilityChartItem;
  cells: HeatmapCell[];
}

interface HeatmapData {
  times: string[];
  rows: HeatmapRow[];
  maxInflow: number;
  maxOutflow: number;
}

const SERIES_COLORS = ['#2563eb', '#0891b2', '#6366f1', '#22c55e', '#f97316', '#f43f5e', '#8b5cf6', '#14b8a6'];
const INFLOW_HEAT_COLOR = '#2563eb';
const OUTFLOW_HEAT_COLOR = '#16a34a';
const EMPTY_HEAT_COLOR = 'rgba(148, 163, 184, 0.12)';
const CHART_HEIGHT = '24rem';

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


const translateSeriesLabel = (label: string, fallback: string) => {
  return label
    .replace('수요', 'Inflow')
    .replace('유입', 'Inflow')
    .replace('처리', 'Outflow')
    .replace('유출', 'Outflow')
    .replace('총계', 'Total')
    .trim() || fallback;
};

export default function HomeFacilityCharts({ scenario, data, isLoading }: HomeFacilityChartsProps) {
  const [selectedStep, setSelectedStep] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  useEffect(() => {
    if (!data?.steps?.length) return;
    setSelectedStep((prev) => {
      if (prev && data.steps.some((item) => item.step === prev)) {
        return prev;
      }
      return data.steps[0].step;
    });
  }, [data]);

  const defaultStep = data?.steps?.[0]?.step || '';
  const activeStep = selectedStep || defaultStep;

  const stepData = useMemo(() => data?.steps.find((item) => item.step === activeStep), [data, activeStep]);

  const zonesForStep = useMemo<ZoneGroup[]>(() => {
    if (!stepData?.facilityCharts?.length) return [];

    const zoneMap = new Map<string, ZoneGroup>();
    stepData.facilityCharts.forEach((chart) => {
      const zoneId = chart.zoneId || 'UNKNOWN_ZONE';
      const zoneName = chart.zoneName || zoneId;
      const existing = zoneMap.get(zoneId);
      if (existing) {
        existing.facilities.push(chart);
      } else {
        zoneMap.set(zoneId, {
          id: zoneId,
          name: zoneName,
          facilities: [chart],
        });
      }
    });

    const sortedZones = Array.from(zoneMap.values()).map((zone) => ({
      ...zone,
      facilities: [...zone.facilities].sort((a, b) =>
        a.facilityId.localeCompare(b.facilityId, undefined, { numeric: true })
      ),
    }));

    sortedZones.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return sortedZones;
  }, [stepData]);

  useEffect(() => {
    if (!zonesForStep.length) {
      setSelectedZone('');
      return;
    }

    setSelectedZone((prev) => {
      if (prev && zonesForStep.some((zone) => zone.id === prev)) {
        return prev;
      }
      return zonesForStep[0].id;
    });
  }, [zonesForStep]);

  const activeZone = useMemo(() => {
    if (!zonesForStep.length) return null;
    if (selectedZone) {
      const matched = zonesForStep.find((zone) => zone.id === selectedZone);
      if (matched) return matched;
    }
    return zonesForStep[0];
  }, [zonesForStep, selectedZone]);

  useEffect(() => {
    const facilities = activeZone?.facilities || [];
    if (!facilities.length) {
      setSelectedFacility('');
      return;
    }

    setSelectedFacility((prev) => {
      if (prev && facilities.some((chart) => chart.facilityId === prev)) {
        return prev;
      }
      return facilities[0].facilityId;
    });
  }, [activeZone]);

  const facilityChart = useMemo(
    () => activeZone?.facilities.find((chart) => chart.facilityId === selectedFacility) || null,
    [activeZone, selectedFacility]
  );

  const heatmapData = useMemo<HeatmapData | null>(() => {
    if (!activeZone?.facilities?.length) return null;

    const timeSet = new Set<string>();
    activeZone.facilities.forEach((facility) => {
      facility.timeRange.forEach((ts) => {
        if (ts) timeSet.add(ts);
      });
    });

    const times = Array.from(timeSet).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());

    let maxInflow = 0;
    let maxOutflow = 0;

    const rows: HeatmapRow[] = activeZone.facilities.map((facility) => {
      const cellMap = new Map<string, HeatmapCell>();
      facility.timeRange.forEach((timestamp, index) => {
        const inflow = facility.totalInflow[index] ?? 0;
        const outflow = facility.totalOutflow[index] ?? 0;
        maxInflow = Math.max(maxInflow, inflow);
        maxOutflow = Math.max(maxOutflow, outflow);
        cellMap.set(timestamp, {
          time: timestamp,
          inflow,
          outflow,
        });
      });

      const cells = times.map((time) => cellMap.get(time) || { time, inflow: 0, outflow: 0 });
      return {
        facility,
        cells,
      };
    });

    return { times, rows, maxInflow, maxOutflow };
  }, [activeZone]);


  const timeLabels = useMemo(() => heatmapData?.times.map((time) => dayjs(time).format('HH:mm')) || [], [heatmapData]);

  const heatmapGridTemplate = useMemo(() => {
    const columnCount = heatmapData?.times.length ?? 0;
    if (!columnCount) return undefined;
    return `repeat(${columnCount}, minmax(32px, 1fr))`;
  }, [heatmapData?.times.length]);

  const facilityRowTemplate = useMemo(() => {
    const columnCount = heatmapData?.times.length ?? 0;
    if (!columnCount) return undefined;
    return `minmax(160px, max-content) repeat(${columnCount}, minmax(32px, 1fr))`;
  }, [heatmapData?.times.length]);

  const getHeatColor = (value: number, maxValue: number, baseColor: string) => {
    if (!maxValue || value <= 0) return EMPTY_HEAT_COLOR;
    const ratio = Math.min(1, value / maxValue);
    const alpha = 0.18 + 0.62 * ratio;
    return hexToRgba(baseColor, Number(alpha.toFixed(2)));
  };

  const plotConfig = useMemo(() => {
    if (!facilityChart) return null;

    const intervalMs = (facilityChart.intervalMinutes || 60) * 60 * 1000;
    const slotStarts = facilityChart.timeRange
      .map((ts) => new Date(ts))
      .sort((a, b) => a.getTime() - b.getTime());
    if (!slotStarts.length) return null;
    const slotCenters = slotStarts.map((time) => new Date(time.getTime() + intervalMs / 2));
    const inflowOffset = -intervalMs / 4;
    const outflowOffset = intervalMs / 4;
    const rangeStart = slotStarts[0];
    const rangeEnd = new Date(slotStarts[slotStarts.length - 1].getTime() + intervalMs);

    const inflowBars = facilityChart.inflowSeries.map((series, index) => {
      const baseColor = SERIES_COLORS[index % SERIES_COLORS.length];
      const label = translateSeriesLabel(series.label, `Inflow ${index + 1}`);
      return {
        type: 'bar',
        name: label,
        x: slotCenters,
        y: series.values,
        marker: {
          color: hexToRgba(baseColor, 0.18),
          line: { color: baseColor, width: 1.6 },
        },
        offsetgroup: 'inflow',
        legendgroup: `inflow-${index}`,
        width: intervalMs * 0.225,
        offset: inflowOffset / 2,
        showlegend: false,
        hovertemplate: '<b>%{x|%H:%M}</b><br>' + label + ': %{y:,d} pax<extra></extra>',
      } as Plotly.Data;
    });

    const outflowBars = facilityChart.outflowSeries.map((series, index) => {
      const baseColor = SERIES_COLORS[index % SERIES_COLORS.length];
      const label = translateSeriesLabel(series.label, `Outflow ${index + 1}`);
      return {
        type: 'bar',
        name: label,
        x: slotCenters,
        y: series.values,
        marker: {
          color: hexToRgba(baseColor, 0.78),
        },
        offsetgroup: 'outflow',
        legendgroup: `outflow-${index}`,
        width: intervalMs * 0.225,
        offset: outflowOffset / 2,
        showlegend: false,
        hovertemplate: '<b>%{x|%H:%M}</b><br>' + label + ': %{y:,d} pax<extra></extra>',
      } as Plotly.Data;
    });

    const capacityTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Capacity',
      x: slotCenters,
      y: facilityChart.capacity,
      line: { color: '#1d4ed8', width: 3, shape: 'spline' },
      marker: { size: 6, color: '#1d4ed8' },
      fill: 'tozeroy',
      fillcolor: 'rgba(29, 78, 216, 0.12)',
      hovertemplate: '<b>%{x|%H:%M}</b><br>Capacity: %{y:.0f} pax<extra></extra>',
    };

    const totalInflowTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Inflow',
      x: slotCenters,
      y: facilityChart.totalInflow,
      line: { color: '#ef4444', width: 2, dash: 'dot', shape: 'spline' },
      marker: { size: 6, color: '#ef4444', symbol: 'circle-open' },
      hovertemplate: '<b>%{x|%H:%M}</b><br>Inflow: %{y:,d} pax<extra></extra>',
    };

    const totalOutflowTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Outflow',
      x: slotCenters,
      y: facilityChart.totalOutflow,
      line: { color: '#16a34a', width: 3, shape: 'spline' },
      marker: { size: 6, color: '#16a34a' },
      hovertemplate: '<b>%{x|%H:%M}</b><br>Outflow: %{y:,d} pax<extra></extra>',
    };

    return {
      data: [...inflowBars, ...outflowBars, capacityTrace, totalInflowTrace, totalOutflowTrace],
      layout: {
        margin: { l: 60, r: 40, t: 50, b: 60 },
        barmode: 'relative',
        bargap: 0.25,
        bargroupgap: 0.15,
        hovermode: 'x unified',
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#ffffff',
        showlegend: false,
        xaxis: {
          type: 'date',
          title: 'Time',
          tickformat: '%H:%M',
          showgrid: false,
          zeroline: false,
          range: [rangeStart, rangeEnd],
        },
        yaxis: {
          title: `Passengers per ${facilityChart.intervalMinutes}-minute window`,
          rangemode: 'tozero',
          zeroline: true,
          zerolinecolor: '#e2e8f0',
          gridcolor: '#e2e8f0',
        },
      } as Partial<Plotly.Layout>,
    };
  }, [facilityChart]);

  const stepCount = data?.steps?.length ?? 0;
  const zoneCount = zonesForStep.length ?? 0;

  const baseTriggerClass =
    'group flex w-full items-center justify-center rounded-full px-4 py-1 text-sm font-semibold leading-tight text-[#626a82] transition-colors duration-200 whitespace-nowrap hover:bg-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7b4dff] data-[state=active]:to-[#a047ff] data-[state=active]:text-white';
  const stepTriggerClass =
    stepCount > 4
      ? cn('min-w-[7rem]', baseTriggerClass)
      : baseTriggerClass;
  const zoneTriggerClass =
    zoneCount > 4
      ? cn('min-w-[7rem]', baseTriggerClass)
      : baseTriggerClass;

  const stepTabsStyle = stepCount
    ? { gridTemplateColumns: `repeat(${stepCount}, minmax(${stepCount > 4 ? '7rem' : '0px'}, 1fr))` }
    : undefined;
  const zoneTabsStyle = zoneCount
    ? { gridTemplateColumns: `repeat(${zoneCount}, minmax(${zoneCount > 4 ? '7rem' : '0px'}, 1fr))` }
    : undefined;

  const airlineLegend = useMemo(() => {
    if (!facilityChart?.inflowSeries?.length) return [];
    return facilityChart.inflowSeries.map((series, index) => {
      const baseColor = SERIES_COLORS[index % SERIES_COLORS.length];
      const rawLabel = series.label || `Airline ${index + 1}`;
      const cleanedLabel = rawLabel
        .replace(/\s*(유입|유출|수요|처리|Inflow|Outflow|Demand|Processing)$/i, '')
        .replace(/[·-]+$/g, '')
        .trim();
      return {
        key: `${rawLabel}-${index}`,
        name: cleanedLabel || `Airline ${index + 1}`,
        color: baseColor,
      };
    });
  }, [facilityChart?.inflowSeries]);

  if (!scenario) return <HomeNoScenario />;
  if (isLoading) return <HomeLoading />;
  if (!data?.steps?.length) return <HomeNoData />;

  return (
    <div className="rounded-md border border-input bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Facility throughput overview</p>
          <h3 className="text-xl font-semibold text-default-900">
            {capitalizeFirst(activeStep || '')}
            {activeZone?.name ? ` · ${activeZone.name}` : ''}
            {selectedFacility ? ` · ${selectedFacility}` : ''}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Compare inflow (planned passengers) and outflow (served passengers) across every facility in the selected zone.
            Click a row in the heatmap to explore detailed throughput for that facility.
          </p>
        </div>

        <div className="space-y-3">
          <Tabs value={activeStep} onValueChange={(value) => setSelectedStep(value)} className="w-full">
            <TabsList
              className="grid w-full gap-1 rounded-full bg-[#eef2ff] p-1.5 shadow-sm"
              style={stepTabsStyle}
            >
              {data.steps.map((item) => (
                <TabsTrigger
                  key={item.step}
                  value={item.step}
                  className={stepTriggerClass}
                >
                  {capitalizeFirst(item.step)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {zonesForStep.length ? (
            <Tabs value={activeZone?.id || ''} onValueChange={(value) => setSelectedZone(value)} className="w-full">
              <TabsList
                className="grid w-full gap-1 rounded-full bg-[#eef2ff] p-1.5 shadow-sm"
                style={zoneTabsStyle}
              >
                {zonesForStep.map((zone) => (
                  <TabsTrigger
                    key={zone.id}
                    value={zone.id}
                    className={zoneTriggerClass}
                  >
                    <span className="truncate">{zone.name}</span>
                    <span className="ml-2 text-xs text-[#7a7f95] group-data-[state=active]:text-white/80">
                      ({zone.facilities.length})
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {facilityChart && plotConfig ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-3 text-xs font-semibold text-default-600">
              <span className="inline-flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="h-[3px] w-6 rounded-full bg-[#1d4ed8]" />
                  <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                </span>
                Capacity
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span
                    className="h-[3px] w-6 rounded-full border-t-2 border-dashed"
                    style={{ borderColor: '#ef4444' }}
                  />
                  <span
                    className="inline-flex h-2 w-2 items-center justify-center rounded-full border"
                    style={{ borderColor: '#ef4444' }}
                  >
                    <span className="h-1 w-1 rounded-full bg-[#ef4444]" />
                  </span>
                </span>
                Inflow
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="h-[3px] w-6 rounded-full bg-[#16a34a]" />
                  <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                </span>
                Outflow
              </span>
            </div>

            <div className="-mx-2 overflow-x-auto px-2">
              <div className="min-w-[720px]" style={{ height: CHART_HEIGHT }}>
                <Plot
                  data={plotConfig.data as Plotly.Data[]}
                  layout={{
                    ...plotConfig.layout,
                    autosize: true,
                  }}
                  config={{ displaylogo: false, responsive: true }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>

            {airlineLegend.length ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-muted-foreground">
                {airlineLegend.map((item) => (
                  <div key={item.key} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ backgroundColor: hexToRgba(item.color, 0.85) }}
                    />
                    <span className="font-medium text-default-700">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : null}

          </div>
        ) : null}

        {heatmapData ? (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-md border border-slate-200 bg-surface-50">
              <div className="min-w-[720px]">
                <div
                  className="grid border-b border-slate-200 bg-white"
                  style={
                    facilityRowTemplate
                      ? { gridTemplateColumns: facilityRowTemplate }
                      : undefined
                  }
                >
                  <div className="border-r border-slate-200 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Facility
                  </div>
                  {timeLabels.map((label, index) => (
                    <div
                      key={`${heatmapData.times[index]}-label`}
                      className="border-r border-slate-200 px-1 py-1.5 text-center text-[10px] font-medium text-muted-foreground last:border-r-0"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div>
                  {heatmapData.rows.map((row) => {
                    const isActive = row.facility.facilityId === selectedFacility;
                    const totalOutflow = row.facility.summary?.totalOutflow;
                    return (
                      <div
                        key={row.facility.facilityId}
                        className="border-b border-slate-200 last-border-b-0"
                      >
                        <div
                          className={cn('grid items-stretch', isActive && 'bg-primary/5')}
                          style={
                            facilityRowTemplate
                              ? { gridTemplateColumns: facilityRowTemplate }
                              : undefined
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedFacility(row.facility.facilityId)}
                            className={cn(
                              'flex items-center justify-between gap-2 border-r border-slate-200 px-2 py-1.5 text-left transition-colors',
                              isActive ? 'text-primary' : 'text-default-700 hover:text-primary'
                            )}
                          >
                            {typeof totalOutflow === 'number' ? (
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="truncate text-[11px] font-medium leading-tight">
                                  {row.facility.facilityId}
                                </span>
                                <span className="text-[10px] font-semibold text-primary">
                                  {formatNumberWithComma(Math.round(totalOutflow))} pax
                                </span>
                              </div>
                            ) : (
                              <span className="truncate text-[11px] font-medium leading-tight">
                                {row.facility.facilityId}
                              </span>
                            )}
                          </button>
                          {row.cells.map((cell, index) => {
                              const inflowColor = getHeatColor(cell.inflow, heatmapData.maxInflow, INFLOW_HEAT_COLOR);
                              const outflowColor = getHeatColor(cell.outflow, heatmapData.maxOutflow, OUTFLOW_HEAT_COLOR);
                              const hasValues = cell.inflow > 0 || cell.outflow > 0;
                              return (
                                <div
                                  key={`${row.facility.facilityId}-${cell.time}`}
                                  className="relative h-8 border-r border-slate-200 text-[9px] last-border-r-0"
                                  title={`${timeLabels[index]} · Inflow ${cell.inflow.toLocaleString()} pax | Outflow ${cell.outflow.toLocaleString()} pax`}
                                >
                                  <div className="absolute inset-0 flex flex-col">
                                    <div className="flex-1" style={{ backgroundColor: inflowColor }} />
                                    <div
                                      className="flex-1 border-t border-white/40"
                                      style={{ backgroundColor: outflowColor }}
                                    />
                                  </div>
                                  {hasValues ? (
                                    <div className="relative flex h-full flex-col items-center justify-center gap-0.5 px-0.5">
                                      <span className="text-[9px] font-semibold leading-none text-default-800">
                                        {cell.inflow.toLocaleString()}
                                      </span>
                                      <span className="text-[9px] leading-none text-muted-foreground">
                                        {cell.outflow.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: hexToRgba(INFLOW_HEAT_COLOR, 0.6) }} />
                <span>Top half · Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: hexToRgba(OUTFLOW_HEAT_COLOR, 0.6) }} />
                <span>Bottom half · Outflow</span>
              </div>
              <span>Hover a cell to see exact inflow/outflow counts.</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
            No facility data available for this zone.
          </div>
        )}
      </div>
    </div>
  );
}
