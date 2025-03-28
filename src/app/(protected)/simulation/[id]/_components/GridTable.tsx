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
}

interface GridTableProps {
  className?: string;
  type?: 'text' | 'checkbox' | 'number';
  title?: string;
  titleWidth?: number;
  header: GridTableHeader[];
  headerHeight?: number;
  data: GridTableRow[];
  errorMessage?: string;
  onDataChange: (data: GridTableRow[]) => void;
}

interface CellParams {
  rowIndex: number;
  colIndex: number;
  value?: string;
  checked?: boolean;
}

// 각 row 의 숫자 합이 compareNum 과 같은지 확인.
// 모든 row 들 중 하나라도 같지 않은 경우 false
// float 오차 때문에 같은지 비교할때. 오차가 0.000001 이하인지 확인하는걸로 구현
export function checkValidRows(data?: GridTableRow[], compareNum: number = 100) {
  if (!data) return false;
  for (const rowCur of data) {
    if (Math.abs(compareNum - rowCur.values.reduce((acc, current) => acc + Number(current), 0)) > 0.000001) {
      return false;
    }
  }
  return true;
}

export default function GridTable({
  className,
  type = 'text',
  title,
  titleWidth = 0,
  header,
  headerHeight = 40,
  data,
  errorMessage,
  onDataChange,
}: GridTableProps) {
  const refWidth = useRef(null);
  const selRange = useRef(Array(1).fill([])).current;
  const { width } = useResize(refWidth);
  const isCheckedAll = (row: GridTableRow) => {
    for (const value of row.values) if (Number(value) < 1) return false;
    return true;
  };
  const handleCheckAll = (rowIndex: number) => {
    const row = data[rowIndex];
    const nextCheckedAll = !isCheckedAll(row);
    const divPer = Math.floor(10000 / header.length) / 100;
    let remainPer = 100;
    const newData = data.map((row, idx) =>
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
    if (onDataChange) onDataChange(newData);
  };
  const handleChangeCheck = (changes: CellParams[]) => {
    const newData = [...data];
    for (const changeCur of changes) {
      newData[changeCur.rowIndex].values[changeCur.colIndex] = Math.max(
        Number(changeCur.value) > 0 ? 10 : 0,
        0
      ).toString();
      let checkedCount = 0;
      for (const val of newData[changeCur.rowIndex].values) if (Number(val) > 0) checkedCount++;
      const divPer = Math.floor(10000 / checkedCount) / 100;
      let checkedIdx = 0;
      let remainPer = 100;
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
      newData[changeCur.rowIndex].values[changeCur.colIndex] = Math.max(Number(changeCur.value), 0).toString();
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

  const headerIncludeTitle = [{ name: title || '', width: titleWidth }, ...header];

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
    return {
      rowId: `${index}`,
      height: row.height || 72,
      cells: [row.name, ...row.values].map((value, vidx) => {
        const cellType =
          vidx == 0 ? 'text' : type == 'number' ? 'number' : type == 'checkbox' ? 'checkbox' : 'text';
        const common = {
          type: cellType,
          nonEditable: vidx == 0 ? true : false,
          style: row.style,
        };
        if (vidx > 0) {
          common['style'] = { border: { left: { width: '0' }, right: { width: '0' } }, ...(row.style || {}) };
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
                      for (const colCur of selRangeCur.columns) colIdxs.push(Number(colCur.columnId) - 1);
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
                    colIndex: Number(cellCur.columnId) - 1,
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
                if (type == 'checkbox' && location.columnId == '0') {
                  handleCheckAll(Number(location.rowId));
                }
                return true;
              }}
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
