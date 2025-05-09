import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RowData, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { capitalCase } from 'change-case';
import { usePassengerAnalysesDonutChart } from '@/queries/facilityQueries';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const DonutChart = dynamic(() => import('@/components/charts/DonutChart'), { ssr: false });

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

interface FacilityPassengerAnalysisDonutChartProps {
  process?: string;
  scenarioId?: string;
}

interface Rank {
  rank: number;
  text: string;
  passengers: number;
}

const DONUT_CHART_OPTIONS = [
  { label: 'Airline', value: 'airline' },
  { label: 'Destination', value: 'destination' },
  { label: 'Flight Number', value: 'flight_number' },
];

const defaultData: Rank[] = [];
const columnHelper = createColumnHelper<Rank>();

function FacilityPassengerAnalysisDonutChart({
  process,
  scenarioId,
}: FacilityPassengerAnalysisDonutChartProps) {
  const { data: passengerAnalysisDonutChartData } = usePassengerAnalysesDonutChart({ scenarioId, process });

  const [activeCharts, setActiveCharts] = useState<number[]>([0]);
  const handleActiveCharts = (buttonIndex: number) => {
    setActiveCharts((prevData) => {
      if (prevData.includes(buttonIndex)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== buttonIndex);
      } else {
        if (prevData.length >= 1) {
          return [...prevData.slice(1), buttonIndex];
        }
        return [...prevData, buttonIndex];
      }
    });
  };

  const [totalQueueLength, setTotalQueueLength] = useState();
  const [chartData, setChartData] = useState<Plotly.Data[]>([]);

  const [tableData, setTableData] = useState([...defaultData]);

  const columns = [
    columnHelper.accessor('rank', {
      header: () => <span>Rank</span>,
      cell: (info) => info.getValue(),
      meta: { className: 'w-[20%] text-center' },
    }),
    columnHelper.accessor('text', {
      header: () => <span>{capitalCase(DONUT_CHART_OPTIONS[activeCharts[0]].value)}</span>,
      cell: (info) => info.getValue(),
      meta: { className: 'w-[40%] text-center' },
    }),
    columnHelper.accessor('passengers', {
      header: () => <span>Passengers</span>,
      cell: (info) => info.getValue(),
      meta: { className: 'w-[40%] text-center' },
    }),
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (!passengerAnalysisDonutChartData) return;

    const key = DONUT_CHART_OPTIONS[activeCharts[0]].value;

    setTotalQueueLength(passengerAnalysisDonutChartData.total_queue_length[key]);

    setChartData([
      {
        type: 'pie',
        textinfo: 'none',
        marker: { colors: PRIMARY_COLOR_SCALES.slice(0, 6) },
        direction: 'clockwise',
        hole: 0.5,
        labels: passengerAnalysisDonutChartData.pie_result[key].labels,
        values: passengerAnalysisDonutChartData.pie_result[key].values,
      },
    ]);

    // FIXME: 백엔드에서 데이터 구조가 변경되어야함.
    setTableData([
      { rank: 1, text: 'ABC Airline', passengers: 999 },
      { rank: 2, text: 'ABC Airline', passengers: 999 },
      { rank: 3, text: 'ABC Airline', passengers: 999 },
      { rank: 4, text: 'ABC Airline', passengers: 999 },
      { rank: 5, text: 'ABC Airline', passengers: 999 },
      { rank: 6, text: 'ABC Airline', passengers: 999 },
    ]);
  }, [activeCharts, passengerAnalysisDonutChartData]);

  return (
    <>
      <div className="mt-8 flex justify-between">
        <dl className="flex flex-col gap-2.5">
          <dt className="text-xl font-semibold leading-none text-default-800">
            Passenger Processing Analysis Chart
          </dt>
          <dd className="font-medium leading-none text-default-600">
            Analyze the sum of the performances of the selected Check-In facilities for each indicator. You can
            select up to two indicators.
          </dd>
        </dl>
      </div>

      <div className="mt-10 rounded-md border border-default-200 p-5">
        <ButtonGroup>
          {DONUT_CHART_OPTIONS.map((opt, idx) => (
            <Button
              key={idx}
              className={cn(
                activeCharts.includes(idx)
                  ? 'bg-default-200 shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                  : ''
              )}
              variant="outline"
              onClick={() => handleActiveCharts(idx)}
            >
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>

        <div className="my-10 text-xl font-semibold text-default-900">
          Total Queue Pax: {totalQueueLength} Pax
        </div>

        <div className="grid grid-cols-2 items-start gap-x-20 overflow-hidden">
          <DonutChart
            chartData={chartData}
            chartLayout={{
              margin: { l: 0, r: 0, b: 0, t: 0 },
              height: 320,
              legend: { xanchor: 'right', x: 1.1, y: 0.5 },
              font: { size: 14 },
            }}
          />

          <div className="w-full max-w-[540px] overflow-hidden rounded-md border border-default-300">
            <table className="w-full table-fixed">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(header.column.columnDef.meta?.className, 'bg-default-100 py-3')}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          'border-x border-t border-default-200 px-6 py-4 first:border-l-0 last:border-r-0'
                        )}
                        key={cell.id}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default FacilityPassengerAnalysisDonutChart;
