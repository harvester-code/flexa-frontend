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

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatTimeLabel = (isoString: string) => dayjs(isoString).format('HH:mm');

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

  const facilityInfoText = useMemo(() => {
    if (!facilityChart?.facilityInfo) return 'Not available';
    return facilityChart.facilityInfo
      .replace(/운영/g, 'operating')
      .replace(/명\/시간/g, 'pax/hour')
      .replace(/항공/g, 'airlines')
      .replace(/시간/g, 'time')
      .replace(/\s+/g, ' ')
      .trim();
  }, [facilityChart?.facilityInfo]);

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
        hovertemplate: '<b>%{x|%H:%M}</b><br>' + label + ': %{y:,d} pax<extra></extra>',
      } as Plotly.Data;
    });

    const capacityTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Capacity limit',
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
      name: 'Total inflow',
      x: slotCenters,
      y: facilityChart.totalInflow,
      line: { color: '#ef4444', width: 2, dash: 'dot', shape: 'spline' },
      marker: { size: 6, color: '#ef4444', symbol: 'circle-open' },
      hovertemplate: '<b>%{x|%H:%M}</b><br>Total inflow: %{y:,d} pax<extra></extra>',
    };

    const totalOutflowTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Total outflow',
      x: slotCenters,
      y: facilityChart.totalOutflow,
      line: { color: '#16a34a', width: 3, shape: 'spline' },
      marker: { size: 6, color: '#16a34a' },
      hovertemplate: '<b>%{x|%H:%M}</b><br>Total outflow: %{y:,d} pax<extra></extra>',
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
        legend: {
          orientation: 'v',
          yanchor: 'top',
          y: 1,
          xanchor: 'left',
          x: 1.02,
          font: { size: 11 },
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: '#e2e8f0',
          borderwidth: 1,
        },
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

  const summary = facilityChart?.summary;

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
            <TabsList className="flex flex-wrap gap-2 bg-surface-100/60 p-1">
              {data.steps.map((item) => (
                <TabsTrigger
                  key={item.step}
                  value={item.step}
                  className="px-3 py-1.5 text-sm font-medium"
                >
                  {capitalizeFirst(item.step)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {zonesForStep.length ? (
            <Tabs
              value={activeZone?.id || ''}
              onValueChange={(value) => setSelectedZone(value)}
              className="w-full"
            >
              <TabsList className="flex flex-wrap gap-2 bg-surface-100/60 p-1">
                {zonesForStep.map((zone) => (
                  <TabsTrigger
                    key={zone.id}
                    value={zone.id}
                    className="px-3 py-1.5 text-sm font-medium"
                  >
                    {zone.name}
                    <span className="ml-1 text-xs text-muted-foreground">({zone.facilities.length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
        </div>
      </div>

      {heatmapData ? (
        <div className="mt-6 space-y-6">
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-surface-50">
            <div className="min-w-[720px]">
              <div className="flex items-stretch">
                <div className="w-28 flex-shrink-0 border-b border-r border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Facility
                </div>
                <div className="flex-1 border-b border-slate-200">
                  <div
                    className="grid text-center text-[10px] font-medium text-muted-foreground"
                    style={{ gridTemplateColumns: `repeat(${heatmapData.times.length}, minmax(32px, 1fr))` }}
                  >
                    {timeLabels.map((label, index) => (
                      <div
                        key={`${heatmapData.times[index]}-label`}
                        className="border-r border-slate-200 px-1 py-1.5 last:border-r-0"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                {heatmapData.rows.map((row) => {
                  const isActive = row.facility.facilityId === selectedFacility;
                  return (
                    <div
                      key={row.facility.facilityId}
                      className={cn(
                        'flex items-stretch border-b border-slate-200 last:border-b-0',
                        isActive && 'bg-primary/5'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedFacility(row.facility.facilityId)}
                        className={cn(
                          'w-28 flex-shrink-0 border-r border-slate-200 px-2 py-1.5 text-left text-[11px] font-medium transition-colors',
                          isActive ? 'text-primary' : 'text-default-700 hover:text-primary'
                        )}
                      >
                        {row.facility.facilityId}
                      </button>
                      <div className="flex-1">
                        <div
                          className="grid"
                          style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(32px, 1fr))` }}
                        >
                          {row.cells.map((cell, index) => {
                            const inflowColor = getHeatColor(cell.inflow, heatmapData.maxInflow, INFLOW_HEAT_COLOR);
                            const outflowColor = getHeatColor(cell.outflow, heatmapData.maxOutflow, OUTFLOW_HEAT_COLOR);
                            const hasValues = cell.inflow > 0 || cell.outflow > 0;
                            return (
                              <div
                                key={`${row.facility.facilityId}-${cell.time}`}
                                className="relative h-8 border-r border-slate-200 text-[9px] last:border-r-0"
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

          {facilityChart && plotConfig ? (
            <div className="space-y-6">
              <div className="-mx-2 overflow-x-auto px-2">
                <Plot
                  data={plotConfig.data as Plotly.Data[]}
                  layout={{
                    ...plotConfig.layout,
                    autosize: true,
                    height: 420,
                  }}
                  config={{ displaylogo: false, responsive: true }}
                  style={{ width: '100%', minWidth: '720px' }}
                />
              </div>

              <div className="grid gap-4 rounded-md bg-surface-50 p-4 md:grid-cols-2 lg:grid-cols-4">
                <Statistic label="Total inflow" value={`${formatNumberWithComma(summary?.totalInflow ?? 0)} pax`} />
                <Statistic label="Total outflow" value={`${formatNumberWithComma(summary?.totalOutflow ?? 0)} pax`} />
                <Statistic
                  label="Peak capacity"
                  value={`${formatNumberWithComma(Math.round(summary?.maxCapacity ?? 0))} pax / ${facilityChart.intervalMinutes} min`}
                />
                <Statistic
                  label="Average capacity"
                  value={`${formatNumberWithComma(Math.round(summary?.averageCapacity ?? 0))} pax / ${facilityChart.intervalMinutes} min`}
                />
              </div>

              <div className="space-y-3 rounded-md border border-dashed border-input p-4 text-sm leading-relaxed text-default-600">
                <div>
                  <span className="font-semibold text-default-700">Operating windows:</span>{' '}
                  {facilityInfoText}
                </div>
                <div>
                  <span className="font-semibold text-default-700">Bottleneck windows:</span>{' '}
                  {summary?.bottleneckTimes?.length
                    ? summary.bottleneckTimes.map(formatTimeLabel).join(', ')
                    : 'None detected'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          No facility data available for this zone.
        </div>
      )}
    </div>
  );
}

function Statistic({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-default-900">{value}</p>
    </div>
  );
}
