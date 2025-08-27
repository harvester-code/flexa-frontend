'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plane, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface Airline {
  iata: string;
  name: string;
}

interface AirlineSelectorProps {
  availableAirlines: Airline[];
  usedAirlineIatas: Set<string>;
  onMakeGroup: (selectedAirlines: Airline[]) => void;
}

export default function TabPassengerScheduleAirlineSelector({
  availableAirlines,
  usedAirlineIatas,
  onMakeGroup,
}: AirlineSelectorProps) {
  const [selectedAirlines, setSelectedAirlines] = useState<Airline[]>([]);

  // 사용 가능한 항공사 목록 (이미 사용된 것과 현재 선택된 것 제외, 중복 제거)
  const selectableAirlines = useMemo(() => {
    const selectedIatas = new Set(selectedAirlines.map((airline) => airline.iata));
    const seenIatas = new Set<string>();

    return availableAirlines.filter((airline) => {
      // 이미 사용된 항공사나 현재 선택된 항공사 제외
      if (usedAirlineIatas.has(airline.iata) || selectedIatas.has(airline.iata)) {
        return false;
      }

      // 중복된 IATA 코드 제거
      if (seenIatas.has(airline.iata)) {
        return false;
      }

      seenIatas.add(airline.iata);
      return true;
    });
  }, [availableAirlines, usedAirlineIatas, selectedAirlines]);

  // 항공사 선택 (좌측에서 우측으로)
  const selectAirline = (airline: Airline) => {
    setSelectedAirlines((prev) => {
      // 중복 방지
      if (prev.some((selected) => selected.iata === airline.iata)) {
        return prev;
      }
      return [...prev, airline];
    });
  };

  // 항공사 선택 해제 (우측에서 좌측으로)
  const deselectAirline = (airlineIata: string) => {
    setSelectedAirlines((prev) => prev.filter((airline) => airline.iata !== airlineIata));
  };

  // Add All 기능
  const addAllAirlines = () => {
    setSelectedAirlines((prev) => [...prev, ...selectableAirlines]);
  };

  // Remove All 기능
  const removeAllAirlines = () => {
    setSelectedAirlines([]);
  };

  // Make Group 버튼 핸들러
  const handleMakeGroup = () => {
    if (selectedAirlines.length > 0) {
      onMakeGroup(selectedAirlines);
      setSelectedAirlines([]); // 선택된 항공사 초기화
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-default-900">Available Airlines</div>
              <p className="text-sm font-normal text-default-500">Select airlines to create a new group</p>
            </div>
          </CardTitle>
          <Button
            onClick={handleMakeGroup}
            disabled={selectedAirlines.length === 0}
            className="bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300"
          >
            Make Group ({selectedAirlines.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Available Airlines */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-default-900">Available ({selectableAirlines.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={addAllAirlines}
                disabled={selectableAirlines.length === 0}
                className="h-7 px-2 text-xs"
              >
                Add All
              </Button>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {selectableAirlines.map((airline, index) => (
                <div
                  key={`available-${airline.iata}-${index}`}
                  onClick={() => selectAirline(airline)}
                  className="flex cursor-pointer items-center justify-between rounded border border-gray-200 bg-gray-50 p-2 transition-colors hover:bg-gray-100"
                >
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-sm font-medium text-default-900">{airline.iata}</span>
                    <span className="truncate text-xs text-default-500">{airline.name}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              ))}
              {selectableAirlines.length === 0 && (
                <div className="rounded border-2 border-dashed border-gray-300 p-6 text-center">
                  <p className="text-sm text-default-500">No more airlines available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Airlines */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-default-900">Selected ({selectedAirlines.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={removeAllAirlines}
                disabled={selectedAirlines.length === 0}
                className="h-7 px-2 text-xs"
              >
                Remove All
              </Button>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {selectedAirlines.length === 0 ? (
                <div className="rounded border-2 border-dashed border-gray-300 p-6 text-center">
                  <p className="text-sm text-default-500">Select airlines from the left</p>
                </div>
              ) : (
                selectedAirlines.map((airline, index) => (
                  <div
                    key={`selected-${airline.iata}-${index}`}
                    onClick={() => deselectAirline(airline.iata)}
                    className="flex cursor-pointer items-center justify-between rounded bg-primary p-2 shadow transition-colors hover:bg-primary/90"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-sm font-medium text-white">{airline.iata}</span>
                      <span className="truncate text-xs text-white/80">{airline.name}</span>
                    </div>
                    <ChevronLeft className="h-3 w-3 text-white/70" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
