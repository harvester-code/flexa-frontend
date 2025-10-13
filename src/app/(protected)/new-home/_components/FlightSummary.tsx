import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FlightSummaryResponse, ScenarioData } from '@/types/homeTypes';
import HomeLoading from '@/app/(protected)/home/_components/HomeLoading';
import HomeNoScenario from '@/app/(protected)/home/_components/HomeNoScenario';
import HomeNoData from '@/app/(protected)/home/_components/HomeNoData';
import FlightDestinationMap from './FlightDestinationMap';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

interface FlightSummaryProps {
  scenario: ScenarioData | null;
  summary?: FlightSummaryResponse;
  isLoading?: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-US');
const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function FlightSummary({ scenario, summary, isLoading }: FlightSummaryProps) {
  const summaryHours = summary?.hours ?? [];
  const hourlyChartData = useMemo(() => {
    if (!summaryHours.length) {
      return [];
    }

    return [
      {
        type: 'bar',
        x: summaryHours.map((item) => item.label ?? `${item.hour.toString().padStart(2, '0')}:00`),
        y: summaryHours.map((item) => item.flights),
        marker: { color: '#22c55e' },
        hoverinfo: 'text',
        hovertext: summaryHours.map(
          (item) =>
            `<b>${item.label ?? `${item.hour.toString().padStart(2, '0')}:00`}</b><br/>Flights: ${numberFormatter.format(
              item.flights
            )}`
        ),
      } as any,
    ];
  }, [summaryHours]);

  const hourlyChartLayout = useMemo(
    () => ({
      height: 320,
      margin: { l: 60, r: 30, t: 24, b: 60 },
      xaxis: {
        title: { text: 'Departure Hour' },
        tickangle: -45,
        tickfont: { size: 11 },
      },
      yaxis: {
        title: { text: 'Flights' },
        tickformat: ',d',
        rangemode: 'tozero' as const,
      },
      bargap: 0.2,
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
    }),
    []
  );

  const classDistribution = summary?.classDistribution ?? [];
  const classChartData = useMemo(() => {
    if (!classDistribution.length) {
      return [];
    }

    return [
      {
        type: 'bar',
        x: classDistribution.map((item) => item.label || item.class || 'Unknown'),
        y: classDistribution.map((item) => Number((item.ratio * 100).toFixed(2))),
        marker: { color: '#2563eb' },
        text: classDistribution.map((item) => `${(item.ratio * 100).toFixed(1)}%`),
        textposition: 'outside',
        hoverinfo: 'text',
        hovertext: classDistribution.map(
          (item) =>
            `<b>${item.label || item.class || 'Unknown'}</b><br/>Flights: ${numberFormatter.format(
              item.flights
            )}<br/>Share: ${percentFormatter.format(item.ratio)}`
        ),
      } as any,
    ];
  }, [classDistribution]);

  const classChartLayout = useMemo(
    () => ({
      height: 320,
      margin: { l: 60, r: 30, t: 24, b: 60 },
      xaxis: {
        title: { text: 'Aircraft Class' },
        tickfont: { size: 12 },
      },
      yaxis: {
        title: { text: 'Share (%)' },
        tickformat: ',.0f',
        rangemode: 'tozero' as const,
      },
      bargap: 0.3,
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
    }),
    []
  );

  const carrierRows = summary?.carriers ?? [];
  const flightRows = summary?.flights ?? [];

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!summary) {
    return <HomeNoData />;
  }

