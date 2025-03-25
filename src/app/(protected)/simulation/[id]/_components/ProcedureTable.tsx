'use client';

import React, { useEffect, useState } from 'react';
import Input from '@/components/Input';
import Checkbox from '@/components/Checkbox';

export interface ProcedureTableRow {
  name: string;
  values: string[];
}

interface ProcedureTableProps {
  className?: string;
  type?: 'text' | 'checkbox' | 'probability';
  title?: string;
  header: string[];
  data: ProcedureTableRow[];
  onDataChange: (data: ProcedureTableRow[]) => void;
}

export default function ProcedureTable({
  className,
  type = 'text',
  title,
  header,
  data,
  onDataChange,
}: ProcedureTableProps) {
  const isCheckedAll = (row: ProcedureTableRow) => {
    for(const value of row.values) if(Number(value) < 1) return false;
    return true;
  };
  const handleCheckAll = (row: ProcedureTableRow, rowIndex: number) => {
    const nextCheckedAll = !isCheckedAll(row);
    const divPer = Math.floor(10000 / header.length) / 100;
    let remainPer = 100;
    const newData = data.map((row, idx) => rowIndex == idx ? { ...row, values: Array(header.length).fill('0').map((val, cidx) => { if(cidx < header.length - 1) remainPer -= divPer; return !nextCheckedAll ? 0 : cidx == header.length - 1 ? String(remainPer) : String(divPer) })} : row) as ProcedureTableRow [];
    if(onDataChange) onDataChange(newData);
  };
  const handleChangeCheck = (rowIndex: number, colIndex: number) => {
    const newData = data.map((row, ridx) => rowIndex == ridx ? { ...row, values: [...row.values].map((val, cidx) => colIndex == cidx ? (Number(val) > 0 ? 0 : 10) : val) } : row) as ProcedureTableRow [];
    let checkedCount = 0;
    for(const val of newData[rowIndex].values) if(Number(val) > 0) checkedCount++;
    const divPer = Math.floor(10000 / checkedCount) / 100;
    let checkedIdx = 0;
    let remainPer = 100;
    for(let i = 0; i < newData[rowIndex].values.length; i++) {
      const val = newData[rowIndex].values[i];
      if(Number(val) > 0) {
        checkedIdx++;
        if(checkedIdx < checkedCount) remainPer -= divPer;
        newData[rowIndex].values[i] = checkedIdx == checkedCount ? String(remainPer) : String(divPer);
      }
    }
    if(onDataChange) onDataChange(newData);
  };
  const handleChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = data.map((row, ridx) =>
      rowIndex == ridx
        ? { ...row, values: [...row.values].map((val, cidx) => (colIndex == cidx ? (type == 'probability' ? Math.max(Number(value), 0).toString() : value) : val)) }
        : row
    ) as ProcedureTableRow[];
    if (onDataChange) onDataChange(newData);
  };
  return header?.length > 0 && data?.length > 0 ? (
    <table className={`table-secondary ${className || ''}`}>
      <thead>
        <tr>
          <th className="break-all px-[10px] text-center">{title}</th>
          {header.map((val, colIndex) => (
            <th key={colIndex} className="">
              {val}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="text-center">
            <td>
              {
                type == 'checkbox' ? (
                  <Checkbox
                    label={row.name}
                    id={`check-all-${rowIndex}`}
                    checked={isCheckedAll(row) || false}
                    onChange={() => handleCheckAll(row, rowIndex)}
                    className="checkbox text-sm"
                  />
                ) : (
                  <span>{row.name}</span>
                )
              }
            </td>
            {row.values.map((value, colIndex) => (
              <td key={`${rowIndex}-${colIndex}`}>
                <div className="flex items-center justify-center gap-[10px]">
                  {
                    type == 'checkbox' ? (
                      <Checkbox
                        label=""
                        id={`check-${rowIndex}-${colIndex}`}
                        checked={Number(value) > 0}
                        onChange={() => {
                          handleChangeCheck(rowIndex, colIndex);
                        }}
                        className="checkbox text-sm"
                      />  
                    ) : (
                      <Input
                        type={type == 'probability' ? 'number' : "text"}
                        placeholder=""
                        value={value}
                        className="!border-none bg-transparent !text-default-700 text-center"
                        onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                        // disabled={true}
                      />  
                    )
                  }
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ) : null;
}
