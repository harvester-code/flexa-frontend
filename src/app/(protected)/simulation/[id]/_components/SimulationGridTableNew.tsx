'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/Input';

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

interface TabConnectionTableProps {
  connections: ProcessConnection[];
  connectionMatrices: Record<string, ConnectionMatrix>;
  onToggleConnection: (connectionId: string, sourceNode: string, destNode: string) => void;
  onUpdatePercentage: (connectionId: string, sourceNode: string, destNode: string, value: number) => void;
  getTotalPercentage: (connectionId: string, sourceNode: string) => number;
  onToggleRow?: (connectionId: string, sourceNode: string) => void;
  onToggleColumn?: (connectionId: string, destNode: string) => void;
}

export default function SimulationGridTableNew({
  connections,
  connectionMatrices,
  onToggleConnection,
  onUpdatePercentage,
  getTotalPercentage,
  onToggleRow,
  onToggleColumn,
}: TabConnectionTableProps) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);

  // Helper function to format process names
  const formatProcessName = useCallback((str: string) => {
    // Handle unknown or empty values
    if (!str || str.toLowerCase() === 'unknown') {
      return 'Process';
    }

    // Handle specific process name mappings
    const processNameMap: Record<string, string> = {
      airline: 'Airline',
      'check-in': 'Check-In',
      checkin: 'Check-In',
      departure_gate: 'Departure Gate',
      'departure-gate': 'Departure Gate',
      security: 'Security',
      gate: 'Gate',
    };

    const lowerStr = str.toLowerCase();
    if (processNameMap[lowerStr]) {
      return processNameMap[lowerStr];
    }

    // Default capitalization
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  // Get all unique source nodes and destination nodes from all connections
  const { allSourceNodes, allDestinationNodes } = useMemo(() => {
    // 경준: allDestinationNodes는 결국 테이블의 헤더로 사용됨.
    const sourceNodes: Array<{ node: string; connectionId: string; sourceName: string }> = [];
    const destinationNodes: Array<{ node: string; connectionId: string; destinationName: string }> = [];

    connections.forEach((connection) => {
      const connectionId = `${connection.sourceId}-${connection.destinationId}`;

      connection.sourceNodes
        .filter((node) => node !== 'unknown')
        .forEach((node) => {
          sourceNodes.push({
            node,
            connectionId,
            sourceName: connection.sourceName,
          });
        });

      connection.destinationNodes.forEach((node) => {
        destinationNodes.push({
          node,
          connectionId,
          destinationName: connection.destinationName,
        });
      });
    });

    return {
      allSourceNodes: sourceNodes,
      allDestinationNodes: destinationNodes,
    };
  }, [connections]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedCells.size > 0) {
        e.preventDefault();

        // Check current state of selected cells
        const selectedCellsData: Array<{
          connectionId: string;
          sourceNode: string;
          destNode: string;
          isEnabled: boolean;
        }> = [];

        selectedCells.forEach((cellId) => {
          const parts = cellId.split('-');
          if (parts.length >= 3) {
            const connectionId = `${parts[0]}-${parts[1]}`;
            const sourceNode = parts.slice(2, -1).join('-');
            const destNode = parts[parts.length - 1];

            // Check if this connection exists and is enabled
            // connectionMatrices는 props에서 참조하므로 dependency에 포함하지 않아도 됨
            const matrix = connectionMatrices[connectionId] || {};
            const connectionData = matrix[sourceNode]?.[destNode];
            const isEnabled = connectionData?.enabled || false;

            selectedCellsData.push({
              connectionId,
              sourceNode,
              destNode,
              isEnabled,
            });
          }
        });

        // Smart toggle: if any cell is unchecked, check all; if all are checked, uncheck all
        const hasUnchecked = selectedCellsData.some((cell) => !cell.isEnabled);
        const shouldEnable = hasUnchecked;

        // Apply the same action to all selected cells
        selectedCellsData.forEach(({ connectionId, sourceNode, destNode, isEnabled }) => {
          // Only toggle if the current state is different from desired state
          if (isEnabled !== shouldEnable) {
            onToggleConnection(connectionId, sourceNode, destNode);
          }
        });

        setSelectedCells(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCells, onToggleConnection]);

  const handleCellMouseDown = useCallback((cellId: string, rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    e.preventDefault(); // 텍스트 선택 방지
    setIsDragging(true);
    setDragStart({ row: rowIndex, col: colIndex });
    setSelectedCells(new Set([cellId]));
  }, []);

  const handleCellMouseEnter = useCallback(
    (cellId: string, rowIndex: number, colIndex: number, e: React.MouseEvent) => {
      e.preventDefault(); // 텍스트 선택 방지
      if (isDragging && dragStart) {
        const newSelectedCells = new Set<string>();
        const minRow = Math.min(dragStart.row, rowIndex);
        const maxRow = Math.max(dragStart.row, rowIndex);
        const minCol = Math.min(dragStart.col, colIndex);
        const maxCol = Math.max(dragStart.col, colIndex);

        // Generate cell IDs for the selected range
        allSourceNodes.forEach((sourceInfo, sRowIndex) => {
          allDestinationNodes.forEach((destInfo, dColIndex) => {
            if (sRowIndex >= minRow && sRowIndex <= maxRow && dColIndex >= minCol && dColIndex <= maxCol) {
              newSelectedCells.add(`${sourceInfo.connectionId}-${sourceInfo.node}-${destInfo.node}`);
            }
          });
        });

        setSelectedCells(newSelectedCells);
      }
    },
    [isDragging, dragStart, allSourceNodes, allDestinationNodes]
  );

  const handleCellMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    const handleGlobalSelectStart = (e: Event) => {
      if (isDragging) {
        e.preventDefault(); // 드래그 중 텍스트 선택 방지
      }
    };

    const handleGlobalDragStart = (e: Event) => {
      if (isDragging) {
        e.preventDefault(); // 드래그 중 기본 드래그 동작 방지
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('selectstart', handleGlobalSelectStart);
    document.addEventListener('dragstart', handleGlobalDragStart);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('selectstart', handleGlobalSelectStart);
      document.removeEventListener('dragstart', handleGlobalDragStart);
    };
  }, [isDragging]);

  const handleColumnToggle = useCallback(
    (destNode: string) => {
      // Find all connections that have this destination node
      const relevantConnections = connections.filter((conn) => conn.destinationNodes.includes(destNode));

      relevantConnections.forEach((connection) => {
        const connectionId = `${connection.sourceId}-${connection.destinationId}`;
        if (onToggleColumn) {
          onToggleColumn(connectionId, destNode);
        }
      });
    },
    [connections, onToggleColumn]
  );

  const handleRowToggle = useCallback(
    (sourceNode: string, connectionId: string) => {
      if (onToggleRow) {
        onToggleRow(connectionId, sourceNode);
      }
    },
    [onToggleRow]
  );

  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse select-none">
        <thead>
          <tr>
            <th className="border border-gray-200 bg-primary/5 p-3 text-center font-medium text-primary">Process</th>

            {allDestinationNodes.map((destInfo) => (
              <th
                key={`${destInfo.connectionId}-${destInfo.node}`}
                className="cursor-pointer border border-gray-200 bg-primary/10 p-2 text-center font-medium text-primary transition-colors hover:bg-primary/20"
                style={{ minWidth: '100px' }}
                onClick={() => handleColumnToggle(destInfo.node)}
              >
                <div className="mb-1 text-xs text-default-500">{formatProcessName(destInfo.destinationName)}</div>
                <div>{destInfo.node}</div>
              </th>
            ))}
            <th className="border border-gray-200 bg-primary/5 p-3 text-center font-medium text-primary">Total</th>
          </tr>
        </thead>

        <tbody>
          {allSourceNodes.map((sourceInfo, rowIndex) => {
            const total = getTotalPercentage(sourceInfo.connectionId, sourceInfo.node);
            const isComplete = Math.abs(total - 100) < 0.1;

            return (
              <tr key={`${sourceInfo.connectionId}-${sourceInfo.node}`} className="hover:bg-gray-50">
                <td
                  className="cursor-pointer border border-gray-200 bg-primary/5 p-2 text-center font-medium text-primary transition-colors hover:bg-primary/10"
                  onClick={() => handleRowToggle(sourceInfo.node, sourceInfo.connectionId)}
                >
                  <div className="mb-1 text-xs text-default-500">{formatProcessName(sourceInfo.sourceName)}</div>
                  <div className="whitespace-pre-line leading-tight">
                    {sourceInfo.node.includes('(') ? sourceInfo.node.replace(' (', '\n(') : sourceInfo.node}
                  </div>
                </td>

                {allDestinationNodes.map((destInfo, colIndex) => {
                  // Check if this source and destination are connected
                  const sourceConnection = connections.find(
                    (conn) =>
                      conn.sourceNodes.includes(sourceInfo.node) &&
                      conn.destinationNodes.includes(destInfo.node) &&
                      `${conn.sourceId}-${conn.destinationId}` === sourceInfo.connectionId
                  );

                  if (!sourceConnection) {
                    return (
                      <td
                        key={`${destInfo.connectionId}-${destInfo.node}`}
                        className="border border-gray-200 bg-gray-50 p-2"
                        style={{ minWidth: '100px' }}
                      >
                        <div className="text-center text-sm text-muted-foreground">-</div>
                      </td>
                    );
                  }

                  const matrix = connectionMatrices[sourceInfo.connectionId] || {};
                  const connectionData = matrix[sourceInfo.node]?.[destInfo.node] || {
                    enabled: false,
                    percentage: 0,
                  };
                  const isEnabled = connectionData.enabled;
                  const percentage = connectionData.percentage;
                  const cellId = `${sourceInfo.connectionId}-${sourceInfo.node}-${destInfo.node}`;
                  const isSelected = selectedCells.has(cellId);

                  return (
                    <td
                      key={`${destInfo.connectionId}-${destInfo.node}`}
                      className={`cursor-cell border border-gray-200 p-2 ${isSelected ? 'bg-blue-100' : ''}`}
                      style={{ minWidth: '100px' }}
                      onMouseDown={(e) => handleCellMouseDown(cellId, rowIndex, colIndex, e)}
                      onMouseEnter={(e) => handleCellMouseEnter(cellId, rowIndex, colIndex, e)}
                    >
                      <div className="space-y-2">
                        {/* Custom Checkbox for enabling/disabling connection */}
                        <div className="mb-2 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // 드래그 이벤트와 충돌 방지
                              onToggleConnection(sourceInfo.connectionId, sourceInfo.node, destInfo.node);
                            }}
                            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded border-2 transition-all duration-200 ${
                              isEnabled
                                ? 'border-primary bg-primary hover:bg-primary/90'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            } `}
                          >
                            {isEnabled && (
                              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Percentage input (only enabled when checkbox is checked) */}
                        <Input
                          type="text"
                          value={percentage}
                          onChange={(e) => {
                            const numericValue = (e.target as HTMLInputElement).value.replace(/[^0-9.]/g, '');
                            const value = parseFloat(numericValue) || 0;
                            const clampedValue = Math.min(100, Math.max(0, value));
                            onUpdatePercentage(sourceInfo.connectionId, sourceInfo.node, destInfo.node, clampedValue);
                          }}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onMouseDown={(e) => e.stopPropagation()} // 드래그 이벤트와 충돌 방지
                          onFocus={(e) => e.stopPropagation()} // 포커스 시 드래그 방지
                          disabled={!isEnabled}
                          className={`h-8 text-center text-sm ${!isEnabled ? 'bg-gray-100 text-muted-foreground' : ''}`}
                        />

                        {/* Progress bar */}
                        <div className="h-1 w-full rounded bg-gray-200">
                          <div
                            className={`h-full rounded transition-all duration-200 ${isEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                            style={{ width: `${isEnabled ? percentage : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  );
                })}

                <td className="border border-gray-200 p-3 text-center">
                  <div className={`font-medium ${isComplete ? 'text-primary' : 'text-destructive'}`}>
                    {total.toFixed(1)}%
                  </div>
                  {isComplete && <CheckSquare className="mx-auto mt-1 h-4 w-4 text-primary" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