  const totals = summary.totals;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-input bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-default-500">Total Flights</p>
          <p className="mt-2 text-2xl font-semibold text-default-900">{numberFormatter.format(totals.flights)}</p>
        </div>
        <div className="rounded-md border border-input bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-default-500">Total Passengers</p>
          <p className="mt-2 text-2xl font-semibold text-default-900">{numberFormatter.format(totals.passengers)}</p>
        </div>
        <div className="rounded-md border border-input bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-default-500">Carriers</p>
          <p className="mt-2 text-2xl font-semibold text-default-900">{numberFormatter.format(totals.carriers)}</p>
        </div>
        <div className="rounded-md border border-input bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-default-500">Operation Window</p>
          <p className="mt-2 text-sm text-default-900">
            {totals.firstDeparture ? totals.firstDeparture.replace('T', ' ') : 'N/A'}
          </p>
          <p className="text-sm text-default-900">
            {totals.lastDeparture ? totals.lastDeparture.replace('T', ' ') : 'N/A'}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-input bg-white p-5">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-semibold">Hourly Departure Trend</h6>
          <p className="text-xs text-default-500">Flights departing each hour (local time)</p>
        </div>
        <div className="mt-6">
          <BarChart
            chartData={hourlyChartData}
            chartLayout={hourlyChartLayout}
            config={{ responsive: true, displaylogo: false }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-input bg-white p-5">
          <div className="flex items-center justify-between">
            <h6 className="text-base font-semibold">Carriers</h6>
            <p className="text-xs text-default-500">Top carriers by flight count</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-default-500">
                <tr>
                  <th className="px-4 py-2 text-left">Carrier</th>
                  <th className="px-4 py-2 text-right">Flights</th>
                  <th className="px-4 py-2 text-right">Passengers</th>
                  <th className="px-4 py-2 text-left">Top Destination</th>
                  <th className="px-4 py-2 text-left">Top Aircraft</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-default-700">
                {carrierRows.map((carrier) => (
                  <tr key={carrier.label}>
                    <td className="px-4 py-2 font-medium text-default-900">{carrier.label}</td>
                    <td className="px-4 py-2 text-right">{numberFormatter.format(carrier.flights)}</td>
                    <td className="px-4 py-2 text-right">{numberFormatter.format(carrier.passengers)}</td>
                    <td className="px-4 py-2 text-sm">
                      {carrier.topDestination.airport ? (
                        <div>
                          <p className="font-medium text-default-900">{carrier.topDestination.airport}</p>
                          <p className="text-xs text-default-500">
                            {carrier.topDestination.city || ''}{' '}
                            {carrier.topDestination.country ? `(${carrier.topDestination.country})` : ''}
                          </p>
                          <p className="text-xs text-default-400">
                            {numberFormatter.format(carrier.topDestination.flights)} flights
                          </p>
                        </div>
                      ) : (
                        <span className="text-default-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-default-500">
                      {carrier.topAircraft.length ? (
                        carrier.topAircraft.map((aircraft) => (
                          <div key={`${carrier.label}-${aircraft.type}`} className="flex items-center justify-between">
                            <span className="text-default-900">{aircraft.type}</span>
                            <span>{numberFormatter.format(aircraft.flights)} flights</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-default-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {classDistribution.length ? (
          <div className="rounded-md border border-input bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-base font-semibold">Aircraft Class Mix</h6>
                <p className="text-xs text-default-500">
                  Share of flights by aircraft class ({numberFormatter.format(totals.flights)} flights)
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <BarChart
                  chartData={classChartData}
                  chartLayout={classChartLayout}
                  config={{ responsive: true, displaylogo: false }}
                />
              </div>
              <div className="flex flex-col gap-3">
                {classDistribution.map((item) => (
                  <div
                    key={`${item.class || item.label || 'unknown'}-${item.flights}`}
                    className="rounded-md border border-muted/60 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-default-900">
                      <span>{item.label || item.class || 'Unknown'}</span>
                      <span>{percentFormatter.format(item.ratio)}</span>
                    </div>
                    <p className="mt-1 text-xs text-default-500">
                      {numberFormatter.format(item.flights)} flights
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-md border border-input bg-white p-5">
          <FlightDestinationMap flights={flightRows} />
        </div>
      </div>
    </div>
  );
}

export default FlightSummary;
