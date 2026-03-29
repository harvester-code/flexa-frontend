"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getBadgeColor } from "@/styles/colors";
import { THEME_COLORS } from "@/styles/theme-colors";
import { ExcelTableProps, CategoryBadge } from "./types";

const EMPTY_BADGES: CategoryBadge[] = [];
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

interface BorderInfo {
  hasTop: boolean;
  hasBottom: boolean;
  hasLeft: boolean;
  hasRight: boolean;
}

interface TableCellProps {
  cellId: string;
  rowIndex: number;
  colIndex: number;
  isSelected: boolean;
  isDisabled: boolean;
  badges: CategoryBadge[];
  effectiveProcessTime: number;
  showProcessBadge: boolean;
  isCustomProcessTime: boolean;
  currentProcessTime: number;
  copyBorderInfo: BorderInfo | null;
  selectionBorderInfo: BorderInfo | null;
  handlers: ExcelTableProps["handlers"];
}

function borderInfoEqual(a: BorderInfo | null, b: BorderInfo | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.hasTop === b.hasTop && a.hasBottom === b.hasBottom &&
         a.hasLeft === b.hasLeft && a.hasRight === b.hasRight;
}

function tableCellAreEqual(prev: TableCellProps, next: TableCellProps): boolean {
  if (
    prev.cellId !== next.cellId ||
    prev.isSelected !== next.isSelected ||
    prev.isDisabled !== next.isDisabled ||
    prev.effectiveProcessTime !== next.effectiveProcessTime ||
    prev.showProcessBadge !== next.showProcessBadge ||
    prev.isCustomProcessTime !== next.isCustomProcessTime ||
    prev.currentProcessTime !== next.currentProcessTime ||
    prev.badges !== next.badges ||
    prev.handlers !== next.handlers
  ) {
    return false;
  }
  if (!borderInfoEqual(prev.copyBorderInfo, next.copyBorderInfo)) return false;
  if (!borderInfoEqual(prev.selectionBorderInfo, next.selectionBorderInfo)) return false;
  return true;
}

