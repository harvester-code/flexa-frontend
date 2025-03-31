'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CellStyle, Column, NumberCell, Range, ReactGrid, Row, TextCell } from '@silevis/reactgrid';
import { useResize } from '@/hooks/useResize';
import './gridTable.css';

export interface GridTableHeader {
  name: string;
  width?: number;
  minWidth?: number;
  style?: CellStyle;
}

export interface GridTableRow {
  name: string;
  values: string[];
  style?: CellStyle;
  height?: number;
  checkToNumber?: number[];
  cellStyles?: { [index: string]: CellStyle };
}

interface GridTableProps {
  className?: string;
  type?: 'text' | 'checkbox' | 'number';
  title?: string;
  titleWidth?: number;
  header: GridTableHeader[];
  headerHeight?: number;
  normalizeRowSum?: number;
  visibleRowSum?: boolean;
  data: GridTableRow[];
  errorMessage?: string;
  onDataChange: (data: GridTableRow[]) => void;
  stickyLeftColumns?: number;
  stickyRightColumns?: number;
  stickyTopRows?: number;
  stickyBottomRows?: number;
}

interface CellParams {
  rowIndex: number;
  colIndex: number;
  value?: string;
  checked?: boolean;
}

// 각 row 의 숫자 합이 0인지 확인
// float 오차 때문에 같은지 비교할때. 오차가 0.000000001 이하인지 확인하는걸로 구현
export function checkNotEmptyRows(data?: GridTableRow[]) {
  if (!data) return false;
  for (const rowCur of data) {
    if (rowCur.values.reduce((acc, current) => acc + Number(current), 0) <= 0.000000001) {
      return false;
    }
  }
  return true;
}

export const normalizeRow = (data: GridTableRow[], rowIndex: number, normalizeRowSum: number = 100) => {
  if (!normalizeRowSum) return data;
  const row = data[rowIndex];
  const numIdxs: number[] = [];
  let sumRowData = 0;
  row.values.map((val, idx) => {
    const num = Number(val);
    if (num > 0) {
      sumRowData += num;
      numIdxs.push(idx);
    }
  });
  let remainPer = normalizeRowSum;
  const newData = data.map((row, ridx) => {
    return rowIndex == ridx
      ? {
          ...row,
          values: row.values.map((val, cidx) => {
            const num = Number(val);
            const cellVal =
              num == 0
                ? 0
                : numIdxs[numIdxs.length - 1] == cidx
                  ? remainPer
                  : Math.floor((normalizeRowSum * 100 * num) / sumRowData) / 100;
            remainPer -= cellVal;
            return cellVal;
          }),
        }
      : { ...row };
  }) as GridTableRow[];
  return newData;
};

export const normalizeRowsAll = (data: GridTableRow[], normalizeRowSum: number = 100) => {
  let newData = [...data];
  for (let i = 0; i < data.length; i++) {
    newData = normalizeRow(newData, i, normalizeRowSum);
  }
  return newData;
};

