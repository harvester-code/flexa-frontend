'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { FlightDetailSummary } from '@/types/homeTypes';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center text-muted-foreground">Loading map…</div>
  ),
}) as any;

const BarChart = dynamic(() => import('@/components/charts/BarChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center text-muted-foreground">Loading chart…</div>
  ),
}) as any;

interface FlightDestinationMapProps {
  flights: FlightDetailSummary[];
}

interface DestinationAggregate {
  country: string;
  flights: number;
  passengers: number;
  airportCount: number;
  averageSeats: number | null;
}

const numberFormatter = new Intl.NumberFormat('en-US');

function FlightDestinationMap({ flights }: FlightDestinationMapProps) {
  const destinationAggregates = useMemo<DestinationAggregate[]>(() => {
    if (!flights?.length) return [];

    const aggregates = new Map<
      string,
      { flights: number; passengers: number; airports: Set<string>; seatsTotal: number; seatSamples: number }
    >();

    flights.forEach((flight) => {
      const country = flight.arrival.country;
      if (!country) return;

      const existing = aggregates.get(country) ?? {
        flights: 0,
        passengers: 0,
        airports: new Set<string>(),
        seatsTotal: 0,
        seatSamples: 0,
      };

      existing.flights += 1;
      existing.passengers += flight.passengers || 0;
      if (flight.arrival.airport) {
        existing.airports.add(flight.arrival.airport);
      }

      const totalSeats = flight.totalSeats;
      if (typeof totalSeats === 'number' && Number.isFinite(totalSeats)) {
        existing.seatsTotal += totalSeats;
        existing.seatSamples += 1;
      }

      aggregates.set(country, existing);
    });

    return Array.from(aggregates.entries())
      .map(([country, value]) => ({
        country,
        flights: value.flights,
        passengers: value.passengers,
        airportCount: value.airports.size,
        averageSeats: value.seatSamples > 0 ? value.seatsTotal / value.seatSamples : null,
      }))
      .sort((a, b) => b.flights - a.flights);
  }, [flights]);

  const mapData = useMemo(() => {
    if (!destinationAggregates.length) return [];

    return [
      {
        type: 'choropleth',
        locationmode: 'country names',
        locations: destinationAggregates.map((item) => item.country),
        z: destinationAggregates.map((item) => item.flights),
        text: destinationAggregates.map((item) => {
          const avgSeats =
            item.averageSeats !== null ? `${Math.round(item.averageSeats).toLocaleString()} seats avg` : 'Avg seats: N/A';
          return `${item.country}<br/>Flights: ${numberFormatter.format(item.flights)}<br/>Airports: ${numberFormatter.format(
            item.airportCount
          )}<br/>${avgSeats}`;
        }),
        hoverinfo: 'text',
        colorscale: 'Blues',
        marker: {
          line: { color: '#ffffff', width: 0.5 },
        },
        showscale: false,
      } as any,
    ];
  }, [destinationAggregates]);

  const mapLayout = useMemo(
    () => ({
      height: 460,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      geo: {
        projection: { type: 'natural earth' },
        showland: true,
        landcolor: '#f8fafc',
        showcountries: true,
        countrycolor: '#d1d5db',
        coastlinecolor: '#94a3b8',
        showcoastlines: true,
        lakecolor: '#bfdbfe',
        showlakes: true,
        // Avoid `fitbounds: "locations"`; Plotly 3.1 crashes when autoranging without cartesian axes
        showframe: false,
      },
    }),
    []
  );

  if (!destinationAggregates.length) {
    return <div className="flex h-64 items-center justify-center text-default-400">No destination data yet.</div>;
  }

  const topDestinations = destinationAggregates.slice(0, 12);

  const barChartData = useMemo(() => {
    if (!topDestinations.length) return [];

    return [
      {
        type: 'bar',
        orientation: 'h',
        x: topDestinations.map((item) => item.flights),
        y: topDestinations.map((item) => item.country),
        marker: { color: '#2563eb' },
        text: topDestinations.map((item) => numberFormatter.format(item.flights)),
        textposition: 'outside',
        hoverinfo: 'text',
        hovertext: topDestinations.map((item) => {
          const avgSeats =
            item.averageSeats !== null ? `${Math.round(item.averageSeats).toLocaleString()} seats avg` : 'Avg seats: N/A';
          return `${item.country}<br/>Flights: ${numberFormatter.format(item.flights)}<br/>Airports: ${numberFormatter.format(
            item.airportCount
          )}<br/>${avgSeats}`;
        }),
      } as any,
    ];
  }, [topDestinations]);

  const barLayout = useMemo(
    () => ({
      height: Math.max(300, topDestinations.length * 36 + 120),
      margin: { l: 140, r: 40, t: 24, b: 40 },
      xaxis: {
        title: 'Flights',
        tickformat: ',d',
        rangemode: 'tozero',
      },
      yaxis: {
        automargin: true,
        categoryorder: 'total ascending',
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      bargap: 0.2,
      showlegend: false,
    }),
    [topDestinations.length]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-default-900">Destination Map</p>
        <p className="text-xs text-default-500">Flights by arrival country</p>
      </div>

      <Plot
        data={mapData}
        layout={mapLayout}
        config={{ responsive: true, displaylogo: false, staticPlot: true }}
        style={{ width: '100%' }}
      />

      <div className="rounded-md border border-muted bg-white p-5">
        <h6 className="text-base font-semibold text-default-900">Top Destinations</h6>
        <p className="text-xs text-default-500">Flights by arrival country (top 12)</p>
        <div className="mt-6">
          <BarChart chartData={barChartData} chartLayout={barLayout} config={{ responsive: true, displaylogo: false }} />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-default-500 md:grid-cols-2">
          {topDestinations.map((item) => (
            <div key={item.country} className="flex justify-between rounded border border-muted px-3 py-2 text-default-700">
              <span className="font-medium text-default-900">{item.country}</span>
              <span>
                {numberFormatter.format(item.flights)} flights • {numberFormatter.format(item.airportCount)} airports
                {item.averageSeats !== null ? ` • Avg ${Math.round(item.averageSeats).toLocaleString()} seats` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FlightDestinationMap;
