import React from 'react';
import Image from 'next/image';
import Tooltip from '@mui/material/Tooltip';

// TODO: 색상 추가하기
// TODO: 타입 선언하기
function TheTable({ data }) {
  return (
    <div className="overflow-hidden overflow-x-auto whitespace-nowrap rounded-t-lg pb-6">
      <table className="w-max [&_td]:border-b [&_td]:border-r [&_td]:border-default-200 [&_th]:border-b [&_th]:border-r [&_th]:border-default-200">
        <thead className="bg-default-50 text-left leading-4">
          {/* --------------------------- */}
          <tr>
            {data?.header.columns &&
              data?.header.columns.map((col, idx) => (
                <th
                  className="w-[250px] px-5 py-3 [&:not(:last-child)]:h-20"
                  rowSpan={col.rowSpan}
                  colSpan={col.colSpan}
                  key={idx}
                >
                  {col.label}
                </th>
              ))}
          </tr>

          {/* --------------------------- */}
          {data?.header.subColumns && (
            <tr className="[&>*]:h-10 [&>*]:w-[172px] [&>*]:px-5 [&>*]:py-3">
              {data?.header.subColumns.map((subCol, idx) => <th key={idx}>{subCol.label}</th>)}
            </tr>
          )}
        </thead>

        <tbody className="[&>*>*]:px-6 [&>*>*]:py-4">
          {data?.body &&
            data?.body.map((row, i) => (
              <tr key={i}>
                {/* --------------------------- */}
                <td className="flex gap-1">
                  <span>{row.label}</span>

                  {/* --------------------------- */}
                  {row.tooltip && (
                    <button>
                      <Tooltip
                        title={
                          <React.Fragment>
                            <strong>{row.tooltip.title}</strong>
                            <br />
                            {row.tooltip.description}
                          </React.Fragment>
                        }
                        placement="right"
                        arrow
                      >
                        <Image src="/image/ico-help.svg" alt="tooltip" width={18} height={18} />
                      </Tooltip>
                    </button>
                  )}
                </td>

                {/* --------------------------- */}
                {row.values.map((val, j) => (
                  <td key={j}>
                    {val} {row.unit && <span className="capitalize">{row.unit}</span>}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default TheTable;