export default function GridTable({
  className,
  type = 'text',
  title,
  titleWidth = 0,
  header,
  headerHeight = 40,
  normalizeRowSum = 100,
  visibleRowSum = true,
  data,
  errorMessage,
  onDataChange,
  stickyLeftColumns,
  stickyRightColumns,
  stickyTopRows,
  stickyBottomRows,
}: GridTableProps) {
  const refWidth = useRef(null);
  const selRange = useRef(Array(1).fill([])).current;
  const { width } = useResize(refWidth);
  const sumColVisible = normalizeRowSum && visibleRowSum && type == 'number';
  const isCheckedAll = (row: GridTableRow) => {
    for (const value of row.values) if (Number(value) < 1) return false;
    return true;
  };
  const handleCheckAllCol = (colIndex: number) => {
    if (!normalizeRowSum) return;
    const changes: CellParams[] = [];
    const nextCheck = !(Number(data[0].values[colIndex < 0 ? 0 : colIndex]) > 0);
    const colIdxs = colIndex < 0 ? data[0].values.map((_, index) => index) : [colIndex];
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      for (const colIdxCur of colIdxs) {
        changes.push({
          colIndex: colIdxCur,
          rowIndex,
          value: String(nextCheck ? 10 : 0),
        });
      }
    }
    handleChangeCheck(changes);
  };
  const handleCheckAllRow = (rowIndex: number) => {
    if (!normalizeRowSum) return;
    const row = data[rowIndex];
    const nextCheckedAll = !isCheckedAll(row);
    const divPer = Math.floor((normalizeRowSum * 100) / header.length) / 100;
    let remainPer = normalizeRowSum;
    let newData = data.map((row, idx) =>
      rowIndex == idx
        ? {
            ...row,
            values: Array(header.length)
              .fill('0')
              .map((val, cidx) => {
                if (cidx < header.length - 1) remainPer -= divPer;
                return !nextCheckedAll
                  ? 0
                  : row.checkToNumber && row.checkToNumber.length >= header.length
                    ? String(row.checkToNumber[cidx])
                    : cidx == header.length - 1
                      ? String(remainPer)
                      : String(divPer);
              }),
          }
        : row
    ) as GridTableRow[];
    newData = normalizeRowsAll(newData, normalizeRowSum);
    if (onDataChange) onDataChange(newData);
  };
  const handleChangeCheck = (changes: CellParams[]) => {
    if (!normalizeRowSum) return;
    const newData = [...data];
    for (const changeCur of changes) {
      newData[changeCur.rowIndex].values[changeCur.colIndex] = Math.max(
        Number(changeCur.value) > 0 ? 10 : 0,
        0
      ).toString();
      let checkedCount = 0;
      for (const val of newData[changeCur.rowIndex].values) if (Number(val) > 0) checkedCount++;
      const divPer = Math.floor((normalizeRowSum * 100) / checkedCount) / 100;
      let checkedIdx = 0;
      let remainPer = normalizeRowSum;
      for (let i = 0; i < newData[changeCur.rowIndex].values.length; i++) {
        const val = newData[changeCur.rowIndex].values[i];
        if (Number(val) > 0) {
          checkedIdx++;
          if (checkedIdx < checkedCount) remainPer -= divPer;
          const row = newData[changeCur.rowIndex];
          newData[changeCur.rowIndex].values[i] =
            row.checkToNumber && row.checkToNumber.length >= header.length
              ? String(row.checkToNumber[i])
              : checkedIdx == checkedCount
                ? String(remainPer)
                : String(divPer);
        }
      }
    }
    if (onDataChange) onDataChange(newData);
  };
  const handleChangeNumber = (changes: CellParams[]) => {
    const newData = [...data];
    for (const changeCur of changes) {
      if (
        isNaN(changeCur.colIndex) ||
        changeCur.colIndex < 0 ||
        isNaN(changeCur.rowIndex) ||
        changeCur.rowIndex < 0
      )
        continue;
      newData[changeCur.rowIndex].values[changeCur.colIndex] = Math.max(Number(changeCur.value), 0).toString();
    }
    if (onDataChange) onDataChange(newData);
  };

  const handleChangeNumberRow = (rowIndex: number) => {
    if (!normalizeRowSum) return;
    const newData = normalizeRow(data, rowIndex, normalizeRowSum);
    if (onDataChange) onDataChange(newData);
  };
  const handleChangeNumberRowsAll = () => {
    if (!normalizeRowSum) return;
    let newData = [...data];
    for (let i = 0; i < data.length; i++) {
      newData = normalizeRow(newData, i, normalizeRowSum);
    }
    if (onDataChange) onDataChange(newData);
  };
  const handleChangeText = (changes: CellParams[]) => {
    const newData = [...data];
    for (const changeCur of changes) {
      newData[changeCur.rowIndex].values[changeCur.colIndex] = changeCur.value || '';
    }
    if (onDataChange) onDataChange(newData);
  };

  const headerIncludeTitle = [
    ...(sumColVisible
      ? [
          { name: title || '', width: titleWidth },
          { ...header[0], name: 'SUM' },
        ]
      : [{ name: title || '', width: titleWidth }]),
    ...header,
  ];

  let fixedWidthHeadsCount = 0;
  const fixedWidth = headerIncludeTitle.reduce((acc, current) => {
    const widthCur = Number(current.width || 0);
    if (widthCur > 0) fixedWidthHeadsCount++;
    return acc + widthCur;
  }, 0);

  const cellWidth = (width - fixedWidth - 4) / (headerIncludeTitle.length - fixedWidthHeadsCount);

  const columns: Column[] = headerIncludeTitle.map((header, index) => {
    return {
      columnId: `${index}`,
      width: Math.max(header.minWidth || 1, header.width && header.width > 0 ? header.width : cellWidth),
    };
  });
  const headerRow: Row = {
    rowId: 'header',
    height: headerHeight,
    cells: headerIncludeTitle.map((col, cidx) => {
      const style =
        cidx > 0
          ? {
              background: '#F9F9FB',
              border: { left: { width: '0' }, right: { width: '0' }, ...(col.style || {}) },
            }
          : {
              background: '#F9F9FB',
              ...(col.style || {}),
            };
      return {
        type: 'header',
        text: String(col.name),
        style,
      };
    }),
  };
  const dataRows = [...data]?.map((row, index) => {
    const sum = row?.values.reduce((acc, current) => acc + Number(current), 0);
    return {
      rowId: `${index}`,
      height: row.height || 72,
      cells: [...(sumColVisible ? [row.name, sum] : [row.name]), ...row.values].map((value, vidx) => {
        const cellId = `${String(index)},${String(vidx)}`;
        const cellStyle = row.cellStyles && cellId in row.cellStyles ? row.cellStyles[cellId] : {};
        const cellType =
          vidx == 0 ? 'header' : type == 'number' ? 'number' : type == 'checkbox' ? 'checkbox' : 'text';
        const common = {
          type: cellType,
          nonEditable: vidx == 0 || (sumColVisible && vidx == 1) ? true : false,
          style: { ...row.style, ...cellStyle },
        };
        if (vidx > 0) {
          common['style'] = {
            border: { left: { width: '0' }, right: { width: '0' } },
            ...(common.style || {}),
          };
        }
        if (vidx == 0) {
          common['style'] = {
            background: '#E9E9EB',
            ...(common.style || {}),
          };
        } else if (sumColVisible && vidx == 1) {
          common['style'] = {
            background: '#F2F2F2',
            ...(common.style || {}),
          };
        }
        if (
          (type == 'number' || type == 'checkbox') &&
          vidx > 0 &&
          normalizeRowSum &&
          Math.abs(normalizeRowSum - sum) > 0.00000001
        ) {
          common['style'].background = Math.abs(sum) < 0.00000001 ? '#FF7777' : '#FFD6D6';
        }
        return cellType == 'checkbox' || cellType == 'number'
          ? { ...common, value: Number(value), checked: Number(value) > 0 }
          : { ...common, text: String(value) };
      }),
    };
  }) as Row[];
  const rows = [headerRow, ...dataRows];

  useEffect(() => {
    const handleKeyEvent = (event) => {
      if (/ArrowLeft|ArrowRight|ArrowUp|ArrowDown/.test(event.key)) {
        selRange[0] = [];
      }
    };
    window.addEventListener('keyup', handleKeyEvent);
    return () => {
      window.removeEventListener('keyup', handleKeyEvent);
    };
  }, []);

  return header?.length > 0 && data?.length > 0 ? (
    <div ref={refWidth}>
      {width < 1 ? null : (
        <>
          <div
            className={`table-wrap mt-[10px] overflow-auto rounded-md border border-default-300 ${className || ''}`}
          >
            <ReactGrid
              rows={rows}
              columns={columns}
              enableRangeSelection={true}
              onCellsChanged={(cellChanges) => {
                for (const cellCur of cellChanges) {
                  const changes: CellParams[] = [];
                  const value =
                    type == 'checkbox' || type == 'number'
                      ? String((cellCur.newCell as NumberCell).value)
                      : (cellCur.newCell as TextCell).text;
                  if (selRange[0]?.length > 0) {
                    for (const rangeCur of selRange[0]) {
                      const colIdxs: number[] = [];
                      const rowIdxs: number[] = [];
                      const selRangeCur = rangeCur as Range;
                      for (const colCur of selRangeCur.columns)
                        colIdxs.push(sumColVisible ? Number(colCur.columnId) - 2 : Number(colCur.columnId) - 1);
                      for (const rowCur of selRangeCur.rows) rowIdxs.push(Number(rowCur.rowId));
                      for (const col of colIdxs) {
                        for (const row of rowIdxs) {
                          changes.push({
                            rowIndex: row,
                            colIndex: col,
                            value: isNaN(Number(value)) ? '' : value,
                          });
                        }
                      }
                    }
                  }
                  changes.push({
                    rowIndex: Number(cellCur.rowId),
                    colIndex: sumColVisible ? Number(cellCur.columnId) - 2 : Number(cellCur.columnId) - 1,
                    ...(type == 'checkbox' || type == 'number'
                      ? { value: isNaN(Number(value)) ? '' : value }
                      : { value }),
                  });
                  if (type == 'checkbox') {
                    handleChangeCheck(changes);
                  } else if (type == 'number') {
                    handleChangeNumber(changes);
                  } else {
                    handleChangeText(changes);
                  }
                }
              }}
              onSelectionChanging={(selectedRanges) => {
                selRange[0] = selectedRanges;
                return true;
              }}
              onFocusLocationChanging={(location) => {
                if (type == 'checkbox' && location.rowId == 'header') {
                  handleCheckAllCol(Number(location.columnId) - 1);
                } else if (type == 'checkbox' && location.columnId == '0') {
                  handleCheckAllRow(Number(location.rowId));
                } else if (type == 'number' && location.columnId == '0') {
                  if (location.rowId == 'header') {
                    handleChangeNumberRowsAll();
                  } else {
                    handleChangeNumberRow(Number(location.rowId));
                  }
                }
                return true;
              }}
              stickyLeftColumns={stickyLeftColumns}
              stickyRightColumns={stickyRightColumns}
              stickyTopRows={stickyTopRows}
              stickyBottomRows={stickyBottomRows}
            />
          </div>
          {!errorMessage ? null : (
            <div className="mt-[20px] flex items-center justify-between pr-[20px]">
              <p className="font-medium text-warning">{errorMessage}</p>
            </div>
          )}
        </>
      )}
    </div>
  ) : null;
}
