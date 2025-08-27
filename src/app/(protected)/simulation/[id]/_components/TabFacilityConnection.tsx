'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Network } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { formatProcessName } from '@/lib/utils';
import { useFacilityConnectionStore, useFlightScheduleStore } from '../_stores';
import NextButton from './NextButton';
import TabFacilityConnectionTable from './TabFacilityConnectionTable';

interface TabFacilityConnectionProps {
  simulationId: string;
  visible: boolean;
}

interface ProcessConnection {
  sourceId: string;
  destinationId: string;
  sourceName: string;
  destinationName: string;
  sourceNodes: string[];
  destinationNodes: string[];
}

interface ConnectionMatrix {
  [sourceNode: string]: {
    [destinationNode: string]: {
      enabled: boolean;
      percentage: number;
    };
  };
}

export default function TabFacilityConnection({ simulationId, visible }: TabFacilityConnectionProps) {
  // Individual stores
  const processes = useFacilityConnectionStore((s) => s.processes);
  const isCompleted = useFacilityConnectionStore((s) => s.isCompleted);
  const setIsCompleted = useFacilityConnectionStore((s) => s.setCompleted);
  const setProcesses = useFacilityConnectionStore((s) => s.setProcesses);

  // Additional data for Airline process
  const selectedAirlines = useFlightScheduleStore((s) => s.selectedConditions.selectedAirlines);

  // Local state for matrix editing
  const [connectionMatrices, setConnectionMatrices] = useState<Record<string, ConnectionMatrix>>({});

  // Calculate ordered processes and their connections
  const { orderedProcesses, processConnections } = useMemo(() => {
    if (!processes) return { orderedProcesses: [], processConnections: [] };

    // Update Airline process with selectedAirlines
    const updatedProcesses = { ...processes };
    if (updatedProcesses['0']) {
      const airlineNodes =
        selectedAirlines && selectedAirlines.length > 0
          ? selectedAirlines.map((airline) => `${airline.iata} (${airline.name})`)
          : updatedProcesses['0'].nodes || [];

      updatedProcesses['0'] = {
        ...updatedProcesses['0'],
        name: updatedProcesses['0'].name, // Use the name from zustand processes
        nodes: airlineNodes,
      };
    }

    // Get process order from updated processes data
    const getProcessOrder = () => {
      const processIds = Object.keys(updatedProcesses);
      const destinationIds = new Set(
        Object.values(updatedProcesses)
          .map((p) => p.destination)
          .filter(Boolean)
      );

      // Find entry point (process that is not a destination of any other process)
      const entryPoints = processIds.filter((id) => !destinationIds.has(id));

      if (entryPoints.length === 0) return processIds; // fallback

      // Build the chain starting from entry point
      const orderedIds: string[] = [];
      const visited = new Set<string>();

      const buildChain = (currentId: string) => {
        if (visited.has(currentId) || !updatedProcesses[currentId]) return;
        visited.add(currentId);
        orderedIds.push(currentId);

        if (updatedProcesses[currentId].destination) {
          buildChain(updatedProcesses[currentId].destination);
        }
      };

      entryPoints.forEach((entryId) => buildChain(entryId));

      return orderedIds;
    };

    const processOrder = getProcessOrder();

    // Create ordered processes list (processes 1, 2, 3)
    const orderedProcesses = processOrder
      .filter((processId) => {
        // Include processes 1, 2, 3 (exclude 0 which is Airline)
        return processId !== '0' && updatedProcesses[processId];
      })
      .map((processId) => ({
        id: processId,
        name: updatedProcesses[processId].name,
        nodes: updatedProcesses[processId].nodes || [],
      }));

    // Calculate connections
    const connections: ProcessConnection[] = [];
    Object.entries(updatedProcesses).forEach(([processId, process]) => {
      if (process.destination && updatedProcesses[process.destination]) {
        const sourceProcess = process;
        const destinationProcess = updatedProcesses[process.destination];

        if (sourceProcess.nodes && sourceProcess.nodes.length > 0) {
          connections.push({
            sourceId: processId,
            destinationId: process.destination,
            sourceName: sourceProcess.name,
            destinationName: destinationProcess.name,
            sourceNodes: sourceProcess.nodes,
            destinationNodes: destinationProcess.nodes || [],
          });
        }
      }
    });

    return { orderedProcesses, processConnections: connections };
  }, [processes, selectedAirlines]);

  // Initialize connection matrices
  useEffect(() => {
    const newMatrices: Record<string, ConnectionMatrix> = {};

    processConnections.forEach((connection) => {
      const matrix: ConnectionMatrix = {};

      connection.sourceNodes.forEach((sourceNode) => {
        matrix[sourceNode] = {};
        connection.destinationNodes.forEach((destNode) => {
          // Initialize with existing data
          const existingProcess = processes?.[connection.sourceId];
          const existingMatrix = existingProcess?.default_matrix || {};
          const existingValue = existingMatrix[sourceNode]?.[destNode];

          if (existingValue !== undefined && typeof existingValue === 'object') {
            // New format with enabled/percentage
            matrix[sourceNode][destNode] = {
              enabled: existingValue.enabled || false,
              percentage: existingValue.percentage || 0,
            };
          } else if (typeof existingValue === 'number') {
            // Legacy format - convert to new format
            matrix[sourceNode][destNode] = {
              enabled: existingValue > 0,
              percentage: existingValue,
            };
          } else {
            // Default: all destinations disabled with 0%
            matrix[sourceNode][destNode] = {
              enabled: false,
              percentage: 0,
            };
          }
        });
      });

      newMatrices[`${connection.sourceId}-${connection.destinationId}`] = matrix;
    });

    setConnectionMatrices(newMatrices);
  }, [processConnections, processes]);

  // Toggle enabled state for a connection with auto-distribution
  const toggleConnection = (connectionId: string, sourceNode: string, destNode: string) => {
    setConnectionMatrices((prev) => {
      const currentMatrix = prev[connectionId]?.[sourceNode] || {};
      const currentConnection = currentMatrix[destNode] || { enabled: false, percentage: 0 };
      const newEnabled = !currentConnection.enabled;

      // Calculate new matrix with updated enabled state
      const updatedMatrix = {
        ...currentMatrix,
        [destNode]: {
          enabled: newEnabled,
          percentage: 0, // Reset to 0, will be redistributed below
        },
      };

      // Get all enabled destinations after the toggle
      const enabledDestinations = Object.entries(updatedMatrix)
        .filter(([_, connection]) => connection.enabled)
        .map(([destNodeKey, _]) => destNodeKey);

      // Auto-distribute percentages equally among enabled destinations
      if (enabledDestinations.length > 0) {
        const equalPercentage = Math.floor(100 / enabledDestinations.length);
        const remainder = 100 - equalPercentage * enabledDestinations.length;

        enabledDestinations.forEach((destNodeKey, index) => {
          updatedMatrix[destNodeKey] = {
            ...updatedMatrix[destNodeKey],
            percentage: equalPercentage + (index < remainder ? 1 : 0),
          };
        });
      }

      return {
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          [sourceNode]: updatedMatrix,
        },
      };
    });
  };

  // Update percentage for a specific connection (only if enabled)
  const updatePercentage = (connectionId: string, sourceNode: string, destNode: string, value: number) => {
    setConnectionMatrices((prev) => {
      const currentConnection = prev[connectionId]?.[sourceNode]?.[destNode];
      if (!currentConnection?.enabled) return prev;

      return {
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          [sourceNode]: {
            ...prev[connectionId]?.[sourceNode],
            [destNode]: {
              ...currentConnection,
              percentage: Math.max(0, Math.min(100, value)),
            },
          },
        },
      };
    });
  };

  // Get total percentage for a source node (only enabled connections)
  const getTotalPercentage = useCallback(
    (connectionId: string, sourceNode: string) => {
      const matrix = connectionMatrices[connectionId]?.[sourceNode];
      if (!matrix) return 0;
      return Object.values(matrix)
        .filter((connection) => connection.enabled)
        .reduce((sum, connection) => sum + connection.percentage, 0);
    },
    [connectionMatrices]
  );

  // Get enabled destinations for a source node
  const getEnabledDestinations = useCallback(
    (connectionId: string, sourceNode: string) => {
      const matrix = connectionMatrices[connectionId]?.[sourceNode];
      if (!matrix) return [];
      return Object.entries(matrix)
        .filter(([_, connection]) => connection.enabled)
        .map(([destNode, _]) => destNode);
    },
    [connectionMatrices]
  );

  // Get connections for a specific process (both incoming and outgoing)
  const getProcessConnections = useCallback(
    (processId: string) => {
      const incoming = processConnections.filter((conn) => conn.destinationId === processId);
      const outgoing = processConnections.filter((conn) => conn.sourceId === processId);
      return { incoming, outgoing };
    },
    [processConnections]
  );

  // Toggle entire row (all destinations for a source)
  const toggleRow = useCallback(
    (connectionId: string, sourceNode: string) => {
      const connection = processConnections.find((c) => `${c.sourceId}-${c.destinationId}` === connectionId);
      if (!connection) return;

      const currentMatrix = connectionMatrices[connectionId]?.[sourceNode] || {};
      const hasAnyEnabled = Object.values(currentMatrix).some((conn) => conn.enabled);

      setConnectionMatrices((prev) => {
        const newMatrix = { ...(prev[connectionId]?.[sourceNode] || {}) };

        connection.destinationNodes.forEach((destNode) => {
          newMatrix[destNode] = {
            enabled: !hasAnyEnabled,
            percentage: !hasAnyEnabled ? Math.floor(100 / connection.destinationNodes.length) : 0,
          };
        });

        return {
          ...prev,
          [connectionId]: {
            ...prev[connectionId],
            [sourceNode]: newMatrix,
          },
        };
      });
    },
    [processConnections, connectionMatrices]
  );

  // Toggle entire column (all sources for a destination)
  const toggleColumn = useCallback(
    (connectionId: string, destNode: string) => {
      const connection = processConnections.find((c) => `${c.sourceId}-${c.destinationId}` === connectionId);
      if (!connection) return;

      const filteredSourceNodes = connection.sourceNodes.filter((node) => node !== 'unknown');
      const hasAnyEnabled = filteredSourceNodes.some(
        (sourceNode) => connectionMatrices[connectionId]?.[sourceNode]?.[destNode]?.enabled
      );

      setConnectionMatrices((prev) => {
        const newMatrices = { ...prev };

        filteredSourceNodes.forEach((sourceNode) => {
          if (!newMatrices[connectionId]) newMatrices[connectionId] = {};
          if (!newMatrices[connectionId][sourceNode]) newMatrices[connectionId][sourceNode] = {};

          newMatrices[connectionId][sourceNode][destNode] = {
            enabled: !hasAnyEnabled,
            percentage: !hasAnyEnabled ? Math.floor(100 / connection.destinationNodes.length) : 0,
          };
        });

        return newMatrices;
      });
    },
    [processConnections, connectionMatrices]
  );

  // Save matrices to Zustand store
  const saveToStore = () => {
    const updatedProcesses = { ...processes };

    processConnections.forEach((connection) => {
      const connectionId = `${connection.sourceId}-${connection.destinationId}`;
      const matrix = connectionMatrices[connectionId];
      if (matrix && updatedProcesses[connection.sourceId]) {
        // Create a new object to avoid read-only property error
        updatedProcesses[connection.sourceId] = {
          ...updatedProcesses[connection.sourceId],
          default_matrix: matrix,
        };
      }
    });

    setProcesses(updatedProcesses);
    setIsCompleted(true);
  };

  // Check if all matrices are complete (all totals = 100%)
  const isAllComplete = useMemo(() => {
    return processConnections.every((connection) => {
      const connectionId = `${connection.sourceId}-${connection.destinationId}`;
      const matrix = connectionMatrices[connectionId];
      if (!matrix) return false;

      return connection.sourceNodes.every((sourceNode) => {
        const enabledDestinations = getEnabledDestinations(connectionId, sourceNode);
        if (enabledDestinations.length === 0) return false; // Must have at least one enabled destination

        const total = getTotalPercentage(connectionId, sourceNode);
        return Math.abs(total - 100) < 0.1; // Allow small rounding errors
      });
    });
  }, [connectionMatrices, processConnections, getEnabledDestinations, getTotalPercentage]);

  if (!visible) return null;

  return (
    <div className="space-y-6 pt-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-primary">Facility Connection</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure passenger flow percentages between processing facilities
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      {orderedProcesses.length > 0 ? (
        <Tabs defaultValue={orderedProcesses[0]?.id} className="space-y-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${orderedProcesses.length}, 1fr)` }}>
            {orderedProcesses.map((process) => (
              <TabsTrigger
                key={process.id}
                value={process.id}
                className="text-sm font-medium capitalize hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {formatProcessName(process.name)}
              </TabsTrigger>
            ))}
          </TabsList>

          {orderedProcesses.map((process) => {
            const { incoming, outgoing } = getProcessConnections(process.id);

            return (
              <TabsContent key={process.id} value={process.id}>
                <div className="space-y-4">
                  {/* Show incoming connections table */}
                  <TabFacilityConnectionTable
                    connections={incoming}
                    connectionMatrices={connectionMatrices}
                    onToggleConnection={toggleConnection}
                    onUpdatePercentage={updatePercentage}
                    getTotalPercentage={getTotalPercentage}
                    onToggleRow={toggleRow}
                    onToggleColumn={toggleColumn}
                  />

                  {/* If no incoming connections, show info */}
                  {incoming.length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Network className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium text-default-900">No Incoming Connections</h3>
                        <p className="mt-1 text-sm text-default-500">This process is the entry point.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Network className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-default-900">No Process Connections</h3>
            <p className="mt-2 text-sm text-default-500">
              Complete the Processing Procedures tab first to configure facility connections.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Complete Setup Button */}
      {orderedProcesses.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-default-500">
            {orderedProcesses.length} process{orderedProcesses.length > 1 ? 'es' : ''} configured
          </div>
          <Button onClick={saveToStore} disabled={!isAllComplete} className="bg-primary hover:bg-primary/90">
            {isCompleted ? (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              'Complete Connection Setup'
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-4">
        <NextButton showPrevious={true} disabled={!isCompleted} />
      </div>
    </div>
  );
}
