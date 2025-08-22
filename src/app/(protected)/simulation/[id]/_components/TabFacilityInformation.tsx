'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Clock3, Copy, Moon, Settings, Sun } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { useScenarioStore } from '../../_store/useScenarioStore';
import NextButton from './NextButton';

// Counter Operations Settings interfaces
interface DeskOperation {
  deskId: string;
  isActive: boolean;
  operatingHours: {
    open: string;
    close: string;
  };
  capacity: {
    [timeSlot: string]: number;
  };
}

interface CounterOperation {
  counterId: string;
  numberOfDevices: number;
  processingTimePerPerson: number; // seconds
  maxQueueCapacity: number;
  desks: Record<string, DeskOperation>;
}

interface CounterConfig {
  numberOfDevices: number;
  processingTimePerPerson: number;
  maxQueueCapacity: number;
}

interface OperatingPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  hours: { open: string; close: string };
}

// Generate time slots (10-minute intervals)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const timeStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const nextMinute = minute + 10;
      const nextHour = nextMinute >= 60 ? hour + 1 : hour;
      const adjustedMinute = nextMinute >= 60 ? 0 : nextMinute;

      if (nextHour >= 24) break;

      const timeEnd = `${nextHour.toString().padStart(2, '0')}:${adjustedMinute.toString().padStart(2, '0')}`;
      slots.push(`${timeStart}-${timeEnd}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Quick presets for operating hours
const OPERATING_PRESETS: OperatingPreset[] = [
  {
    id: '24_7',
    name: '24/7',
    icon: <Clock3 className="h-4 w-4" />,
    description: 'Round the clock',
    hours: { open: '00:00', close: '23:59' },
  },
  {
    id: 'business',
    name: 'Business Hours',
    icon: <Sun className="h-4 w-4" />,
    description: '06:00 - 22:00',
    hours: { open: '06:00', close: '22:00' },
  },
  {
    id: 'night',
    name: 'Night Shift',
    icon: <Moon className="h-4 w-4" />,
    description: '22:00 - 06:00',
    hours: { open: '22:00', close: '06:00' },
  },
];

interface TabFacilityInformationProps {
  simulationId: string;
  visible: boolean;
}

export default function TabFacilityInformation({ simulationId, visible }: TabFacilityInformationProps) {
  // Get check-in counters from facilityConnection processes
  const processes = useScenarioStore((s) => s.facilityConnection.processes);

  // Find check-in process and extract counter nodes
  const checkInCounters = useMemo(() => {
    if (!processes) return [];

    // Find the check-in process (usually has name "check-in")
    const checkInProcess = Object.values(processes).find(
      (process) => process.name === 'check-in' || process.name === 'check_in'
    );

    return checkInProcess?.nodes || [];
  }, [processes]);

  // Counter Operations Settings state
  const [counterOperations, setCounterOperations] = useState<Record<string, CounterOperation>>({});
  const [expandedCounters, setExpandedCounters] = useState<Set<string>>(new Set());

  // Remove duplicates and ensure unique counters from facility connection processes
  const uniqueCounters = [...new Set(checkInCounters)].filter(Boolean).sort();

  // Initialize default operations for counters that don't exist
  const getCounterOperation = useCallback(
    (counterId: string): CounterOperation => {
      if (counterOperations[counterId]) {
        return counterOperations[counterId];
      }

      // Create default counter with desks
      const numberOfDevices = 20;
      const desks: Record<string, DeskOperation> = {};

      for (let i = 1; i <= numberOfDevices; i++) {
        const deskId = i.toString().padStart(2, '0');
        desks[deskId] = {
          deskId,
          isActive: true,
          operatingHours: { open: '06:00', close: '22:00' },
          capacity: {},
        };
      }

      return {
        counterId,
        numberOfDevices,
        processingTimePerPerson: 120,
        maxQueueCapacity: 400,
        desks,
      };
    },
    [counterOperations]
  );

  // Handle counter operation updates
  const handleCounterOperationUpdate = useCallback((counterId: string, operation: CounterOperation) => {
    setCounterOperations((prev) => ({
      ...prev,
      [counterId]: operation,
    }));
  }, []);

  // Calculate default capacity based on configuration
  const calculateDefaultCapacity = (config: CounterConfig): number => {
    const { numberOfDevices, processingTimePerPerson } = config;
    // Capacity per 10 minutes = (devices * 600 seconds) / processing time per person
    return Math.floor((numberOfDevices * 600) / processingTimePerPerson);
  };

  // Handle counter configuration change
  const handleCounterConfigChange = (counterId: string, field: keyof CounterConfig, value: number) => {
    const currentOperation = getCounterOperation(counterId);
    const updatedOperation = { ...currentOperation, [field]: value };

    // If numberOfDevices changed, update desks
    if (field === 'numberOfDevices') {
      const newDesks: Record<string, DeskOperation> = {};
      for (let i = 1; i <= value; i++) {
        const deskId = i.toString().padStart(2, '0');
        newDesks[deskId] = currentOperation.desks[deskId] || {
          deskId,
          isActive: true,
          operatingHours: { open: '06:00', close: '22:00' },
          capacity: {},
        };
      }
      updatedOperation.desks = newDesks;
    }

    handleCounterOperationUpdate(counterId, updatedOperation);
  };

  // Handle bulk settings for all desks in a counter
  const handleBulkSettings = (counterId: string, preset: OperatingPreset) => {
    const currentOperation = getCounterOperation(counterId);
    const updatedDesks = { ...currentOperation.desks };

    Object.keys(updatedDesks).forEach((deskId) => {
      updatedDesks[deskId] = {
        ...updatedDesks[deskId],
        isActive: true,
        operatingHours: preset.hours,
      };
    });

    handleCounterOperationUpdate(counterId, {
      ...currentOperation,
      desks: updatedDesks,
    });
  };

  // Handle individual desk settings
  const handleDeskToggle = (counterId: string, deskId: string) => {
    const currentOperation = getCounterOperation(counterId);
    const updatedDesks = { ...currentOperation.desks };

    updatedDesks[deskId] = {
      ...updatedDesks[deskId],
      isActive: !updatedDesks[deskId].isActive,
    };

    handleCounterOperationUpdate(counterId, {
      ...currentOperation,
      desks: updatedDesks,
    });
  };

  // Handle desk operating hours change
  const handleDeskHoursChange = (counterId: string, deskId: string, field: 'open' | 'close', value: string) => {
    const currentOperation = getCounterOperation(counterId);
    const updatedDesks = { ...currentOperation.desks };

    updatedDesks[deskId] = {
      ...updatedDesks[deskId],
      operatingHours: {
        ...updatedDesks[deskId].operatingHours,
        [field]: value,
      },
    };

    handleCounterOperationUpdate(counterId, {
      ...currentOperation,
      desks: updatedDesks,
    });
  };

  // Fill all time slots with default capacity for all active desks
  const handleFillAllSlots = (counterId: string) => {
    const currentOperation = getCounterOperation(counterId);
    const defaultCapacityPerDesk = Math.floor(
      calculateDefaultCapacity({
        numberOfDevices: 1, // Per desk capacity
        processingTimePerPerson: currentOperation.processingTimePerPerson,
        maxQueueCapacity: currentOperation.maxQueueCapacity,
      })
    );

    const updatedDesks = { ...currentOperation.desks };

    Object.keys(updatedDesks).forEach((deskId) => {
      if (updatedDesks[deskId].isActive) {
        const newCapacity: { [timeSlot: string]: number } = {};
        TIME_SLOTS.forEach((timeSlot) => {
          // Only set capacity during operating hours
          if (isWithinOperatingHours(timeSlot, updatedDesks[deskId].operatingHours)) {
            newCapacity[timeSlot] = defaultCapacityPerDesk;
          } else {
            newCapacity[timeSlot] = 0;
          }
        });
        updatedDesks[deskId].capacity = newCapacity;
      }
    });

    handleCounterOperationUpdate(counterId, {
      ...currentOperation,
      desks: updatedDesks,
    });
  };

  // Check if time slot is within operating hours
  const isWithinOperatingHours = (timeSlot: string, operatingHours: { open: string; close: string }): boolean => {
    const [startTime] = timeSlot.split('-');
    const [openHour, openMinute] = operatingHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = operatingHours.close.split(':').map(Number);
    const [slotHour, slotMinute] = startTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMinute;
    let closeMinutes = closeHour * 60 + closeMinute;
    const slotMinutes = slotHour * 60 + slotMinute;

    // Handle overnight shifts (e.g., 22:00 - 06:00)
    if (closeMinutes <= openMinutes) {
      closeMinutes += 24 * 60; // Add 24 hours
      return slotMinutes >= openMinutes || slotMinutes <= closeMinutes - 24 * 60;
    }

    return slotMinutes >= openMinutes && slotMinutes < closeMinutes;
  };

  // Handle capacity input change for individual desk
  const handleDeskCapacityChange = (timeSlot: string, counterId: string, deskId: string, value: string) => {
    const currentOperation = getCounterOperation(counterId);
    const capacity = parseInt(value, 10) || 0;
    const updatedDesks = { ...currentOperation.desks };

    updatedDesks[deskId] = {
      ...updatedDesks[deskId],
      capacity: {
        ...updatedDesks[deskId].capacity,
        [timeSlot]: capacity,
      },
    };

    handleCounterOperationUpdate(counterId, {
      ...currentOperation,
      desks: updatedDesks,
    });
  };

  // Get total capacity for a counter across all active desks
  const getCounterTotalCapacity = useCallback(
    (counterId: string) => {
      const operation = getCounterOperation(counterId);
      const totalCapacity: { [timeSlot: string]: number } = {};

      TIME_SLOTS.forEach((timeSlot) => {
        let total = 0;
        Object.values(operation.desks).forEach((desk) => {
          if (desk.isActive && isWithinOperatingHours(timeSlot, desk.operatingHours)) {
            total += desk.capacity[timeSlot] || 0;
          }
        });
        totalCapacity[timeSlot] = total;
      });

      return totalCapacity;
    },
    [getCounterOperation]
  );

  // If no check-in counters are found, show a message
  if (!visible) return null;

  if (checkInCounters.length === 0) {
    return (
      <div className="pt-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center text-muted-foreground">
              <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 className="mb-2 text-lg font-medium">No Check-in Counters Found</h3>
              <p className="text-sm">
                Please configure check-in counters in the <span className="font-medium">Facility Connection</span> tab
                first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-8">
      {/* Counter Operations Settings */}
      {uniqueCounters.length > 0 && (
        <div>
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5 text-primary" />
                Counter Operations Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure operating hours and capacity for each counter and individual desks.
                <br />
                <strong>Tip:</strong> Use bulk settings to quickly configure all desks, then fine-tune individual desks
                as needed.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Counter Configuration */}
              <div className="space-y-6">
                {uniqueCounters.map((counterId) => {
                  const operation = getCounterOperation(counterId);
                  const activeDesksCount = Object.values(operation.desks).filter((desk) => desk.isActive).length;
                  const totalCapacity = getCounterTotalCapacity(counterId);
                  const totalActiveSlots = Object.values(totalCapacity).filter((c) => c > 0).length;
                  const totalCapacitySum = Object.values(totalCapacity).reduce((sum, c) => sum + c, 0);
                  const isExpanded = expandedCounters.has(counterId);

                  return (
                    <Card key={counterId} className="border-primary/20">
                      <CardHeader
                        className="cursor-pointer pb-4"
                        onClick={() =>
                          setExpandedCounters((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(counterId)) {
                              newSet.delete(counterId);
                            } else {
                              newSet.add(counterId);
                            }
                            return newSet;
                          })
                        }
                      >
                        <CardTitle className="flex items-center justify-between text-foreground">
                          <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            <span>
                              Counter {counterId} ({operation.numberOfDevices} desks)
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">{activeDesksCount}</span> active •
                              <span className="font-medium"> {totalActiveSlots}</span> slots •
                              <span className="font-medium"> {totalCapacitySum}</span> pax/hr
                            </div>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </CardTitle>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="space-y-6">
                          {/* Basic Configuration */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`devices-${counterId}`} className="text-xs text-muted-foreground">
                                Number of desks
                              </Label>
                              <Input
                                id={`devices-${counterId}`}
                                type="number"
                                value={operation.numberOfDevices}
                                onChange={(e) =>
                                  handleCounterConfigChange(counterId, 'numberOfDevices', parseInt(e.target.value) || 1)
                                }
                                className="h-8"
                                min="1"
                                max="50"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`processing-${counterId}`} className="text-xs text-muted-foreground">
                                Processing time (sec)
                              </Label>
                              <Input
                                id={`processing-${counterId}`}
                                type="number"
                                value={operation.processingTimePerPerson}
                                onChange={(e) =>
                                  handleCounterConfigChange(
                                    counterId,
                                    'processingTimePerPerson',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="h-8"
                                min="1"
                                max="600"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`queue-${counterId}`} className="text-xs text-muted-foreground">
                                Max queue capacity
                              </Label>
                              <Input
                                id={`queue-${counterId}`}
                                type="number"
                                value={operation.maxQueueCapacity}
                                onChange={(e) =>
                                  handleCounterConfigChange(
                                    counterId,
                                    'maxQueueCapacity',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="h-8"
                                min="0"
                                max="1000"
                              />
                            </div>
                          </div>

                          {/* Bulk Settings */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Copy className="h-4 w-4 text-primary" />
                              <Label className="text-sm font-medium">Bulk Settings</Label>
                            </div>
                            <div className="flex gap-2">
                              {OPERATING_PRESETS.map((preset) => (
                                <Button
                                  key={preset.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBulkSettings(counterId, preset)}
                                  className="flex h-8 items-center gap-2 text-xs"
                                >
                                  {preset.icon}
                                  <div className="text-left">
                                    <div className="font-medium">{preset.name}</div>
                                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                                  </div>
                                </Button>
                              ))}
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleFillAllSlots(counterId)}
                                className="h-8 text-xs"
                              >
                                Fill All Slots
                              </Button>
                            </div>
                          </div>

                          {/* Individual Desks */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-primary" />
                                <Label className="text-sm font-medium">Individual Desks</Label>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {activeDesksCount} of {operation.numberOfDevices} active
                              </div>
                            </div>

                            <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto">
                              {Object.values(operation.desks).map((desk) => (
                                <div
                                  key={desk.deskId}
                                  className={cn(
                                    'flex items-center justify-between rounded border p-2 text-xs transition-colors',
                                    desk.isActive ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/20'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={desk.isActive}
                                      onChange={() => handleDeskToggle(counterId, desk.deskId)}
                                      className="h-3 w-3"
                                    />
                                    <span className="font-medium">Desk {desk.deskId}</span>
                                  </div>
                                  {desk.isActive && (
                                    <div className="flex gap-1">
                                      <input
                                        type="time"
                                        value={desk.operatingHours.open}
                                        onChange={(e) =>
                                          handleDeskHoursChange(counterId, desk.deskId, 'open', e.target.value)
                                        }
                                        className="w-16 border-0 bg-transparent text-xs"
                                      />
                                      <span>-</span>
                                      <input
                                        type="time"
                                        value={desk.operatingHours.close}
                                        onChange={(e) =>
                                          handleDeskHoursChange(counterId, desk.deskId, 'close', e.target.value)
                                        }
                                        className="w-16 border-0 bg-transparent text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Capacity Timeline Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Total Capacity Timeline (All Counters Combined)</Label>
                </div>

                <div className="rounded-md border border-border bg-background">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 border-b border-border bg-muted/50">
                        <tr>
                          <th className="w-20 border-r border-border p-2 text-left text-xs font-medium text-muted-foreground">
                            Time
                          </th>
                          {uniqueCounters.map((counterId) => (
                            <th
                              key={counterId}
                              className="w-20 border-r border-border p-2 text-center text-xs font-medium text-muted-foreground"
                            >
                              Counter {counterId}
                            </th>
                          ))}
                          <th className="w-20 border-r border-border p-2 text-center text-xs font-medium text-primary">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_SLOTS.map((timeSlot) => {
                          let totalForSlot = 0;
                          return (
                            <tr key={timeSlot} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="border-r border-border p-2 font-mono text-xs text-muted-foreground">
                                {timeSlot.split('-')[0]}
                              </td>
                              {uniqueCounters.map((counterId) => {
                                const counterTotal = getCounterTotalCapacity(counterId);
                                const slotCapacity = counterTotal[timeSlot] || 0;
                                totalForSlot += slotCapacity;
                                return (
                                  <td key={counterId} className="border-r border-border p-2 text-center text-xs">
                                    {slotCapacity || 0}
                                  </td>
                                );
                              })}
                              <td className="border-r border-border p-2 text-center text-xs font-medium text-primary">
                                {totalForSlot}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div
                className={cn(
                  'grid gap-4',
                  uniqueCounters.length === 1 && 'grid-cols-1',
                  uniqueCounters.length === 2 && 'grid-cols-2',
                  uniqueCounters.length === 3 && 'grid-cols-3',
                  uniqueCounters.length === 4 && 'grid-cols-4',
                  uniqueCounters.length >= 5 && 'grid-cols-5'
                )}
              >
                {uniqueCounters.map((counterId) => {
                  const operation = getCounterOperation(counterId);
                  const activeDesks = Object.values(operation.desks).filter((desk) => desk.isActive).length;
                  const totalCapacity = getCounterTotalCapacity(counterId);
                  const activeSlots = Object.values(totalCapacity).filter((c) => c > 0).length;
                  const totalCapacitySum = Object.values(totalCapacity).reduce((sum, c) => sum + c, 0);

                  return (
                    <div key={counterId} className="rounded-md border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-1 text-xs font-semibold text-foreground">Counter {counterId}</div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Total Desks:</span> {operation.numberOfDevices}
                        </div>
                        <div>
                          <span className="font-medium">Active Desks:</span> {activeDesks}
                        </div>
                        <div>
                          <span className="font-medium">Processing:</span> {operation.processingTimePerPerson}s
                        </div>
                        <div>
                          <span className="font-medium">Max Queue:</span> {operation.maxQueueCapacity}
                        </div>
                        <div>
                          <span className="font-medium">Active Slots:</span> {activeSlots}
                        </div>
                        <div>
                          <span className="font-medium">Total Capacity:</span> {totalCapacitySum} pax/hr
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-end">
        <NextButton />
      </div>
    </div>
  );
}
