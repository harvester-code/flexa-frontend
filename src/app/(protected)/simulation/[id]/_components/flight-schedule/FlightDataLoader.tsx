'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useSimulationStore } from '../../_stores';
import AirportSelector from './AirportSelector';


interface FlightDataLoaderProps {
  loadingFlightSchedule: boolean;
  setIsSomethingChanged: (changed: boolean) => void;
  onLoadData: (airport: string, date: string) => void;
  isEmbedded?: boolean; // 다른 컴포넌트 안에 임베드되었는지 여부
}

function FlightDataLoader({
  loadingFlightSchedule,
  setIsSomethingChanged,
  onLoadData,
  isEmbedded = false,
}: FlightDataLoaderProps) {
  // 🆕 초기값은 store에서 가져오되, 로컬 상태로 관리 (Load 버튼 클릭 시에만 저장)
  const storeAirport = useSimulationStore((s) => s.context.airport);
  const storeDate = useSimulationStore((s) => s.context.date);
  const setStoreAirport = useSimulationStore((s) => s.setAirport);
  const setStoreDate = useSimulationStore((s) => s.setDate);
  const resetPassenger = useSimulationStore((s) => s.resetPassenger);
  const resetProcessFlow = useSimulationStore((s) => s.resetProcessFlow);

  // 로컬 상태로 관리 (초기값은 store에서 가져오기)
  const [airport, setAirport] = useState(storeAirport);
  const [date, setDate] = useState(storeDate);
  const [openCalendarPopover, setOpenCalendarPopover] = useState(false);

  // 임베드 모드일 때는 Card 래퍼 없이 내용만 렌더링
  if (isEmbedded) {
    return (
      <div className="flex items-center gap-4">
          {/* Airport Selection - 70% width */}
          <div className="flex-1">
            <AirportSelector
              value={airport}
              onChange={(value) => {
                setIsSomethingChanged(airport !== value);
                setAirport(value);
              }}
            />
          </div>

          {/* Date Selection and Load Button - Right side */}
          <div className="flex items-center gap-4">
            {/* Date Selection */}
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
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setIsSomethingChanged(date !== dayjs(selectedDate).format('YYYY-MM-DD'));
                      setDate(dayjs(selectedDate).format('YYYY-MM-DD'));
                      setOpenCalendarPopover(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Load Button */}
            <Button
              onClick={() => {
                resetPassenger();
                resetProcessFlow();
                setStoreAirport(airport);
                setStoreDate(date);
                onLoadData(airport, date);
              }}
              disabled={loadingFlightSchedule || !airport}
              className="min-w-24 overflow-hidden"
            >
              <span className="flex items-center">
                {loadingFlightSchedule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
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
          {/* Airport Selection - 70% width */}
          <div className="flex-1">
            <AirportSelector
              value={airport}
              onChange={(value) => {
                setIsSomethingChanged(airport !== value);
                setAirport(value);
              }}
            />
          </div>

          {/* Date Selection and Load Button - Right side */}
          <div className="flex items-center gap-4">
            {/* Date Selection */}
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
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setIsSomethingChanged(date !== dayjs(selectedDate).format('YYYY-MM-DD'));
                      setDate(dayjs(selectedDate).format('YYYY-MM-DD'));
                      setOpenCalendarPopover(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Load Button */}
            <Button
              onClick={() => {
                resetPassenger();
                resetProcessFlow();
                setStoreAirport(airport);
                setStoreDate(date);
                onLoadData(airport, date);
              }}
              disabled={loadingFlightSchedule || !airport}
              className="min-w-24 overflow-hidden"
            >
              <span className="flex items-center">
                {loadingFlightSchedule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
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
