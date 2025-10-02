import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';

import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';
import HomeNoData from './HomeNoData';
import TheDropdownMenu from './TheDropdownMenu';
import { capitalizeFirst, formatNumberWithComma } from './HomeFormat';
import { Option, ScenarioData, FacilityChartsResponse } from '@/types/homeTypes';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex h-60 items-center justify-center text-muted-foreground">Loading chart...</div>,
}) as any;

interface HomeFacilityChartsProps {
  scenario: ScenarioData | null;
  data?: FacilityChartsResponse;
  isLoading?: boolean;
}

const SERIES_COLORS = ['#2563eb', '#0891b2', '#6366f1', '#22c55e', '#f97316', '#f43f5e', '#8b5cf6', '#14b8a6'];

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
    .replace('수요', 'Demand')
    .replace('처리', 'Processing')
    .replace('총계', 'Total')
    .trim() || fallback;
};

export default function HomeFacilityCharts({ scenario, data, isLoading }: HomeFacilityChartsProps) {
  const [selectedStep, setSelectedStep] = useState<string>('');
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

  const stepData = useMemo(() => data?.steps.find((item) => item.step === selectedStep), [data, selectedStep]);

  useEffect(() => {
    if (!stepData?.facilityCharts?.length) {
      setSelectedFacility('');
      return;
    }

    setSelectedFacility((prev) => {
      if (prev && stepData.facilityCharts.some((chart) => chart.facilityId === prev)) {
        return prev;
      }
      return stepData.facilityCharts[0].facilityId;
    });
  }, [stepData]);

  const facilityChart = useMemo(
    () => stepData?.facilityCharts.find((chart) => chart.facilityId === selectedFacility),
    [stepData, selectedFacility]
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

  const stepOptions: Option[] = useMemo(
    () =>
      data?.steps?.map((item) => ({
        label: capitalizeFirst(item.step),
        value: item.step,
      })) || [],
    [data]
  );

  const facilityOptions: Option[] = useMemo(
    () =>
      stepData?.facilityCharts?.map((item) => ({
        label: item.facilityId,
        value: item.facilityId,
      })) || [],
    [stepData]
  );

  const plotConfig = useMemo(() => {
    if (!facilityChart) return null;

    const intervalMs = (facilityChart.intervalMinutes || 30) * 60 * 1000;
    const times = facilityChart.timeRange.map((ts) => new Date(ts));

    const demandBars = facilityChart.demandSeries.map((series, index) => {
      const baseColor = SERIES_COLORS[index % SERIES_COLORS.length];
      const label = translateSeriesLabel(series.label, `Demand ${index + 1}`);
      return {
        type: 'bar',
        name: label,
        x: times,
        y: series.values,
        marker: {
          color: hexToRgba(baseColor, 0.18),
          line: { color: baseColor, width: 1.6 },
        },
        offsetgroup: 'demand',
        legendgroup: `demand-${index}`,
        width: intervalMs * 0.9,
        hovertemplate: '<b>%{x|%H:%M}</b><br>' + label + ': %{y:,d} pax<extra></extra>',
      } as Plotly.Data;
    });

    const processingBars = facilityChart.processingSeries.map((series, index) => {
      const baseColor = SERIES_COLORS[index % SERIES_COLORS.length];
      const label = translateSeriesLabel(series.label, `Processing ${index + 1}`);
      return {
        type: 'bar',
        name: label,
        x: times,
        y: series.values,
        marker: {
          color: hexToRgba(baseColor, 0.78),
        },
        offsetgroup: 'processing',
        legendgroup: `processing-${index}`,
        width: intervalMs * 0.9,
        hovertemplate: '<b>%{x|%H:%M}</b><br>' + label + ': %{y:,d} pax<extra></extra>',
      } as Plotly.Data;
    });

    const capacityTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Capacity limit',
      x: times,
      y: facilityChart.capacity,
      line: { color: '#1d4ed8', width: 3 },
      marker: { size: 6, color: '#1d4ed8' },
      fill: 'tozeroy',
      fillcolor: 'rgba(29, 78, 216, 0.12)',
      hovertemplate: '<b>%{x|%H:%M}</b><br>Capacity: %{y:.0f} pax<extra></extra>',
    };

    const totalDemandTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Total demand',
      x: times,
      y: facilityChart.totalDemand,
      line: { color: '#ef4444', width: 2, dash: 'dot' },
      marker: { size: 6, color: '#ef4444', symbol: 'circle-open' },
      hovertemplate: '<b>%{x|%H:%M}</b><br>Total demand: %{y:,d} pax<extra></extra>',
    };

    const totalProcessedTrace: Plotly.Data = {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Total processed',
      x: times,
      y: facilityChart.totalProcessed,
      line: { color: '#16a34a', width: 3 },
      marker: { size: 6, color: '#16a34a' },
      hovertemplate: '<b>%{x|%H:%M}</b><br>Total processed: %{y:,d} pax<extra></extra>',
    };

    return {
      data: [...demandBars, ...processingBars, capacityTrace, totalDemandTrace, totalProcessedTrace],
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Facility throughput overview</p>
          <h3 className="text-xl font-semibold text-default-900">
            {capitalizeFirst(stepData?.step || '')}
            {selectedFacility ? ` · ${selectedFacility}` : ''}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Compare demand (planned passengers) and processing (served passengers) per 30-minute window. Capacity line shows
            theoretical maximum throughput for the selected facility.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TheDropdownMenu
            label={stepOptions.find((opt) => opt.value === selectedStep)?.label || 'Select Step'}
            items={stepOptions}
            onSelect={(option) => setSelectedStep(option.value)}
          />
          <TheDropdownMenu
            label={facilityOptions.find((opt) => opt.value === selectedFacility)?.label || 'Select Facility'}
            items={facilityOptions}
            onSelect={(option) => setSelectedFacility(option.value)}
          />
        </div>
      </div>

      {facilityChart ? (
        <div className="mt-6 space-y-6">
          <div className="-mx-2 overflow-x-auto px-2">
            {plotConfig ? (
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
            ) : null}
          </div>

          <div className="grid gap-4 rounded-md bg-surface-50 p-4 md:grid-cols-2 lg:grid-cols-4">
            <Statistic label="Total demand" value={`${formatNumberWithComma(summary?.totalDemand ?? 0)} pax`} />
            <Statistic label="Total processed" value={`${formatNumberWithComma(summary?.totalProcessed ?? 0)} pax`} />
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
      ) : (
        <HomeNoData />
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