const TableCell = React.memo<TableCellProps>(
  ({
    cellId,
    rowIndex,
    colIndex,
    isSelected,
    isDisabled,
    badges,
    effectiveProcessTime,
    showProcessBadge,
    isCustomProcessTime,
    currentProcessTime,
    copyBorderInfo,
    selectionBorderInfo,
    handlers,
  }) => {
    const processBadgeClass = isDisabled
      ? "bg-gray-200 text-gray-500 border-gray-400"
      : !isCustomProcessTime
        ? "bg-primary/15 text-primary border-primary/40"
        : effectiveProcessTime > currentProcessTime
          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
          : "bg-amber-100 text-amber-800 border-amber-300";

    return (
      <td
        data-row={rowIndex}
        data-col={colIndex}
        data-cell-id={cellId}
        className={cn(
          "cursor-pointer select-none p-1 border border-gray-200 relative",
          isDisabled && "bg-gray-100",
          isSelected && !isDisabled && "bg-schedule-selection"
        )}
        onMouseDown={(e) => {
          if (e.button !== 2) {
            handlers.cell.onMouseDown(cellId, rowIndex, colIndex, e);
          }
        }}
        onMouseEnter={(e) =>
          handlers.cell.onMouseEnter(cellId, rowIndex, colIndex, e)
        }
        onMouseUp={handlers.cell.onMouseUp}
        onContextMenu={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
          } else {
            handlers.cell.onRightClick(e, cellId);
          }
        }}
      >
        <div className="flex h-8 flex-col items-center justify-center space-y-0.5">
          <div className="flex items-center space-x-1">
            {badges.length > 0 ? (
              badges.map((categoryBadge, badgeIndex) => {
                const badgeStyle =
                  categoryBadge.style ||
                  getBadgeColor(categoryBadge.colorIndex).style;
                return (
                  <span
                    key={`${categoryBadge.category}-${badgeIndex}`}
                    className={cn(
                      "select-none rounded border px-1 text-[9px] font-medium leading-tight",
                      isDisabled && "line-through decoration-2"
                    )}
                    style={
                      isDisabled
                        ? {
                            backgroundColor: THEME_COLORS.disabledBg,
                            color: THEME_COLORS.disabledText,
                            borderColor: THEME_COLORS.disabledBorder,
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
          {showProcessBadge && (
            <div className="flex items-center">
              <span
                className={cn(
                  "select-none rounded border px-1 text-[8px] font-semibold leading-tight",
                  processBadgeClass
                )}
                title={`Process Time: ${effectiveProcessTime} seconds`}
              >
                {effectiveProcessTime}s
              </span>
            </div>
          )}
        </div>
        {selectionBorderInfo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderTop: selectionBorderInfo.hasTop
                ? "2px solid #7c3aed"
                : "none",
              borderBottom: selectionBorderInfo.hasBottom
                ? "2px solid #7c3aed"
                : "none",
              borderLeft: selectionBorderInfo.hasLeft
                ? "2px solid #7c3aed"
                : "none",
              borderRight: selectionBorderInfo.hasRight
                ? "2px solid #7c3aed"
                : "none",
            }}
          />
        )}
        {copyBorderInfo && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: "2px",
              left: "2px",
              right: "2px",
              bottom: "2px",
              borderTop: copyBorderInfo.hasTop
                ? `2px dashed ${THEME_COLORS.copyBorder}`
                : "none",
              borderBottom: copyBorderInfo.hasBottom
                ? `2px dashed ${THEME_COLORS.copyBorder}`
                : "none",
              borderLeft: copyBorderInfo.hasLeft
                ? `2px dashed ${THEME_COLORS.copyBorder}`
                : "none",
              borderRight: copyBorderInfo.hasRight
                ? `2px dashed ${THEME_COLORS.copyBorder}`
                : "none",
              animation:
                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        )}
      </td>
    );
  },
  tableCellAreEqual
);
TableCell.displayName = "TableCell";

const ExcelTable: React.FC<ExcelTableProps> = React.memo(
  ({
    selectedZone,
    currentFacilities,
    timeSlots,
    selectedCells,
    cellBadges,
    disabledCells,
    cellProcessTimes,
    copiedCells = EMPTY_SET,
    isFullScreen = false,
    virtualScroll,
    handlers,
    isPreviousDay = false,
    currentProcessTime,
    isDragging = false,
  }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const {
      visibleTimeSlots = timeSlots,
      startIndex = 0,
      totalHeight = 0,
      offsetY = 0,
      onScroll,
    } = virtualScroll;

    const midnightIndex = useMemo(
      () => timeSlots.indexOf("00:00"),
      [timeSlots]
    );

    const { selectedRows, selectedCols, selectionBounds } = useMemo(() => {
      const rows = new Set<number>();
      const cols = new Set<number>();

      if (selectedCells.size === 0) {
        return { selectedRows: rows, selectedCols: cols, selectionBounds: null };
      }

      let minRow = Infinity, maxRow = -Infinity;
      let minCol = Infinity, maxCol = -Infinity;

      selectedCells.forEach((id) => {
        const sep = id.indexOf("-");
        const r = parseInt(id.slice(0, sep), 10);
        const c = parseInt(id.slice(sep + 1), 10);
        rows.add(r);
        cols.add(c);
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      });

      return {
        selectedRows: rows,
        selectedCols: cols,
        selectionBounds: { minRow, maxRow, minCol, maxCol },
      };
    }, [selectedCells]);

    // 드래그 중 테이블 가장자리 근처에서 자동 스크롤
    const mousePosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
      if (!isDragging) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const handleMouseMove = (e: MouseEvent) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      };
      document.addEventListener("mousemove", handleMouseMove, {
        passive: true,
      });

      const EDGE_THRESHOLD = 50;
      const MAX_SPEED = 18;

      let rafId: number;
      const scrollLoop = () => {
        const rect = container.getBoundingClientRect();
        const { x, y } = mousePosRef.current;

        const distFromBottom = rect.bottom - y;
        const distFromTop = y - rect.top;
        const distFromRight = rect.right - x;
        const distFromLeft = x - rect.left;

        if (distFromBottom > 0 && distFromBottom < EDGE_THRESHOLD) {
          container.scrollTop +=
            MAX_SPEED * (1 - distFromBottom / EDGE_THRESHOLD);
        } else if (distFromTop > 0 && distFromTop < EDGE_THRESHOLD) {
          container.scrollTop -=
            MAX_SPEED * (1 - distFromTop / EDGE_THRESHOLD);
        }

        if (distFromRight > 0 && distFromRight < EDGE_THRESHOLD) {
          container.scrollLeft +=
            MAX_SPEED * (1 - distFromRight / EDGE_THRESHOLD);
        } else if (distFromLeft > 0 && distFromLeft < EDGE_THRESHOLD) {
          container.scrollLeft -=
            MAX_SPEED * (1 - distFromLeft / EDGE_THRESHOLD);
        }

        rafId = requestAnimationFrame(scrollLoop);
      };
      rafId = requestAnimationFrame(scrollLoop);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        cancelAnimationFrame(rafId);
      };
    }, [isDragging]);

    const copyBounds = useMemo(() => {
      if (copiedCells.size === 0) return null;
      let minRow = Infinity, maxRow = -Infinity;
      let minCol = Infinity, maxCol = -Infinity;
      copiedCells.forEach((id) => {
        const sep = (id as string).indexOf("-");
        const r = parseInt((id as string).slice(0, sep), 10);
        const c = parseInt((id as string).slice(sep + 1), 10);
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      });
      return { minRow, maxRow, minCol, maxCol };
    }, [copiedCells]);

    const getSelectionBorderInfo = (cellId: string, rowIndex: number, colIndex: number): BorderInfo | null => {
      if (!selectionBounds || !selectedCells.has(cellId)) return null;
      const hasTop = rowIndex === selectionBounds.minRow;
      const hasBottom = rowIndex === selectionBounds.maxRow;
      const hasLeft = colIndex === selectionBounds.minCol;
      const hasRight = colIndex === selectionBounds.maxCol;
      if (!hasTop && !hasBottom && !hasLeft && !hasRight) return null;
      return { hasTop, hasBottom, hasLeft, hasRight };
    };

    const getCopyBorderInfo = (cellId: string, rowIndex: number, colIndex: number): BorderInfo | null => {
      if (!copyBounds || !copiedCells.has(cellId)) return null;
      const hasTop = rowIndex === copyBounds.minRow;
      const hasBottom = rowIndex === copyBounds.maxRow;
      const hasLeft = colIndex === copyBounds.minCol;
      const hasRight = colIndex === copyBounds.maxCol;
      if (!hasTop && !hasBottom && !hasLeft && !hasRight) return null;
      return { hasTop, hasBottom, hasLeft, hasRight };
    };

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
        ref={scrollContainerRef}
        className={`rounded-lg border overflow-auto`}
        onScroll={onScroll}
        style={
          isFullScreen
            ? { height: "100%", minHeight: "100%" }
            : { height: 500, maxHeight: "70vh" }
        }
      >
        <div className="relative" style={{ height: "auto" }}>
          <table className="w-full table-auto text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 bg-muted z-50">
              <tr className="bg-muted">
                <th
                  className="w-20 cursor-pointer select-none border border-gray-200 p-2 text-center transition-colors hover:bg-primary/10 overflow-hidden bg-purple-50 whitespace-nowrap text-ellipsis sticky top-0 left-0 z-[60] font-semibold"
                  onClick={handlers.timeHeader.onClick}
                  onContextMenu={(e) => {
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
                      selectedCols.has(colIndex)
                        ? "bg-purple-200"
                        : "bg-muted"
                    }`}
                    onMouseDown={(e) => {
                      if (e.button !== 2) {
                        handlers.column.onMouseDown(colIndex, e);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (e.buttons !== 2) {
                        handlers.column.onMouseEnter(colIndex, e);
                      }
                    }}
                    onMouseUp={(e) => {
                      if (e.button !== 2) {
                        handlers.column.onMouseUp();
                      }
                    }}
                    onContextMenu={(e) => {
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
                      className={`w-20 cursor-pointer select-none border border-gray-200 p-1 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-purple-100 overflow-hidden whitespace-nowrap text-ellipsis sticky left-0 z-10 ${
                        selectedRows.has(rowIndex)
                          ? "bg-purple-200"
                          : "bg-purple-50"
                      }`}
                      onMouseDown={(e) => {
                        if (e.button !== 2) {
                          handlers.row.onMouseDown(rowIndex, e);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (e.buttons !== 2) {
                          handlers.row.onMouseEnter(rowIndex, e);
                        }
                      }}
                      onMouseUp={(e) => {
                        if (e.button !== 2) {
                          handlers.row.onMouseUp();
                        }
                      }}
                      onContextMenu={(e) => {
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
                          rowIndex < midnightIndex && (
                            <span className="px-1 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-800 rounded">
                              D-1
                            </span>
                          )}
                        <span>{timeSlot}</span>
                      </div>
                    </td>
                    {currentFacilities.map((facility, colIndex) => {
                      const cellId = `${rowIndex}-${colIndex}`;
                      const cellProcessTime = cellProcessTimes[cellId];
                      const effectiveProcessTime =
                        typeof cellProcessTime === "number"
                          ? cellProcessTime
                          : currentProcessTime;

                      return (
                        <TableCell
                          key={`${rowIndex}-${colIndex}`}
                          cellId={cellId}
                          rowIndex={rowIndex}
                          colIndex={colIndex}
                          isSelected={selectedCells.has(cellId)}
                          isDisabled={disabledCells.has(cellId)}
                          badges={cellBadges[cellId] || EMPTY_BADGES}
                          effectiveProcessTime={effectiveProcessTime}
                          showProcessBadge={
                            typeof effectiveProcessTime === "number" &&
                            effectiveProcessTime > 0
                          }
                          isCustomProcessTime={
                            typeof cellProcessTime === "number" &&
                            cellProcessTime !== currentProcessTime
                          }
                          currentProcessTime={currentProcessTime}
                          copyBorderInfo={getCopyBorderInfo(
                            cellId,
                            rowIndex,
                            colIndex
                          )}
                          selectionBorderInfo={getSelectionBorderInfo(
                            cellId,
                            rowIndex,
                            colIndex
                          )}
                          handlers={handlers}
                        />
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

ExcelTable.displayName = "ExcelTable";

export default ExcelTable;
