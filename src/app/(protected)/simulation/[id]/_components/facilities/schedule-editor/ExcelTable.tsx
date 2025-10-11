"use client";

import React, { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getBadgeColor } from "@/styles/colors";
import { ExcelTableProps, CategoryBadge } from "./types";

const ExcelTable: React.FC<ExcelTableProps> = React.memo(
  ({
    selectedZone,
    currentFacilities,
    timeSlots,
    selectedCells,
    cellBadges,
    disabledCells,
    copiedCells = new Set(),
    isFullScreen = false,
    virtualScroll,
    handlers,
    isPreviousDay = false,
  }) => {
    const {
      visibleTimeSlots = timeSlots,
      startIndex = 0,
      totalHeight = 0,
      offsetY = 0,
      onScroll,
    } = virtualScroll;

    // 선택된 행과 열 계산
    const selectedRowsAndCols = useMemo(() => {
      const selectedRows = new Set<number>();
      const selectedCols = new Set<number>();

      selectedCells.forEach((cellId) => {
        const [rowStr, colStr] = cellId.split("-");
        const rowIndex = parseInt(rowStr, 10);
        const colIndex = parseInt(colStr, 10);

        // 전체 행이 선택되었는지 확인
        let isFullRowSelected = true;
        for (let col = 0; col < currentFacilities.length; col++) {
          if (!selectedCells.has(`${rowIndex}-${col}`)) {
            isFullRowSelected = false;
            break;
          }
        }
        if (isFullRowSelected) selectedRows.add(rowIndex);

        // 전체 열이 선택되었는지 확인
        let isFullColSelected = true;
        for (let row = 0; row < timeSlots.length; row++) {
          if (!selectedCells.has(`${row}-${colIndex}`)) {
            isFullColSelected = false;
            break;
          }
        }
        if (isFullColSelected) selectedCols.add(colIndex);
      });

      return { selectedRows, selectedCols };
    }, [selectedCells, currentFacilities.length, timeSlots.length]);
    
    // 🖼️ cellId 파싱 캐시 (성능 최적화)
    const parseCellId = useMemo(() => {
      const cache = new Map<string, [number, number]>();
      return (cellId: string): [number, number] => {
        if (!cache.has(cellId)) {
          const [rowStr, colStr] = cellId.split("-");
          cache.set(cellId, [parseInt(rowStr, 10), parseInt(colStr, 10)]);
        }
        return cache.get(cellId)!;
      };
    }, []);

    // 🖼️ 선택된 셀의 boxShadow 스타일 계산 (기본 border와 충돌하지 않음)
    const getSelectionStyles = useMemo(() => {
      const styleMap = new Map<string, { boxShadow?: string }>();

      // 선택된 영역의 경계를 찾아서 boxShadow로 표시
      selectedCells.forEach((cellId) => {
        const [rowIndex, colIndex] = parseCellId(cellId);

        // 경계 확인
        const topCellId = `${rowIndex - 1}-${colIndex}`;
        const bottomCellId = `${rowIndex + 1}-${colIndex}`;
        const leftCellId = `${rowIndex}-${colIndex - 1}`;
        const rightCellId = `${rowIndex}-${colIndex + 1}`;

        const isTopBorder = !selectedCells.has(topCellId);
        const isBottomBorder = !selectedCells.has(bottomCellId);
        const isLeftBorder = !selectedCells.has(leftCellId);
        const isRightBorder = !selectedCells.has(rightCellId);

        // 각 방향별로 boxShadow 추가 - 복사한 셀이 있을 때는 선택 표시 숨김
        const shadows: string[] = [];
        // Only show selection if no cells are being shown as copied
        if (isTopBorder) shadows.push("inset 0 2px 0 0 #8b5cf6");
        if (isBottomBorder) shadows.push("inset 0 -2px 0 0 #8b5cf6");
        if (isLeftBorder) shadows.push("inset 2px 0 0 0 #8b5cf6");
        if (isRightBorder) shadows.push("inset -2px 0 0 0 #8b5cf6");

        if (shadows.length > 0) {
          styleMap.set(cellId, {
            boxShadow: shadows.join(", "),
          });
        }
      });

      return (rowIndex: number, colIndex: number) => {
        const cellId = `${rowIndex}-${colIndex}`;
        return styleMap.get(cellId) || {};
      };
    }, [selectedCells, parseCellId]);

    // Check if cell should show copy border overlay
    const getCopyBorderInfo = useCallback(
      (rowIndex: number, colIndex: number) => {
        if (copiedCells.size === 0) return null;

        const cellId = `${rowIndex}-${colIndex}`;
        if (!copiedCells.has(cellId)) return null;

        // Find bounds of copied region
        let minRow = Infinity,
          maxRow = -Infinity;
        let minCol = Infinity,
          maxCol = -Infinity;

        Array.from(copiedCells).forEach((id) => {
          const [r, c] = (id as string).split("-").map(Number);
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        });

        // Check if cell is on the edge
        return {
          hasTop: rowIndex === minRow,
          hasBottom: rowIndex === maxRow,
          hasLeft: colIndex === minCol,
          hasRight: colIndex === maxCol,
        };
      },
      [copiedCells]
    );

    if (!selectedZone || currentFacilities.length === 0) {
      if (selectedZone) {
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No facilities configured for this zone
          </div>
        );
      } else {
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Select a process and zone to configure operating schedule
          </div>
        );
      }
    }

    return (
      <div
        className={`rounded-lg border overflow-auto`}
        onScroll={onScroll}
        style={
          isFullScreen
            ? { height: "100%", minHeight: "100%" }
            : { height: 500, maxHeight: "70vh" }
        }
      >
        {/* 🚀 가상화 스크롤 컨테이너 */}
        <div className="relative" style={{ height: "auto" }}>
          <table className="w-full table-auto text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 bg-muted z-50">
              <tr className="bg-muted">
                <th
                  className="w-20 cursor-pointer select-none border border-gray-200 p-2 text-center transition-colors hover:bg-primary/10 overflow-hidden bg-purple-50 whitespace-nowrap text-ellipsis sticky top-0 font-semibold"
                  onClick={handlers.timeHeader.onClick}
                  onContextMenu={(e) => {
                    // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                    } else {
                      handlers.timeHeader.onRightClick(e);
                    }
                  }}
                  title="Click to select all cells. Right-click to apply badges to all cells."
                >
                  Time
                </th>
                {currentFacilities.map((facility, colIndex) => (
                  <th
                    key={facility.id}
                    className={`cursor-pointer select-none border border-gray-200 p-2 text-center transition-colors hover:bg-primary/10 sticky top-0 ${
                      selectedRowsAndCols.selectedCols.has(colIndex)
                        ? "bg-primary/20"
                        : "bg-muted"
                    }`}
                    onMouseDown={(e) => {
                      // 우클릭이 아닐 때만 드래그 처리
                      if (e.button !== 2) {
                        handlers.column.onMouseDown(colIndex, e);
                      }
                    }}
                    onMouseEnter={(e) => {
                      // 우클릭 드래그가 아닐 때만 처리
                      if (e.buttons !== 2) {
                        handlers.column.onMouseEnter(colIndex, e);
                      }
                    }}
                    onMouseUp={(e) => {
                      // 우클릭이 아닐 때만 처리
                      if (e.button !== 2) {
                        handlers.column.onMouseUp();
                      }
                    }}
                    onContextMenu={(e) => {
                      // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                      } else {
                        handlers.column.onRightClick(e, colIndex);
                      }
                    }}
                    title={`Click or drag to select columns: ${facility.id}. Right-click to apply badges to entire column.`}
                  >
                    {facility.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleTimeSlots.map((timeSlot, visibleRowIndex) => {
                const rowIndex = startIndex + visibleRowIndex;
                return (
                  <tr key={rowIndex} className="h-15">
                    <td
                      className={`w-20 cursor-pointer select-none border border-gray-200 p-1 text-center text-xs font-medium bg-purple-50 text-gray-700 transition-colors hover:bg-purple-100 overflow-hidden whitespace-nowrap text-ellipsis ${
                        selectedRowsAndCols.selectedRows.has(rowIndex)
                          ? "bg-primary/20"
                          : ""
                      }`}
                      onMouseDown={(e) => {
                        // 우클릭이 아닐 때만 드래그 처리
                        if (e.button !== 2) {
                          handlers.row.onMouseDown(rowIndex, e);
                        }
                      }}
                      onMouseEnter={(e) => {
                        // 우클릭 드래그가 아닐 때만 처리
                        if (e.buttons !== 2) {
                          handlers.row.onMouseEnter(rowIndex, e);
                        }
                      }}
                      onMouseUp={(e) => {
                        // 우클릭이 아닐 때만 처리
                        if (e.button !== 2) {
                          handlers.row.onMouseUp();
                        }
                      }}
                      onContextMenu={(e) => {
                        // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                        } else {
                          handlers.row.onRightClick(e, rowIndex);
                        }
                      }}
                      title={`Click or drag to select rows: ${timeSlot}. Right-click to apply badges to entire row.`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isPreviousDay &&
                          rowIndex <
                            timeSlots.findIndex((t) => t === "00:00") && (
                            <span className="px-1 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-800 rounded">
                              D-1
                            </span>
                          )}
                        <span>{timeSlot}</span>
                      </div>
                    </td>
                    {currentFacilities.map((facility, colIndex) => {
                      const cellId = `${rowIndex}-${colIndex}`;
                      const isSelected = selectedCells.has(cellId);
                      const isDisabled = disabledCells.has(cellId);
                      const isCopied = copiedCells.has(cellId);
                      const badges = cellBadges[cellId] || [];
                      const selectionStyles = getSelectionStyles(
                        rowIndex,
                        colIndex
                      );
                      const copyBorderInfo = getCopyBorderInfo(
                        rowIndex,
                        colIndex
                      );

                      return (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "cursor-pointer select-none p-1 border border-gray-200 relative",
                            isDisabled && "bg-gray-100"
                          )}
                          style={selectionStyles}
                          onMouseDown={(e) => {
                            // 우클릭이 아닐 때만 드래그 처리
                            if (e.button !== 2) {
                              handlers.cell.onMouseDown(
                                cellId,
                                rowIndex,
                                colIndex,
                                e
                              );
                            }
                          }}
                          onMouseEnter={(e) =>
                            handlers.cell.onMouseEnter(
                              cellId,
                              rowIndex,
                              colIndex,
                              e
                            )
                          }
                          onMouseUp={handlers.cell.onMouseUp}
                          onContextMenu={(e) => {
                            // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                            if (e.ctrlKey || e.metaKey) {
                              e.preventDefault();
                            } else {
                              handlers.cell.onRightClick(e, cellId);
                            }
                          }}
                        >
                          <div className="flex h-8 flex-col items-center justify-center space-y-1">
                            <div className="flex items-center space-x-1">
                              {/* 카테고리 뱃지들 - 뱃지가 없으면 자동으로 All 표시 */}
                              {badges.length > 0 ? (
                                badges.map((categoryBadge, badgeIndex) => {
                                  const badgeStyle =
                                    categoryBadge.style ||
                                    getBadgeColor(categoryBadge.colorIndex)
                                      .style;
                                  return (
                                    <span
                                      key={`${categoryBadge.category}-${badgeIndex}`}
                                      className={cn(
                                        "select-none rounded border px-1 text-[9px] font-medium leading-tight",
                                        isDisabled &&
                                          "line-through decoration-2"
                                      )}
                                      style={
                                        isDisabled
                                          ? {
                                              backgroundColor: "#d1d5db",
                                              color: "#4b5563",
                                              borderColor: "#9ca3af",
                                            }
                                          : badgeStyle
                                      }
                                      title={`${categoryBadge.category}: ${categoryBadge.options.join("|")}`}
                                    >
                                      {categoryBadge.options
                                        .map((option) => option.slice(0, 3))
                                        .join("|")}
                                    </span>
                                  );
                                })
                              ) : (
                                <span
                                  className={cn(
                                    isDisabled
                                      ? "bg-gray-300 text-gray-600 border-gray-400"
                                      : "bg-primary/10 text-primary border-primary/20",
                                    "select-none rounded border px-1 text-[9px] font-medium leading-tight",
                                    isDisabled && "line-through decoration-2"
                                  )}
                                  title="All"
                                >
                                  All
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Copy border overlay */}
                          {copyBorderInfo && (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                top: "2px",
                                left: "2px",
                                right: "2px",
                                bottom: "2px",
                                borderTop: copyBorderInfo.hasTop
                                  ? "2px dashed #8b5cf6"
                                  : "none",
                                borderBottom: copyBorderInfo.hasBottom
                                  ? "2px dashed #8b5cf6"
                                  : "none",
                                borderLeft: copyBorderInfo.hasLeft
                                  ? "2px dashed #8b5cf6"
                                  : "none",
                                borderRight: copyBorderInfo.hasRight
                                  ? "2px dashed #8b5cf6"
                                  : "none",
                                animation:
                                  "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

// React.memo displayName 설정
ExcelTable.displayName = "ExcelTable";

export default ExcelTable;
