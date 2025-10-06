import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Option, PassengerSummaryResponse, ScenarioData } from '@/types/homeTypes';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';
import HomeNoData from './HomeNoData';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

const DIMENSION_OPTIONS: Option[] = [
  { label: 'Carrier', value: 'carrier' },
  { label: 'City', value: 'city' },
  { label: 'Country', value: 'country' },
];

type Dimension = 'carrier' | 'city' | 'country';

interface RankingRecord {
  label: string;
  passengers: number;
  subtitle?: string;
  metaLines: string[];
}

interface HomePassengerSummaryProps {
  scenario: ScenarioData | null;
  summary?: PassengerSummaryResponse;
  isLoading?: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-US');

function HomePassengerSummary({ scenario, summary, isLoading }: HomePassengerSummaryProps) {
  const [dimension, setDimension] = useState<Dimension>('carrier');

  const rankingRecords = useMemo<RankingRecord[]>(() => {
    if (!summary) return [];

    if (dimension === 'carrier') {
      return (summary.dimensions.carrier || []).map((item) => ({
        label: item.label ?? 'Unknown Carrier',
        passengers: item.passengers,
        subtitle: `${item.flights} flights • ${item.destinations} destinations`,
        metaLines: item.topDestination.airport
          ? [
              `Top route: ${item.topDestination.city || item.topDestination.airport} (${item.topDestination.country || 'Unknown'})`,
              `${numberFormatter.format(item.topDestination.passengers)} pax (${(item.topDestination.share * 100).toFixed(1)}%)`,
            ]
          : [],
      }));
    }

    if (dimension === 'city') {
      return (summary.dimensions.city || []).map((item) => ({
        label: item.label ? `${item.label}` : 'Unknown City',
        passengers: item.passengers,
        subtitle: item.country ? `${item.country}` : undefined,
        metaLines: [`${item.airports} airports`],
      }));
    }

    return (summary.dimensions.country || []).map((item) => ({
      label: item.label ?? 'Unknown Country',
      passengers: item.passengers,
      subtitle: undefined,
      metaLines: [`${item.airports} airports`],
    }));
  }, [summary, dimension]);

  const chartData = useMemo(() => {
    if (!rankingRecords.length) return [];

    const labels = rankingRecords.map((record) => record.label);
    const passengers = rankingRecords.map((record) => record.passengers);
    const hovertexts = rankingRecords.map((record, index) => {
      const lines = [
        `<b>${record.label}</b>`,
        `${numberFormatter.format(passengers[index])} passengers`,
      ];
      if (record.subtitle) {
        lines.push(record.subtitle);
      }
      if (record.metaLines.length > 0) {
        lines.push(...record.metaLines);
      }
      return lines.join('<br>');
    });

    return [
      {
        type: 'bar',
        orientation: 'h',
        x: passengers,
        y: labels,
        text: passengers.map((value) => numberFormatter.format(value)),
        textposition: 'outside',
        textfont: {
          color: '#111827',
          size: 12,
        },
        hoverinfo: 'text',
        hovertext: hovertexts,
        marker: {
          color: '#6366f1',
          opacity: 0.9,
        },
      } as any,
    ];
  }, [rankingRecords]);

  const chartLayout = useMemo(() => {
    const height = Math.max(320, rankingRecords.length * 44 + 160);
    const marginLeft = rankingRecords.reduce((acc, record) => {
      return Math.max(acc, (record.label?.length ?? 0) * 8 + (record.subtitle ? 80 : 0));
    }, 160);

    return {
      margin: { l: Math.min(Math.max(marginLeft, 160), 320), r: 32, t: 24, b: 48 },
      height,
      xaxis: {
        title: 'Passengers',
        tickformat: ',d',
        zeroline: false,
        showgrid: true,
        gridcolor: '#e5e7eb',
        separatethousands: true,
      },
      yaxis: {
        automargin: true,
        tickfont: {
          size: 12,
        },
      },
      bargap: 0.2,
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      showlegend: false,
    } as any;
  }, [rankingRecords]);

  const totals = summary?.totals;

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!summary || rankingRecords.length === 0) {
    return <HomeNoData />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 pl-5 pr-5">
        <h5 className="flex h-[50px] items-center text-lg font-semibold">Passenger Demand</h5>
        {totals ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-default-500">
            <span>Total Passengers: {numberFormatter.format(totals.passengers)}</span>
            {totals.flightDates.length > 0 ? (
              <span>Flight Dates: {totals.flightDates.join(', ')}</span>
            ) : null}
            {totals.showUpWindow.start && totals.showUpWindow.end ? (
              <span>
                Show-up Window: {totals.showUpWindow.start.replace('T', ' ')} –{' '}
                {totals.showUpWindow.end.replace('T', ' ')}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        <div className="chart-header-container">
          <div className="chart-header-buttons">
            <ToggleButtonGroup
              options={DIMENSION_OPTIONS}
              selectedValue={dimension}
              onSelect={(option) => setDimension(option.value as Dimension)}
              labelExtractor={(option) => option.label}
            />
          </div>
        </div>
        <div className="mt-10">
          <BarChart
            chartData={chartData}
            chartLayout={chartLayout}
            config={{ displaylogo: false, responsive: true }}
          />
        </div>
        {rankingRecords.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {rankingRecords.slice(0, 4).map((record) => (
              <div
                key={record.label}
                className="rounded-md border border-muted px-4 py-3 text-sm text-default-600"
              >
                <p className="font-medium text-default-900">{record.label}</p>
                {record.subtitle ? (
                  <p className="mt-1 text-xs text-default-500">{record.subtitle}</p>
                ) : null}
                <p className="mt-2 text-lg font-semibold text-default-900">
                  {numberFormatter.format(record.passengers)} pax
                </p>
                {record.metaLines.map((line, index) => (
                  <p key={`${record.label}-meta-${index}`} className="mt-1 text-xs text-default-500">
                    {line}
                  </p>)
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default HomePassengerSummary;
