'use client';

import { useMemo, useState } from 'react';
import { Ban, ChevronDown, ChevronRight, Clock, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import type {
  FacilityBreakdownItem,
  MissedFlightItem,
  MissedFlightStepStats,
  MissedFlightsData,
  StepSaturation,
} from '@/types/homeTypes';

interface MissedPaxModalProps {
  open: boolean;
  onClose: () => void;
  data?: MissedFlightsData;
  isLoading?: boolean;
  totalMissed: number;
}

function fmtSec(s: number | null | undefined): string {
  if (s == null) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function flightLabel(f: MissedFlightItem): string {
  if (f.flight_number) return f.flight_number;
  return f.departure_time ? `${f.carrier} ${f.departure_time}` : f.carrier;
}

// risk_level → dot color (시맨틱 토큰만 사용)
const RISK_DOT: Record<string, string> = {
  high:   'bg-destructive',
  medium: 'bg-warning',
  low:    'bg-success',
};


// ─── Saturation Card ─────────────────────────────────────────
function SaturationCard({ saturation }: { saturation: StepSaturation }) {
  const { total_counters, occupied_counters, all_occupied, competing_pax } = saturation;
  const occupancyPct = total_counters > 0 ? Math.round((occupied_counters / total_counters) * 100) : 0;

  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-destructive">
          {all_occupied
            ? `All ${total_counters} counters occupied`
            : `${occupied_counters} / ${total_counters} counters occupied`}
        </span>
        <span className="text-default-400 tabular-nums">{occupancyPct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-destructive/60 transition-all duration-500"
          style={{ width: `${occupancyPct}%` }}
        />
      </div>
      <p className="text-xs text-default-500">
        <span className="font-semibold text-default-700 tabular-nums">{competing_pax.toLocaleString()}</span>
        {' '}other passengers occupying counters during this window
      </p>
    </div>
  );
}

// ─── Facility Bar Chart (Zone 그룹 + avg wait 바) ────────────
function FacilityBarChart({
  breakdown,
  eligibleCount,
}: {
  breakdown: Record<string, FacilityBreakdownItem>;
  eligibleCount: number | null;
}) {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  const entries = Object.entries(breakdown).filter(([id]) => id !== '_no_counter');
  if (entries.length === 0) return null;

  const maxWait = Math.max(...entries.map(([, v]) => v.avg_queue_wait_s ?? 0), 1);

  const zoneMap: Record<string, { items: [string, FacilityBreakdownItem][]; totalPax: number; avgWait: number | null }> = {};
  for (const [facId, item] of entries) {
    const zone = item.zone ?? 'OTHER';
    if (!zoneMap[zone]) zoneMap[zone] = { items: [], totalPax: 0, avgWait: null };
    zoneMap[zone].items.push([facId, item]);
    zoneMap[zone].totalPax += item.pax_count;
  }
  for (const z of Object.values(zoneMap)) {
    const weighted = z.items.reduce((sum, [, v]) => sum + (v.avg_queue_wait_s ?? 0) * v.pax_count, 0);
    const total    = z.items.reduce((sum, [, v]) => sum + v.pax_count, 0);
    z.avgWait = total > 0 ? Math.round(weighted / total) : null;
  }

  const toggleZone = (z: string) =>
    setExpandedZones((prev) => {
      const n = new Set(prev);
      if (n.has(z)) {
        n.delete(z);
      } else {
        n.add(z);
      }
      return n;
    });

  const maxZoneWait = Math.max(...Object.values(zoneMap).map(z => z.avgWait ?? 0), 1);

  return (
    <div className="mt-1 space-y-1.5">
      {Object.entries(zoneMap).sort(([a], [b]) => a.localeCompare(b)).map(([zone, { items, totalPax, avgWait }]) => {
        const isExpanded   = expandedZones.has(zone);
        const zoneBarPct   = avgWait != null ? Math.min((avgWait / maxZoneWait) * 100, 100) : 0;
        const eligiblePct  = eligibleCount && eligibleCount > 0
          ? Math.min((totalPax / eligibleCount) * 100, 100) : null;

        return (
          <div key={zone} className="rounded-md border border-input overflow-hidden">
            <button
              onClick={() => toggleZone(zone)}
              className="flex w-full items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-default-700">{zone}</span>
              <div className="flex-1 relative h-3 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${zoneBarPct}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-default-500">
                {avgWait != null ? `${Math.round(avgWait / 60)}m avg` : '—'}
              </span>
              <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums text-default-700">
                {totalPax.toLocaleString()}
                {eligiblePct != null && (
                  <span className="ml-1 font-normal text-default-400">
                    ({eligiblePct.toFixed(0)}%)
                  </span>
                )}
              </span>
              <span className="shrink-0 text-default-400">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            </button>

            {isExpanded && (
              <div className="divide-y divide-input">
                {items.map(([facId, item]) => {
                  const facBarPct = item.avg_queue_wait_s != null
                    ? Math.min((item.avg_queue_wait_s / maxWait) * 100, 100) : 0;
                  return (
                    <div key={facId} className="grid grid-cols-[120px_1fr_auto_auto] items-center gap-2 px-3 py-1.5 bg-background">
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-default-700 tabular-nums">{facId}</span>
                        {(item.first_served || item.last_served) && (
                          <span className="text-xs text-default-400">
                            {item.first_served ?? '?'} → {item.last_served ?? '?'}
                          </span>
                        )}
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/50 transition-all duration-500"
                          style={{ width: `${facBarPct}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-default-500">
                        {item.avg_queue_wait_s != null ? `${Math.round(item.avg_queue_wait_s / 60)}m` : '—'}
                      </span>
                      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-default-700">
                        {item.pax_count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

// ─── Process Row (accordion) ─────────────────────────────────
function ProcessRow({
  name,
  stats,
  isLast,
  isFirstFailed,
}: {
  name: string;
  stats: MissedFlightStepStats;
  isLast: boolean;
  timeBudgetS: number | null;
  isFirstFailed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    completed_avg_seconds, avg_margin_after_s, failure_type,
    no_facility_count, facility_breakdown, eligible_count,
  } = stats;

  const isNoFacility    = failure_type === 'no_facility';
  const isCascading     = failure_type === 'cascading';
  const isPureCascading = isCascading && no_facility_count === 0 && completed_avg_seconds == null;
  const hasBreakdown    = Object.keys(facility_breakdown ?? {}).length > 0;

  const stepLabel = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const failCount = no_facility_count;
  const failRate  = eligible_count && eligible_count > 0
    ? ((failCount / eligible_count) * 100).toFixed(1)
    : '0.0';

  const MAX_BAR_S    = 7200;
  const waitBarPct   = completed_avg_seconds != null && completed_avg_seconds > 0
    ? Math.min((completed_avg_seconds / MAX_BAR_S) * 100, 100) : 0;
  const marginBarPct = avg_margin_after_s != null && avg_margin_after_s > 0
    ? Math.min((avg_margin_after_s / MAX_BAR_S) * 100, 100) : 0;
  const isTight      = avg_margin_after_s != null && avg_margin_after_s < 1800;

  // dot: no_facility → destructive, pure cascading → dim, first-failed → warning, else → primary
  const dotClass = isNoFacility
    ? 'border-destructive bg-destructive'
    : isPureCascading
    ? 'border-default-200 bg-default-100'
    : isFirstFailed
    ? 'border-warning bg-warning/60'
    : 'border-primary bg-primary';

  return (
    <div className="relative pl-8">
      {!isLast && <span className="absolute left-3 top-5 bottom-0 w-px bg-input" />}
      <span className={`absolute left-1.5 top-2.5 h-3 w-3 rounded-full border-2 ${dotClass}`} />

      <div className="pb-4">
        {/* Step name + badge + chevron */}
        <button
          className={`flex w-full items-center gap-2 text-left ${hasBreakdown ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => hasBreakdown && setExpanded(v => !v)}
          disabled={!hasBreakdown}
        >
          <span className={`text-sm font-semibold ${
            isNoFacility ? 'text-destructive' : isPureCascading ? 'text-default-400' : 'text-default-900'
          }`}>
            {stepLabel}
          </span>

          {eligible_count != null && !isPureCascading && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
              failCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
            }`}>
              {failCount.toLocaleString()}/{eligible_count.toLocaleString()} ({failRate}%)
            </span>
          )}

          {hasBreakdown && (
            <span className="ml-auto shrink-0 text-default-400">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          )}
        </button>

        {/* Progress bars */}
        {!isPureCascading && (waitBarPct > 0 || marginBarPct > 0) && (
          <div className="mt-2 space-y-1">
            {waitBarPct > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs text-default-400">avg wait</span>
                <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNoFacility || isCascading ? 'bg-destructive/70' : 'bg-primary/70'
                    }`}
                    style={{ width: `${waitBarPct}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-default-500">
                  {fmtSec(completed_avg_seconds)}
                </span>
              </div>
            )}
            {marginBarPct > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs text-default-400">to dep</span>
                <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTight ? 'bg-destructive/50' : 'bg-success/60'
                    }`}
                    style={{ width: `${marginBarPct}%` }}
                  />
                </div>
                <span className={`w-12 shrink-0 text-right text-xs tabular-nums ${isTight ? 'text-destructive' : 'text-default-500'}`}>
                  {fmtSec(avg_margin_after_s)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Accordion */}
        {expanded && hasBreakdown && (
          <div className="mt-3 space-y-3">
            {(stats.no_counter_count > 0 || stats.timing_count > 0) && (
              <div className="rounded-lg border border-input bg-muted/30 px-4 py-3 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-default-400">Failure causes</p>

                {stats.no_counter_count > 0 && (
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <Ban className="h-3 w-3 shrink-0 text-default-500" />
                      <span className="font-semibold text-default-700">
                        {stats.no_counter_count.toLocaleString()} pax · No counter assigned
                      </span>
                      {stats.no_counter_arrival && (
                        <span className="text-default-400">
                          arriving {stats.no_counter_arrival.earliest} – {stats.no_counter_arrival.latest}
                        </span>
                      )}
                    </div>
                    {stats.saturation && (
                      <div className="ml-5 mt-2 border-l-2 border-input pl-3">
                        <SaturationCard saturation={stats.saturation} />
                      </div>
                    )}
                  </div>
                )}

                {stats.timing_count > 0 && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <Clock className="h-3 w-3 shrink-0 text-default-500" />
                    <span className="font-semibold text-default-700">
                      {stats.timing_count.toLocaleString()} pax · Arrived too late to process
                    </span>
                    {stats.timing_arrival && (
                      <span className="text-default-400">
                        arriving {stats.timing_arrival.earliest} – {stats.timing_arrival.latest}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-input bg-muted/30 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-400">Counter usage</p>
              <FacilityBarChart breakdown={facility_breakdown} eligibleCount={eligible_count ?? null} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flight Detail (right panel) ────────────────────────────
function FlightDetail({ flight }: { flight: MissedFlightItem }) {
  const stepEntries = Object.entries(flight.steps);

  return (
    <div className="flex-1 overflow-y-auto px-7 py-6">
      <h2 className="text-2xl font-semibold tracking-tight text-default-900">{flightLabel(flight)}</h2>
      <p className="mt-0.5 text-sm text-default-500">
        {[flight.carrier_name, flight.departure_date, flight.departure_time && `Dep ${flight.departure_time}`]
          .filter(Boolean).join(' · ')}
      </p>

      {/* Summary strip */}
      <div className="mt-3 mb-6 rounded-lg border border-input bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <span>
            <span className="text-xl font-bold text-destructive">{flight.failed.toLocaleString()}</span>
            <span className="ml-1 text-default-500">/ {flight.total.toLocaleString()} pax missed</span>
            <span className="ml-2 text-default-400">({(flight.failed_rate * 100).toFixed(1)}%)</span>
          </span>
          {flight.first_failed_step && (
            <span className="flex items-center gap-1 text-default-500">
              first blocked at
              <span className="font-medium text-default-900">
                {flight.first_failed_step.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </span>
          )}
          {flight.time_budget_seconds != null && (
            <span className="text-default-400">· avg {fmtSec(flight.time_budget_seconds)} from show-up to dep</span>
          )}
        </div>
      </div>


      {/* Process flow */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-default-400">Process Flow</p>
      <div>
        {stepEntries.map(([stepName, stats], idx) => (
          <ProcessRow
            key={stepName}
            name={stepName}
            stats={stats}
            isLast={idx === stepEntries.length - 1}
            timeBudgetS={flight.time_budget_seconds}
            isFirstFailed={stepName === flight.first_failed_step}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────
export default function MissedPaxModal({ open, onClose, data, isLoading, totalMissed }: MissedPaxModalProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [collapsedCarriers, setCollapsedCarriers] = useState<Set<string>>(new Set());

  const flights = useMemo(() => data?.flights ?? [], [data?.flights]);
  const selectedFlight = flights.find(f => f.flight_key === selectedKey) ?? flights[0] ?? null;

  const grouped = useMemo(() => {
    const map: Record<string, { name: string; flights: MissedFlightItem[] }> = {};
    for (const f of flights) {
      if (!map[f.carrier]) map[f.carrier] = { name: f.carrier_name ?? f.carrier, flights: [] };
      map[f.carrier].flights.push(f);
    }
    for (const g of Object.values(map)) g.flights.sort((a, b) => b.failed - a.failed);
    return Object.entries(map).sort(([, a], [, b]) => a.name.localeCompare(b.name));
  }, [flights]);

  const toggleCarrier = (code: string) =>
    setCollapsedCarriers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col gap-0 overflow-hidden p-0
          fixed top-4 bottom-4 left-1/2 -translate-x-1/2 translate-y-0
          w-[calc(100vw-2rem)] max-w-5xl h-[calc(100vh-2rem)]
          rounded-xl border border-input bg-background shadow-lg"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-input px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-default-900">
                Missed Passengers Analysis
              </DialogTitle>
              <p className="mt-0.5 text-sm text-default-500">
                {totalMissed.toLocaleString()} pax missed · {flights.length} flights affected
              </p>
            </div>
            <DialogClose className="rounded p-1 opacity-60 transition-opacity hover:opacity-100">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={24} />
          </div>
        ) : flights.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-default-500">
            No missed passenger data available.
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel */}
            <div className="w-56 shrink-0 overflow-y-auto border-r border-input">
              {grouped.map(([carrierCode, { name, flights: cFlights }]) => {
                const isCollapsed = collapsedCarriers.has(carrierCode);
                return (
                  <div key={carrierCode}>
                    <button
                      onClick={() => toggleCarrier(carrierCode)}
                      className="flex w-full items-center justify-between border-b border-input bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <span className="truncate text-xs font-semibold uppercase tracking-wide text-default-600">
                        {name}
                      </span>
                      {isCollapsed
                        ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-default-400" />
                        : <ChevronDown  className="h-3.5 w-3.5 shrink-0 text-default-400" />
                      }
                    </button>

                    {!isCollapsed && cFlights.map(f => {
                      const isSelected = (selectedKey ?? flights[0]?.flight_key) === f.flight_key;
                      return (
                        <button
                          key={f.flight_key}
                          onClick={() => setSelectedKey(f.flight_key)}
                          className={`flex w-full items-center justify-between gap-2 border-b border-input px-4 py-2 text-left transition-colors ${
                            isSelected ? 'border-l-2 border-l-primary bg-primary-50' : 'hover:bg-muted/60'
                          }`}
                        >
                          <span className="truncate text-sm font-medium tabular-nums text-default-900">
                            {flightLabel(f)}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-destructive tabular-nums">
                              {f.failed.toLocaleString()}
                            </span>
                            <span className={`h-2 w-2 rounded-full ${RISK_DOT[f.risk_level]}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Right panel */}
            {selectedFlight
              ? <FlightDetail flight={selectedFlight} />
              : <div className="flex flex-1 items-center justify-center text-sm text-default-500">Select a flight.</div>
            }
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
