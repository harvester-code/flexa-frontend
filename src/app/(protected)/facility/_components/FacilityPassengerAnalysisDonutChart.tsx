import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Circle } from 'lucide-react';
import { usePassengerAnalysesDonutChart } from '@/queries/facilityQueries';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const DonutChart = dynamic(() => import('@/components/charts/DonutChart'), { ssr: false });

interface FacilityPassengerAnalysisDonutChartProps {
  process?: string;
  scenarioId?: string;
}

// TODO: 색깔 설정하기
const DONUT_CHART_OPTIONS = [
  // 아래는 고정
  { label: 'Airline', value: 'airline', color: '' },
  { label: 'Destination', value: 'destination', color: '' },
  { label: 'Flight Number', value: 'flight_number', color: '' },
  // 아래는 동적
  // { label: 'checkin Counter', value: 'checkInCounter', color: '' },
];

const defaultData: any[] = [];

const columnHelper = createColumnHelper<any>();

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
  const [tableData, setTableData] = useState();

  const columns = useMemo(
    () => [
      columnHelper.group({
        id: 'top5',
        // HACK: activeCharts 수정하기
        header: () => <span className="capitalize">{DONUT_CHART_OPTIONS[activeCharts[0]].label}</span>,
        columns: [
          columnHelper.accessor('rank', {
            header: undefined,
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('text', {
            header: undefined,
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('count', {
            header: undefined,
            cell: (info) => info.getValue(),
          }),
        ],
      }),
    ],
    [activeCharts]
  );

  const table = useReactTable({
    columns,
    data: tableData ?? defaultData,
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
    setTableData(
      passengerAnalysisDonutChartData.table_result[key].map((d) => ({
        rank: d.rank,
        text: d.title,
        count: d.value,
      }))
    );
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
              className={cn(
                activeCharts.includes(idx)
                  ? 'bg-default-200 shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                  : ''
              )}
              variant="outline"
              key={idx}
              onClick={() => handleActiveCharts(idx)}
            >
              {activeCharts.includes(idx) && <Circle className="!size-2.5" fill="#111" stroke="transparent" />}
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
              legend: {
                xanchor: 'right',
                x: 1.1,
                y: 0.5,
              },
              font: { size: 14 },
            }}
          />

          <div className="w-full max-w-[540px] overflow-hidden rounded-md border border-default-300">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => {
                  if (headerGroup.depth > 0) return;
                  return (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          className="bg-default-100 px-6 py-2.5 text-start"
                          key={header.id}
                          colSpan={header.colSpan}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  );
                })}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {/* TODO: border bottom을 0으로 설정하기 */}
                    {row.getVisibleCells().map((cell) => (
                      <td
                        className="border border-default-200 px-6 py-4 first:border-l-0 last:border-r-0"
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
