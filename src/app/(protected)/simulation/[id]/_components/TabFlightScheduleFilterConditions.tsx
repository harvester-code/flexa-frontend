'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown, Filter, Loader2, Minus, Plus, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Label } from '@/components/ui/Label';

// 로컬 인터페이스 (import된 것과 구분)
interface LocalSelectedConditions {
  types: string[];
  terminal: string[];
  selectedAirlines: Array<{ iata: string; name: string }>;
}

interface AvailableConditions {
  types: {
    International: Array<{ iata: string; name: string }>;
    Domestic: Array<{ iata: string; name: string }>;
  };
  terminals: Record<string, Array<{ iata: string; name: string }>>;
  airlines: Array<{ iata: string; name: string }>;
}

interface TabFlightScheduleFilterConditionsProps {
  showConditions: boolean;
  chartData: any;
  selectedConditions: LocalSelectedConditions;
  availableConditions: AvailableConditions;
  loadingFlightSchedule: boolean;
  setSelectedConditions: (selectedConditions: LocalSelectedConditions) => void;
  onApplyFilters: () => void;
}

function TabFlightScheduleFilterConditions({
  showConditions,
  chartData,
  selectedConditions: rawSelectedConditions,
  availableConditions,
  loadingFlightSchedule,
  setSelectedConditions: setSelectedConditionsZustand,
  onApplyFilters,
}: TabFlightScheduleFilterConditionsProps) {
  // 안전한 기본값 제공
  const selectedConditions = useMemo(
    () => ({
      types: rawSelectedConditions?.types || [],
      terminal: rawSelectedConditions?.terminal || [],
      selectedAirlines: rawSelectedConditions?.selectedAirlines || [],
    }),
    [rawSelectedConditions]
  );

  // 로컬에서 콜백 형태로 사용할 수 있도록 wrapper 함수 제공
  const setSelectedConditions = useCallback(
    (updater: ((prev: LocalSelectedConditions) => LocalSelectedConditions) | LocalSelectedConditions) => {
      if (typeof updater === 'function') {
        const newConditions = updater(selectedConditions);
        setSelectedConditionsZustand(newConditions as any); // 타입 캐스팅 (availableAirlines는 계산으로 처리)
      } else {
        setSelectedConditionsZustand(updater as any); // 타입 캐스팅 (availableAirlines는 계산으로 처리)
      }
    },
    [selectedConditions, setSelectedConditionsZustand]
  );
  // Accordion 상태 관리 (중첩 button 에러 방지)
  const [accordionState, setAccordionState] = useState({
    types: true,
    terminal: true,
    airline: true,
  });

  const toggleAccordion = useCallback((key: 'types' | 'terminal' | 'airline') => {
    setAccordionState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // 터미널 표시 형태 변환 함수
  const getTerminalDisplayName = useCallback((terminal: string) => {
    if (terminal === 'unknown') {
      return 'Unknown';
    }
    return `Terminal ${terminal}`;
  }, []);

  // 터미널 표시 형태를 raw 값으로 변환하는 함수 (API 요청용)
  const getTerminalRawValue = useCallback((displayName: string) => {
    if (displayName === 'Unknown') {
      return 'unknown';
    }
    // "Terminal 1" → "1"
    const match = displayName.match(/Terminal\s+(.+)/);
    return match ? match[1] : displayName;
  }, []);

  // Types 필터링된 항공사 목록 계산
  const getFilteredAirlines = useMemo(() => {
    if (selectedConditions.types.length === 0) {
      return availableConditions.airlines;
    }

    const filteredAirlines = new Set<{ iata: string; name: string }>();

    // Types에 따른 필터링
    selectedConditions.types.forEach((type) => {
      if (type === 'International') {
        availableConditions.types.International.forEach((airline) => filteredAirlines.add(airline));
      }
      if (type === 'Domestic') {
        availableConditions.types.Domestic.forEach((airline) => filteredAirlines.add(airline));
      }
    });

    return Array.from(filteredAirlines);
  }, [selectedConditions.types, availableConditions.types, availableConditions.airlines]);

  // 계산된 availableAirlines (실시간 계산)
  const availableAirlines = useMemo(() => {
    // Types 필터링된 항공사 목록에서 이미 선택된 항공사 제외
    const filteredByTypes = getFilteredAirlines;

    return filteredByTypes.filter(
      (airline) =>
        !selectedConditions.selectedAirlines.some(
          (selected) => selected.iata === airline.iata && selected.name === airline.name
        )
    );
  }, [getFilteredAirlines, selectedConditions.selectedAirlines]);

  // 성능 최적화: 정렬된 항공사 목록들을 메모이제이션 (중복 제거 포함)
  const sortedAvailableAirlines = useMemo(() => {
    // Map을 사용하여 중복 제거 (IATA + name 조합으로)
    const uniqueMap = new Map<string, { iata: string; name: string }>();
    availableAirlines.forEach((airline) => {
      // null 값 체크 후 Map에 추가
      if (airline && airline.iata && airline.name) {
        const key = `${airline.iata}-${airline.name}`;
        uniqueMap.set(key, airline);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    });
  }, [availableAirlines]);

  const sortedSelectedAirlines = useMemo(() => {
    // Map을 사용하여 중복 제거 (IATA + name 조합으로)
    const uniqueMap = new Map<string, { iata: string; name: string }>();
    selectedConditions.selectedAirlines.forEach((airline) => {
      // null 값 체크 후 Map에 추가
      if (airline && airline.iata && airline.name) {
        const key = `${airline.iata}-${airline.name}`;
        uniqueMap.set(key, airline);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    });
  }, [selectedConditions.selectedAirlines]);

  // 터미널 체크박스 변경 시 해당 항공사들을 선택 목록으로 이동
  const handleTerminalChange = useCallback(
    (terminal: string, checked: boolean) => {
      // terminal은 displayName ("Terminal 1")이므로 raw 값으로 변환
      const rawTerminal = getTerminalRawValue(terminal);
      const terminalAirlines = availableConditions.terminals[rawTerminal] || [];
      const filteredTerminalAirlines = terminalAirlines.filter((airline) =>
        getFilteredAirlines.some((filtered) => filtered.iata === airline.iata && filtered.name === airline.name)
      );

      // 표시되는 모든 터미널 목록 (unknown 제외)
      const visibleTerminals = Object.keys(availableConditions.terminals)
        .filter((t) => t !== 'unknown')
        .map(getTerminalDisplayName);

      if (checked) {
        // 터미널 선택 시: 터미널 추가 + 해당 항공사들을 선택된 목록으로 이동
        const newSelectedTerminals = [...selectedConditions.terminal, terminal];

        // 모든 표시되는 터미널이 선택되었는지 확인
        const allTerminalsSelected = visibleTerminals.every((t) => newSelectedTerminals.includes(t));

        // unknown 터미널의 항공사들도 포함할지 결정
        let unknownAirlines: Array<{ iata: string; name: string }> = [];
        if (allTerminalsSelected && availableConditions.terminals['unknown']) {
          unknownAirlines = availableConditions.terminals['unknown'].filter((airline) =>
            getFilteredAirlines.some((filtered) => filtered.iata === airline.iata && filtered.name === airline.name)
          );
        }

        setSelectedConditions((prev) => {
          // Map을 사용하여 중복 제거를 확실히 처리
          const selectedMap = new Map<string, { iata: string; name: string }>();

          // 기존 선택된 항공사들 추가
          prev.selectedAirlines.forEach((airline) => {
            const key = `${airline.iata}-${airline.name}`;
            selectedMap.set(key, airline);
          });

          // 터미널 항공사들 추가 (중복 자동 제거)
          filteredTerminalAirlines.forEach((airline) => {
            const key = `${airline.iata}-${airline.name}`;
            selectedMap.set(key, airline);
          });

          // Unknown 항공사들 추가 (중복 자동 제거)
          unknownAirlines.forEach((airline) => {
            const key = `${airline.iata}-${airline.name}`;
            selectedMap.set(key, airline);
          });

          return {
            ...prev,
            terminal: newSelectedTerminals,
            selectedAirlines: Array.from(selectedMap.values()),
          };
        });
      } else {
        // 터미널 해제 시: 터미널 제거 + 해당 항공사들을 사용 가능한 목록으로 복귀
        const newSelectedTerminals = selectedConditions.terminal.filter((t) => t !== terminal);

        // 이전에 모든 터미널이 선택되어 있었는지 확인
        const wasAllTerminalsSelected = visibleTerminals.every((t) => selectedConditions.terminal.includes(t));

        // unknown 터미널의 항공사들 처리
        let unknownAirlines: Array<{ iata: string; name: string }> = [];
        if (wasAllTerminalsSelected && availableConditions.terminals['unknown']) {
          unknownAirlines = availableConditions.terminals['unknown'].filter((airline) =>
            getFilteredAirlines.some((filtered) => filtered.iata === airline.iata && filtered.name === airline.name)
          );
        }

        setSelectedConditions((prev) => {
          // 제거할 항공사들의 키 생성
          const airlinesToRemove = new Set<string>();
          filteredTerminalAirlines.forEach((airline) => {
            airlinesToRemove.add(`${airline.iata}-${airline.name}`);
          });
          unknownAirlines.forEach((airline) => {
            airlinesToRemove.add(`${airline.iata}-${airline.name}`);
          });

          // 선택된 항공사 목록에서 제거
          const newSelectedAirlines = prev.selectedAirlines.filter((airline) => {
            const key = `${airline.iata}-${airline.name}`;
            return !airlinesToRemove.has(key);
          });

          return {
            ...prev,
            terminal: newSelectedTerminals,
            selectedAirlines: newSelectedAirlines,
          };
        });
      }
    },
    [availableConditions.terminals, getFilteredAirlines, selectedConditions, setSelectedConditions, getTerminalRawValue]
  );

  // 항공사 추가/제거 함수 (성능 최적화 + 중복 제거 강화)
  const addAirline = useCallback(
    (airline: { iata: string; name: string }) => {
      setSelectedConditions((prev) => {
        const selectedMap = new Map<string, { iata: string; name: string }>();
        const availableMap = new Map<string, { iata: string; name: string }>();

        // 기존 선택된 항공사들 + 새 항공사 추가
        [...prev.selectedAirlines, airline].forEach((a) => {
          const key = `${a.iata}-${a.name}`;
          selectedMap.set(key, a);
        });

        return {
          ...prev,
          selectedAirlines: Array.from(selectedMap.values()),
        };
      });
    },
    [setSelectedConditions]
  );

  const removeAirline = useCallback(
    (airline: { iata: string; name: string }) => {
      setSelectedConditions((prev) => {
        const selectedMap = new Map<string, { iata: string; name: string }>();
        const availableMap = new Map<string, { iata: string; name: string }>();

        const airlineKey = `${airline.iata}-${airline.name}`;

        // 기존 선택된 항공사들에서 제거할 항공사 제외
        prev.selectedAirlines.forEach((a) => {
          const key = `${a.iata}-${a.name}`;
          if (key !== airlineKey) {
            selectedMap.set(key, a);
          }
        });

        return {
          ...prev,
          selectedAirlines: Array.from(selectedMap.values()),
        };
      });
    },
    [setSelectedConditions]
  );

  // 전체 항공사 추가/제거 함수 (성능 최적화 + 중복 제거 강화)
  const addAllAirlines = useCallback(() => {
    setSelectedConditions((prev) => {
      // 모든 항공사를 선택된 목록으로 이동 (중복 제거)
      const selectedMap = new Map<string, { iata: string; name: string }>();

      [...prev.selectedAirlines, ...availableAirlines].forEach((airline) => {
        const key = `${airline.iata}-${airline.name}`;
        selectedMap.set(key, airline);
      });

      return {
        ...prev,
        selectedAirlines: Array.from(selectedMap.values()),
      };
    });
  }, [setSelectedConditions, availableAirlines]);

  const removeAllAirlines = useCallback(() => {
    setSelectedConditions((prev) => {
      // 모든 항공사를 사용 가능한 목록으로 이동 (중복 제거)
      const availableMap = new Map<string, { iata: string; name: string }>();

      return {
        ...prev,
        types: [], // Types 체크박스도 함께 해제
        terminal: [], // Terminal 체크박스도 함께 해제
        selectedAirlines: [],
      };
    });
  }, [setSelectedConditions, availableAirlines]);

  if (!showConditions && !chartData) {
    return null;
  }

  return (
    <Collapsible defaultOpen={true}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50 [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">Filter Conditions</div>
                  <p className="text-sm font-normal text-gray-600">Select flight types, terminals, and airlines</p>
                </div>
              </CardTitle>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="w-full">
              {/* Types Selection */}
              {(availableConditions.types.International.length > 0 ||
                availableConditions.types.Domestic.length > 0) && (
                <div className="border-b">
                  <div
                    className="flex cursor-pointer items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline"
                    onClick={() => toggleAccordion('types')}
                  >
                    <span>Types</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${accordionState.types ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {accordionState.types && (
                    <div className="space-y-3 pb-4 pt-2">
                      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-2 lg:gap-3">
                        {/* International 타입 체크박스 */}
                        {availableConditions.types.International.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="type-international"
                              checked={selectedConditions.types.includes('International')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedConditions((prev) => ({
                                    ...prev,
                                    types: [...prev.types, 'International'],
                                  }));
                                } else {
                                  setSelectedConditions((prev) => ({
                                    ...prev,
                                    types: prev.types.filter((i) => i !== 'International'),
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor="type-international" className="cursor-pointer text-sm font-normal">
                              International
                            </Label>
                          </div>
                        )}

                        {/* Domestic 타입 체크박스 */}
                        {availableConditions.types.Domestic.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="type-domestic"
                              checked={selectedConditions.types.includes('Domestic')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedConditions((prev) => ({
                                    ...prev,
                                    types: [...prev.types, 'Domestic'],
                                  }));
                                } else {
                                  setSelectedConditions((prev) => ({
                                    ...prev,
                                    types: prev.types.filter((i) => i !== 'Domestic'),
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor="type-domestic" className="cursor-pointer text-sm font-normal">
                              Domestic
                            </Label>
                          </div>
                        )}
                      </div>
                      {/* 반응형 Badge 영역 */}
                      <div className="flex min-h-7 flex-wrap gap-1 sm:gap-2">
                        {[...selectedConditions.types].sort().map((type) => (
                          <Badge
                            key={type}
                            variant="default"
                            className="flex cursor-pointer items-center gap-1 pr-1 text-xs"
                            onClick={() => {
                              setSelectedConditions((prev) => ({
                                ...prev,
                                types: prev.types.filter((t) => t !== type),
                              }));
                            }}
                          >
                            {type}
                            <X className="hover:bg-white/20 h-3 w-3 rounded-full p-0.5" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Terminal Selection */}
              {Object.keys(availableConditions.terminals).filter((t) => t !== 'unknown').length > 0 && (
                <div className="border-b">
                  <div
                    className="flex cursor-pointer items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline"
                    onClick={() => toggleAccordion('terminal')}
                  >
                    <span>Terminal</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${accordionState.terminal ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {accordionState.terminal && (
                    <div className="space-y-3 pb-4 pt-2">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-2 xl:gap-3">
                        {Object.keys(availableConditions.terminals)
                          .filter((t) => t !== 'unknown')
                          .sort((a, b) => {
                            const aNum = parseInt(a);
                            const bNum = parseInt(b);
                            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                            return a.localeCompare(b);
                          })
                          .map((terminal) => {
                            const displayName = getTerminalDisplayName(terminal);

                            return (
                              <div key={terminal} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`terminal-${terminal}`}
                                  checked={selectedConditions.terminal.includes(displayName)}
                                  onCheckedChange={(checked) => handleTerminalChange(displayName, !!checked)}
                                />
                                <Label htmlFor={`terminal-${terminal}`} className="cursor-pointer text-sm font-normal">
                                  {displayName}
                                </Label>
                              </div>
                            );
                          })}
                      </div>
                      {/* 반응형 Badge 영역 */}
                      <div className="flex min-h-7 flex-wrap gap-1 sm:gap-2">
                        {[...selectedConditions.terminal]
                          .sort((a, b) => {
                            // displayName은 이미 "Terminal 1" 형태이므로 터미널 번호만 추출해서 정렬
                            const aNum = parseInt(getTerminalRawValue(a));
                            const bNum = parseInt(getTerminalRawValue(b));
                            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                            return a.localeCompare(b);
                          })
                          .map((terminal) => (
                            <Badge
                              key={terminal}
                              variant="default"
                              className="flex cursor-pointer items-center gap-1 pr-1 text-xs"
                              onClick={() => {
                                handleTerminalChange(terminal, false);
                              }}
                            >
                              {terminal}
                              <X className="hover:bg-white/20 h-3 w-3 rounded-full p-0.5" />
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Airline - 좌우 장바구니 방식 */}
              {getFilteredAirlines.length > 0 && (
                <div className="border-b">
                  <div
                    className="flex cursor-pointer items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline"
                    onClick={() => toggleAccordion('airline')}
                  >
                    <span>Airline</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${accordionState.airline ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {accordionState.airline && (
                    <div className="space-y-3 pb-4 pt-2 sm:space-y-4">
                      {/* 반응형 레이아웃 */}
                      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-3 xl:gap-4">
                        {/* 왼쪽: 사용 가능한 항공사 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Available ({availableAirlines.length})</Label>
                            {availableAirlines.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addAllAirlines}
                                className="h-6 px-2 text-xs hover:bg-primary/10"
                              >
                                Add All
                              </Button>
                            )}
                          </div>
                          <div className="h-40 overflow-y-auto rounded-md border bg-muted/20 p-2 sm:h-44 lg:h-48">
                            {availableAirlines.length === 0 ? (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No available
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                {sortedAvailableAirlines.map((airline, index) => (
                                  <Button
                                    key={`available-${airline.iata}-${airline.name}-${index}`}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addAirline(airline)}
                                    className="h-8 w-full justify-between p-2 text-left transition-colors hover:bg-primary/10"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center">
                                      <span className="mr-1 text-sm font-medium sm:mr-2">{airline.iata}</span>
                                      <span className="truncate text-xs text-muted-foreground">- {airline.name}</span>
                                    </div>
                                    <Plus className="ml-1 h-3 w-3 flex-shrink-0 sm:ml-2" />
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 오른쪽: 선택된 항공사 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Selected ({selectedConditions.selectedAirlines.length})
                            </Label>
                            {selectedConditions.selectedAirlines.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={removeAllAirlines}
                                className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                              >
                                Remove All
                              </Button>
                            )}
                          </div>
                          <div className="h-40 overflow-y-auto rounded-md border bg-primary/5 p-2 sm:h-44 lg:h-48">
                            {selectedConditions.selectedAirlines.length === 0 ? (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No selected
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                {sortedSelectedAirlines.map((airline, index) => (
                                  <Button
                                    key={`selected-${airline.iata}-${airline.name}-${index}`}
                                    variant="default"
                                    size="sm"
                                    onClick={() => removeAirline(airline)}
                                    className="h-8 w-full justify-between p-2 text-left transition-colors hover:bg-primary/80"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center">
                                      <span className="mr-1 text-sm font-medium sm:mr-2">{airline.iata}</span>
                                      <span className="truncate text-xs opacity-80">- {airline.name}</span>
                                    </div>
                                    <Minus className="ml-1 h-3 w-3 flex-shrink-0 sm:ml-2" />
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedConditions.types.length +
                  selectedConditions.terminal.length +
                  selectedConditions.selectedAirlines.length}{' '}
                condition(s) selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedConditions({
                      types: [],
                      terminal: [],
                      selectedAirlines: [],
                    });
                  }}
                  disabled={
                    selectedConditions.types.length === 0 &&
                    selectedConditions.terminal.length === 0 &&
                    selectedConditions.selectedAirlines.length === 0
                  }
                  className="flex-1 sm:flex-none"
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={onApplyFilters}
                  disabled={loadingFlightSchedule}
                  className="flex-1 sm:flex-none"
                >
                  {loadingFlightSchedule ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 flex-shrink-0 animate-spin" />
                      <span className="hidden sm:inline">Applying...</span>
                      <span className="sm:hidden">Apply</span>
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Apply Filters</span>
                      <span className="sm:hidden">Apply</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default React.memo(TabFlightScheduleFilterConditions);
