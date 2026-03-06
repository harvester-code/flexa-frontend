'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useSimulationStore } from '../../_stores';
import Spinner from '@/components/ui/Spinner';
import AirportSelector from './AirportSelector';


interface FlightDataLoaderProps {
  loadingFlightSchedule: boolean;
  setIsSomethingChanged: (changed: boolean) => void;
  onLoadData: (airport: string, date: string) => void;
  isEmbedded?: boolean;
  // Multi-tab controlled mode
  controlledAirport?: string;
  controlledDate?: string;
  onAirportChange?: (airport: string) => void;
  onDateChange?: (date: string) => void;
  skipStoreSync?: boolean;
}

function FlightDataLoader({
  loadingFlightSchedule,
  setIsSomethingChanged,
  onLoadData,
  isEmbedded = false,
  controlledAirport,
  controlledDate,
  onAirportChange,
  onDateChange,
  skipStoreSync = false,
}: FlightDataLoaderProps) {
  const storeAirport = useSimulationStore((s) => s.context.airport);
  const storeDate = useSimulationStore((s) => s.context.date);
  const setStoreAirport = useSimulationStore((s) => s.setAirport);
  const setStoreDate = useSimulationStore((s) => s.setDate);
  const resetPassenger = useSimulationStore((s) => s.resetPassenger);
  const resetProcessFlow = useSimulationStore((s) => s.resetProcessFlow);

  const isControlled = controlledAirport !== undefined;
  const [airport, setAirport] = useState(isControlled ? controlledAirport : storeAirport);
  const [date, setDate] = useState(isControlled && controlledDate ? controlledDate : storeDate);
  const [openCalendarPopover, setOpenCalendarPopover] = useState(false);

  useEffect(() => {
    if (isControlled) {
      setAirport(controlledAirport);
    } else {
      setAirport(storeAirport);
    }
  }, [isControlled, controlledAirport, storeAirport]);

  useEffect(() => {
    if (isControlled && controlledDate) {
      setDate(controlledDate);
    }
  }, [isControlled, controlledDate]);

  const handleAirportChange = (value: string) => {
    setIsSomethingChanged(airport !== value);
    setAirport(value);
    onAirportChange?.(value);
  };

  const handleDateChange = (selectedDate: Date) => {
    const formatted = dayjs(selectedDate).format('YYYY-MM-DD');
    setIsSomethingChanged(date !== formatted);
    setDate(formatted);
    onDateChange?.(formatted);
    setOpenCalendarPopover(false);
  };

  const handleLoad = () => {
    if (!skipStoreSync) {
      resetPassenger();
      resetProcessFlow();
      setStoreAirport(airport);
      setStoreDate(date);
    }
    onLoadData(airport, date);
  };

  if (isEmbedded) {
    return (
      <div className="flex items-center gap-4">
          <div className="flex-1">
            <AirportSelector
              value={airport}
              onChange={handleAirportChange}
            />
          </div>

          <div className="flex items-center gap-4">
            <Popover open={openCalendarPopover} onOpenChange={setOpenCalendarPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dayjs(date).format('MMM DD, YYYY')}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={dayjs(date).toDate()}
                  defaultMonth={dayjs(date).toDate()}
                  onSelect={(selectedDate) => {
                    if (selectedDate) handleDateChange(selectedDate);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleLoad}
              disabled={loadingFlightSchedule || !airport}
              className="min-w-24 overflow-hidden"
            >
              <span className="flex items-center">
                {loadingFlightSchedule ? (
                  <>
                    <Spinner size={16} className="mr-2 shrink-0" />
                    <span className="truncate">Loading...</span>
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Load</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
    );
  }

  // 독립 모드일 때는 Card 래퍼 포함
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="rounded-lg bg-primary/10 p-2">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Flight Schedule Data</div>
            <p className="text-sm font-normal text-default-500">Select airport and date to load flight data</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <AirportSelector
              value={airport}
              onChange={handleAirportChange}
            />
          </div>

          <div className="flex items-center gap-4">
            <Popover open={openCalendarPopover} onOpenChange={setOpenCalendarPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dayjs(date).format('MMM DD, YYYY')}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={dayjs(date).toDate()}
                  defaultMonth={dayjs(date).toDate()}
                  onSelect={(selectedDate) => {
                    if (selectedDate) handleDateChange(selectedDate);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleLoad}
              disabled={loadingFlightSchedule || !airport}
              className="min-w-24 overflow-hidden"
            >
              <span className="flex items-center">
                {loadingFlightSchedule ? (
                  <>
                    <Spinner size={16} className="mr-2 shrink-0" />
                    <span className="truncate">Loading...</span>
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Load</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(FlightDataLoader);
