'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { ProcessStep } from '@/types/simulationTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { formatProcessName, cn } from '@/lib/utils';

interface OperatingScheduleEditorProps {
  processFlow: ProcessStep[];
}

export default function OperatingScheduleEditor({ processFlow }: OperatingScheduleEditorProps) {
  // 기본 탭 상태
  const [selectedProcessIndex, setSelectedProcessIndex] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>('');
  
  // 체크박스 상태 관리 (cellId를 키로 사용)
  const [checkedCells, setCheckedCells] = useState<Set<string>>(new Set());
  
  // 드래그 선택 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  
  // Shift 클릭 선택 상태
  const [shiftSelectStart, setShiftSelectStart] = useState<{ row: number; col: number } | null>(null);
  
  // 더블 스페이스 감지를 위한 상태
  const [lastSpaceTime, setLastSpaceTime] = useState<number>(0);
  
  // Shift 범위 선택을 위한 마지막 선택 위치
  const [lastSelectedRow, setLastSelectedRow] = useState<number | null>(null);
  const [lastSelectedCol, setLastSelectedCol] = useState<number | null>(null);
  
  // 행/열 드래그 상태
  const [isRowDragging, setIsRowDragging] = useState(false);
  const [isColDragging, setIsColDragging] = useState(false);
  const [rowDragStart, setRowDragStart] = useState<number | null>(null);
  const [colDragStart, setColDragStart] = useState<number | null>(null);

  // 시간 슬롯 생성 (00:00 ~ 23:50, 10분 단위, 144개)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  }, []);

  // 현재 선택된 존의 시설들
  const currentFacilities = useMemo(() => {
    if (!processFlow[selectedProcessIndex] || !selectedZone) return [];
    const zone = processFlow[selectedProcessIndex].zones[selectedZone];
    return zone?.facilities || [];
  }, [processFlow, selectedProcessIndex, selectedZone]);

  // 체크박스 토글 핸들러 (개별 클릭용)
  const handleCheckboxToggle = (rowIndex: number, colIndex: number) => {
    const cellId = `${rowIndex}-${colIndex}`;
    setCheckedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return newSet;
    });
  };

  // 범위 셀 ID 생성 헬퍼 함수
  const generateRangeCellIds = useCallback((startRow: number, startCol: number, endRow: number, endCol: number) => {
    const cellIds = new Set<string>();
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (currentFacilities[col]) {
          cellIds.add(`${row}-${col}`);
        }
      }
    }

    return cellIds;
  }, [currentFacilities]);

  // 범위 선택 함수
  const selectCellRange = useCallback((startRow: number, startCol: number, endRow: number, endCol: number) => {
    const rangeCells = generateRangeCellIds(startRow, startCol, endRow, endCol);
    setSelectedCells(rangeCells);
  }, [generateRangeCellIds]);

  // 셀 클릭 핸들러 (Shift, Ctrl 클릭 지원)
  const handleCellClick = useCallback((cellId: string, rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl + 클릭: 다중 선택
      if (e.shiftKey && shiftSelectStart) {
        // Ctrl + Shift + 클릭: 기존 선택 유지하면서 범위 추가
        const rangeCells = generateRangeCellIds(shiftSelectStart.row, shiftSelectStart.col, rowIndex, colIndex);
        setSelectedCells(prev => {
          const newSet = new Set(prev);
          rangeCells.forEach(id => newSet.add(id));
          return newSet;
        });
      } else {
        // Ctrl + 클릭: 개별 셀 토글
        setSelectedCells(prev => {
          const newSet = new Set(prev);
          if (newSet.has(cellId)) {
            newSet.delete(cellId);
          } else {
            newSet.add(cellId);
          }
          return newSet;
        });
        setShiftSelectStart({ row: rowIndex, col: colIndex });
      }
    } else if (e.shiftKey && shiftSelectStart) {
      // Shift + 클릭: 범위 선택 (기존 선택 대체)
      selectCellRange(shiftSelectStart.row, shiftSelectStart.col, rowIndex, colIndex);
    } else {
      // 일반 클릭: 새로 선택 (기존 선택 해제)
      setShiftSelectStart({ row: rowIndex, col: colIndex });
      setSelectedCells(new Set([cellId]));
    }
  }, [shiftSelectStart, selectCellRange, generateRangeCellIds]);

  // 드래그 이벤트 핸들러들
  const handleCellMouseDown = useCallback((cellId: string, rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    // Shift 또는 Ctrl 키가 눌려있으면 드래그 시작하지 않음
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      handleCellClick(cellId, rowIndex, colIndex, e);
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    setDragStart({ row: rowIndex, col: colIndex });
    // 일반 드래그 시작: 새로 선택 (기존 선택 해제)
    setSelectedCells(new Set([cellId]));
    setShiftSelectStart({ row: rowIndex, col: colIndex });
  }, [handleCellClick]);

  const handleCellMouseEnter = useCallback(
    (cellId: string, rowIndex: number, colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      if (isDragging && dragStart) {
        const rangeCells = generateRangeCellIds(dragStart.row, dragStart.col, rowIndex, colIndex);
        setSelectedCells(rangeCells);
      }
    },
    [isDragging, dragStart, generateRangeCellIds]
  );

  const handleCellMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // 전역 마우스업 이벤트
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setIsRowDragging(false);
      setRowDragStart(null);
      setIsColDragging(false);
      setColDragStart(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // 스페이스바 이벤트 - 선택된 셀들의 체크박스 모두 토글
  const handleSpaceKey = useCallback(() => {
    const currentTime = Date.now();
    const isDoubleSpace = currentTime - lastSpaceTime < 300; // 300ms 내 더블 스페이스
    
    if (selectedCells.size > 0) {
      if (isDoubleSpace) {
        // 더블 스페이스: 선택 영역 해제
        setSelectedCells(new Set());
        setShiftSelectStart(null);
      } else {
        // 단일 스페이스: 체크박스 토글 (선택 영역 유지)
        setCheckedCells(prev => {
          const newSet = new Set(prev);
          
          // 선택된 셀들 중 하나라도 체크되어 있는지 확인
          const hasAnyChecked = Array.from(selectedCells).some(cellId => newSet.has(cellId));
          
          if (hasAnyChecked) {
            // 하나라도 체크되어 있으면 모두 해제
            selectedCells.forEach(cellId => newSet.delete(cellId));
          } else {
            // 모두 체크되어 있지 않으면 모두 체크
            selectedCells.forEach(cellId => newSet.add(cellId));
          }
          
          return newSet;
        });
      }
    }
    
    setLastSpaceTime(currentTime);
  }, [selectedCells, lastSpaceTime]);

  // 열 드래그 핸들러들
  const handleColumnMouseDown = useCallback((colIndex: number, e: React.MouseEvent) => {
    // Shift나 Ctrl 키가 눌려있으면 클릭 처리
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      handleColumnClick(colIndex, e);
      return;
    }

    e.preventDefault();
    setIsColDragging(true);
    setColDragStart(colIndex);
    
    // 드래그 시작할 때 해당 열 선택
    const columnCellIds = new Set<string>();
    for (let row = 0; row < timeSlots.length; row++) {
      columnCellIds.add(`${row}-${colIndex}`);
    }
    setSelectedCells(columnCellIds);
    setLastSelectedCol(colIndex);
  }, [timeSlots.length]);

  const handleColumnMouseEnter = useCallback((colIndex: number, e: React.MouseEvent) => {
    if (isColDragging && colDragStart !== null) {
      e.preventDefault();
      
      // 드래그 범위의 모든 열 선택
      const startCol = Math.min(colDragStart, colIndex);
      const endCol = Math.max(colDragStart, colIndex);
      
      const rangeCellIds = new Set<string>();
      for (let col = startCol; col <= endCol; col++) {
        for (let row = 0; row < timeSlots.length; row++) {
          rangeCellIds.add(`${row}-${col}`);
        }
      }
      
      setSelectedCells(rangeCellIds);
    }
  }, [isColDragging, colDragStart, timeSlots.length]);

  const handleColumnMouseUp = useCallback(() => {
    setIsColDragging(false);
    setColDragStart(null);
  }, []);

  // 열 전체 선택/해제 핸들러 (클릭용)
  const handleColumnClick = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.shiftKey && lastSelectedCol !== null) {
      // Shift + 클릭: 범위 선택 (이전 선택 열부터 현재 열까지)
      const startCol = Math.min(lastSelectedCol, colIndex);
      const endCol = Math.max(lastSelectedCol, colIndex);
      
      const rangeCellIds = new Set<string>();
      for (let col = startCol; col <= endCol; col++) {
        for (let row = 0; row < timeSlots.length; row++) {
          rangeCellIds.add(`${row}-${col}`);
        }
      }
      
      setSelectedCells(rangeCellIds);
    } else {
      // 해당 열의 모든 셀 ID 생성 (0~143 행)
      const columnCellIds = new Set<string>();
      for (let row = 0; row < timeSlots.length; row++) {
        columnCellIds.add(`${row}-${colIndex}`);
      }

      setSelectedCells(prev => {
        // Ctrl/Cmd 키가 눌려있지 않으면 기존 선택 해제
        const newSet = e.ctrlKey || e.metaKey ? new Set(prev) : new Set<string>();
        
        // 현재 선택된 셀들 중 해당 열이 전체 선택되어 있는지 확인
        const isFullySelected = Array.from(columnCellIds).every(cellId => newSet.has(cellId));
        
        if (isFullySelected) {
          // 전체 선택되어 있으면 해제
          columnCellIds.forEach(cellId => newSet.delete(cellId));
        } else {
          // 일부 또는 전혀 선택되지 않은 경우 전체 선택
          columnCellIds.forEach(cellId => newSet.add(cellId));
        }
        
        return newSet;
      });
    }

    // 마지막 선택 열 기록
    setLastSelectedCol(colIndex);
    // Shift 선택 시작점 설정
    setShiftSelectStart({ row: 0, col: colIndex });
  }, [timeSlots.length, lastSelectedCol]);

  // 행 드래그 핸들러들
  const handleRowMouseDown = useCallback((rowIndex: number, e: React.MouseEvent) => {
    // Shift나 Ctrl 키가 눌려있으면 클릭 처리
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      handleRowClick(rowIndex, e);
      return;
    }

    e.preventDefault();
    setIsRowDragging(true);
    setRowDragStart(rowIndex);
    
    // 드래그 시작할 때 해당 행 선택
    const rowCellIds = new Set<string>();
    for (let col = 0; col < currentFacilities.length; col++) {
      rowCellIds.add(`${rowIndex}-${col}`);
    }
    setSelectedCells(rowCellIds);
    setLastSelectedRow(rowIndex);
  }, [currentFacilities.length]);

  const handleRowMouseEnter = useCallback((rowIndex: number, e: React.MouseEvent) => {
    if (isRowDragging && rowDragStart !== null) {
      e.preventDefault();
      
      // 드래그 범위의 모든 행 선택
      const startRow = Math.min(rowDragStart, rowIndex);
      const endRow = Math.max(rowDragStart, rowIndex);
      
      const rangeCellIds = new Set<string>();
      for (let row = startRow; row <= endRow; row++) {
        for (let col = 0; col < currentFacilities.length; col++) {
          rangeCellIds.add(`${row}-${col}`);
        }
      }
      
      setSelectedCells(rangeCellIds);
    }
  }, [isRowDragging, rowDragStart, currentFacilities.length]);

  const handleRowMouseUp = useCallback(() => {
    setIsRowDragging(false);
    setRowDragStart(null);
  }, []);

  // 행 전체 선택/해제 핸들러 (클릭용)
  const handleRowClick = useCallback((rowIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.shiftKey && lastSelectedRow !== null) {
      // Shift + 클릭: 범위 선택 (이전 선택 행부터 현재 행까지)
      const startRow = Math.min(lastSelectedRow, rowIndex);
      const endRow = Math.max(lastSelectedRow, rowIndex);
      
      const rangeCellIds = new Set<string>();
      for (let row = startRow; row <= endRow; row++) {
        for (let col = 0; col < currentFacilities.length; col++) {
          rangeCellIds.add(`${row}-${col}`);
        }
      }
      
      setSelectedCells(rangeCellIds);
    } else {
      // 해당 행의 모든 셀 ID 생성 (0~currentFacilities.length-1 열)
      const rowCellIds = new Set<string>();
      for (let col = 0; col < currentFacilities.length; col++) {
        rowCellIds.add(`${rowIndex}-${col}`);
      }

      setSelectedCells(prev => {
        // Ctrl/Cmd 키가 눌려있지 않으면 기존 선택 해제
        const newSet = e.ctrlKey || e.metaKey ? new Set(prev) : new Set<string>();
        
        // 현재 선택된 셀들 중 해당 행이 전체 선택되어 있는지 확인
        const isFullySelected = Array.from(rowCellIds).every(cellId => newSet.has(cellId));
        
        if (isFullySelected) {
          // 전체 선택되어 있으면 해제
          rowCellIds.forEach(cellId => newSet.delete(cellId));
        } else {
          // 일부 또는 전혀 선택되지 않은 경우 전체 선택
          rowCellIds.forEach(cellId => newSet.add(cellId));
        }
        
        return newSet;
      });
    }

    // 마지막 선택 행 기록
    setLastSelectedRow(rowIndex);
    // Shift 선택 시작점 설정
    setShiftSelectStart({ row: rowIndex, col: 0 });
  }, [currentFacilities.length, lastSelectedRow]);

  // 키보드 이벤트 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpaceKey();
      } else if (e.code === 'Escape') {
        // ESC: 모든 선택 해제
        e.preventDefault();
        setSelectedCells(new Set());
        setShiftSelectStart(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSpaceKey]);

  // 첫 번째 존 자동 선택
  React.useEffect(() => {
    if (processFlow[selectedProcessIndex]) {
      const zones = Object.keys(processFlow[selectedProcessIndex].zones);
      if (zones.length > 0) {
        setSelectedZone(zones[0]);
      }
    }
  }, [selectedProcessIndex, processFlow]);

  // 탭 변경 시 선택 상태들 초기화
  React.useEffect(() => {
    setCheckedCells(new Set());
    setIsDragging(false);
    setDragStart(null);
    setSelectedCells(new Set());
    setShiftSelectStart(null);
    setLastSelectedRow(null);
    setLastSelectedCol(null);
    setIsRowDragging(false);
    setRowDragStart(null);
    setIsColDragging(false);
    setColDragStart(null);
  }, [selectedProcessIndex, selectedZone]);

  if (processFlow.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Operating Schedule Editor</div>
            <div className="text-sm font-normal text-default-500">Configure time-based facility operations</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 2중 탭 - 라벨을 좌측에, 탭들을 위아래로 딱 붙여서 배치 */}
        <div className="mb-2 space-y-0">
          {/* 1단계 탭: Process Selection */}
          <div className="flex items-center gap-4">
            <div className="w-16 text-sm font-medium text-default-900">Process</div>
            <Tabs
              value={selectedProcessIndex.toString()}
              onValueChange={(value) => setSelectedProcessIndex(parseInt(value))}
              className="flex-1"
            >
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${processFlow.length}, 1fr)` }}>
                {processFlow.map((step, index) => (
                  <TabsTrigger key={index} value={index.toString()} className="text-sm font-medium text-default-900">
                    {formatProcessName(step.name)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* 2단계 탭: Zone Selection */}
          {processFlow[selectedProcessIndex] && (
            <div className="flex items-center gap-4">
              <div className="w-16 text-sm font-medium text-default-900">Zone</div>
              <Tabs value={selectedZone} onValueChange={setSelectedZone} className="flex-1">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(processFlow[selectedProcessIndex].zones).length}, 1fr)` }}>
                  {Object.keys(processFlow[selectedProcessIndex].zones).map((zoneName) => (
                    <TabsTrigger key={zoneName} value={zoneName} className="text-sm font-medium text-default-900">
                      {zoneName}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {/* 엑셀 그리드 테이블 */}
        {selectedZone && currentFacilities.length > 0 ? (
          <div className="max-h-96 overflow-auto rounded-lg border">
            <table className="w-full table-fixed text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="w-16 border-r p-2 text-left select-none">Time</th>
                  {currentFacilities.map((facility, colIndex) => (
                    <th 
                      key={facility.id} 
                      className="min-w-20 border-r p-2 text-center cursor-pointer hover:bg-primary/10 transition-colors select-none"
                      onMouseDown={(e) => handleColumnMouseDown(colIndex, e)}
                      onMouseEnter={(e) => handleColumnMouseEnter(colIndex, e)}
                      onMouseUp={handleColumnMouseUp}
                      title={`Click or drag to select columns: ${facility.id}`}
                    >
                      {facility.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    <td 
                      className="border-r p-1 text-center text-xs font-medium text-default-500 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                      onMouseDown={(e) => handleRowMouseDown(rowIndex, e)}
                      onMouseEnter={(e) => handleRowMouseEnter(rowIndex, e)}
                      onMouseUp={handleRowMouseUp}
                      title={`Click or drag to select rows: ${timeSlot}`}
                    >
                      {timeSlot}
                    </td>
                    {currentFacilities.map((facility, colIndex) => {
                      const cellId = `${rowIndex}-${colIndex}`;
                      const isChecked = checkedCells.has(cellId);
                      const isSelected = selectedCells.has(cellId);

                      return (
                        <td 
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "border-r cursor-pointer select-none p-1",
                            isSelected && "bg-primary/20"
                          )}
                          onMouseDown={(e) => handleCellMouseDown(cellId, rowIndex, colIndex, e)}
                          onMouseEnter={(e) => handleCellMouseEnter(cellId, rowIndex, colIndex, e)}
                          onMouseUp={handleCellMouseUp}
                          onContextMenu={(e) => {
                            // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                            if (e.ctrlKey || e.metaKey) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex h-6 items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // 드래그 이벤트와 충돌 방지
                                handleCheckboxToggle(rowIndex, colIndex);
                              }}
                              className={cn(
                                "flex h-4 w-4 cursor-pointer items-center justify-center rounded border-2 transition-all duration-200",
                                isChecked 
                                  ? "border-primary bg-primary hover:bg-primary/90" 
                                  : "border-gray-300 bg-white hover:border-gray-400"
                              )}
                            >
                              {isChecked && (
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedZone ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No facilities configured for this zone
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Select a process and zone to configure operating schedule
          </div>
        )}
      </CardContent>
    </Card>
  );
}