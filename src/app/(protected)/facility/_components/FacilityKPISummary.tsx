import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Menu, MenuItem } from '@mui/material';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import SelectBox from '@/components/SelectBox';
import AppTable from '@/components/Table';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const HeatMapChart = dynamic(() => import('@/components/charts/HeatMapChart'), { ssr: false });

function FacilityKPISummary() {
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [heatMapChartData, setHeatMapChartData] = useState<Plotly.Data[]>([]);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [chartType, setChartType] = useState(false);

  // ================================================================================
  // TODO: 실제 API로 교체하기
  useEffect(() => {
    const fetchLineChartData = async () => {
      try {
        const res = await fetch('/samples/data/line_chart_data.json');
        const data = await res.json();

        const [throughput, waitingTime] = data.line_chart_data;

        const trace1: Plotly.Data = {
          ...throughput,
          name: 'Throughtput',
          line: { color: '#53389e' },
        };
        const trace2: Plotly.Data = {
          ...waitingTime,
          name: 'Waiting time',
          yaxis: 'y2',
          // TODO: HEX CODE 확인해보기
          line: { color: 'orange' },
        };

        setLineChartData([trace1, trace2]);
      } catch (error) {
        console.error((error as Error).message);
      }
    };

    fetchLineChartData();
  }, []);

  // ================================================================================
  // TODO: 실제 API로 교체하기
  useEffect(() => {
    const fetchHeatMapChartData = async () => {
      try {
        const res = await fetch('/samples/data/heatmap_data.json');
        const { heatmap_data_1, heatmap_data_2 } = await res.json();

        const data = [
          {
            type: 'heatmap',
            xgap: 16,
            ygap: 16,
            colorscale: [
              [0.0, '#f9f5ff'],
              [0.1, '#f4ebff'],
              [0.2, '#e9d7fe'],
              [0.3, '#d6bbfb'],
              [0.4, '#b692f6'],
              [0.5, '#9e77ed'],
              [0.6, '#7f56d9'],
              [0.7, '#6941c6'],
              [0.8, '#53389e'],
              [1.0, '#42307d'],
            ],
            showscale: false,
            ...heatmap_data_1,
          },
        ];

        setHeatMapChartData(data);
      } catch (error) {
        console.error((error as Error).message);
      }
    };

    fetchHeatMapChartData();
  }, []);

  const tableData = {
    header: {
      columns: [
        { label: 'KPI', rowSpan: 2, colSpan: null },
        { label: 'All', rowSpan: 2, colSpan: null },
        { label: 'Check-in', rowSpan: null, colSpan: 9 },
      ],
      subColumns: [
        { label: 'Counter A' },
        { label: 'Counter B' },
        { label: 'Counter C' },
        { label: 'Counter D' },
        { label: 'Counter E' },
        { label: 'Counter F' },
        { label: 'Counter G' },
        { label: 'Counter H' },
        { label: 'Counter I' },
      ],
    },
    body: [
      {
        label: 'Throughput',
        tooltip: {
          title: 'Tool-tip Title',
          description:
            'The average or top n% of the total queue count experienced by one passenger across all processes.',
        },
        unit: 'pax',
        values: ['2167', '361', '361', '361', '361', '361', '361', '361', '361', '361'],
      },
      {
        label: 'Asiana Airlines',
        unit: 'pax',
        values: ['135', '22', '22', '22', '22', '22', '22', '22', '22', '22'],
      },
      {
        label: 'Waiting Time',
        unit: null,
        values: ['12:21', '12:21', '12:21', '12:21', '12:21', '12:21', '12:21', '12:21', '12:21', '12:21'],
      },
      {
        label: 'Facility Efficiency',
        unit: 'sec',
        values: ['135', '180', '180', '180', '180', '180', '180', '180', '180', '180'],
      },
    ],
  };

  return (
    <>
      <div className="my-[30px] flex justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Passenger waiting status by KPI</dt>
          <dd className="text-sm">
            Analyze the performance of the selected Check-In facility by KPI. You can check individual counters,
            desk, machine through the filter at the top right.
          </dd>
        </dl>

        <div className="flex items-center gap-2.5">
          <SelectBox options={['Average', 'Maximum', 'Top 5%', 'Total', 'Median', 'Bottom 5%', 'Minimum']} />
          <button className="btn-more" onClick={handleClick}>
            <Image src="/image/ico-dot-menu.svg" alt="more" width={20} height={20} />
          </button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              className: 'sub-menu !w-250',
            }}
          >
            <h4 className="text-40 border-b border-default-200 pl-5 !font-semibold">Other Fuction</h4>
            <MenuItem>
              <Image src="/image/ico-download.svg" alt="" width={20} height={20} /> Download data to local PC
            </MenuItem>
            <MenuItem>
              <Image src="/image/ico-open-new.svg" alt="" width={20} height={20} /> Open in a new window
            </MenuItem>
          </Menu>
        </div>
      </div>

      <AppTable data={tableData} />

      {/* ==================================================================================================== */}

      <div className="mt-10 flex items-center justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Number of people excluded from analysis</dt>
          <dd className="text-sm">
            Number of passengers who used mobile Check-In and did not use Baggage Check-In service at the
            airport during the analysis period.
          </dd>
        </dl>
        <div>
          <p className="text-xl font-semibold text-default-900">0 Pax (0% of the total)</p>
        </div>
      </div>

      {/* ==================================================================================================== */}

      <div className="mt-10 flex justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Passenger Processing Analysis Chart</dt>
          <dd className="text-sm">
            Analyze the sum of the performances of the selected Check-In facilities for each indicator. You can
            select up to two indicators.
          </dd>
        </dl>
      </div>

      <div className="mb-4 mt-8 flex items-center justify-end gap-1 text-sm">
        <span>Bar Chart</span>
        <Checkbox
          id="chart-type"
          label=""
          checked={chartType}
          onChange={() => setChartType(!chartType)}
          className="checkbox-toggle"
        />
        <span>Line Chart</span>
      </div>

      <div className="rounded-md border border-default-200 p-5">
        {/* TODO: tab-btn 없애기 */}
        <div className="tab-btn flex items-center justify-end">
          <Button
            className="btn-md btn-default active"
            icon={<Image src="/image/ico-dot-accent.svg" alt="" width={20} height={20} />}
            text="Queue Length"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-default active"
            icon={<Image src="/image/ico-dot-orange.svg" alt="" width={20} height={20} />}
            text="Waiting Time"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-dot-green.svg" alt="" width={20} height={20} />}
            text="Throughput"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-dot-green.svg" alt="" width={20} height={20} />}
            text="Facility Efficiency"
            onClick={() => {}}
          />
        </div>

        <div className="rounded-md bg-white">
          <LineChart
            chartData={lineChartData}
            chartLayout={{
              xaxis: { showgrid: false },
              yaxis: {
                title: {
                  text: 'Throughtput (number of people)',
                },
              },
              yaxis2: {
                title: {
                  text: 'Waiting time',
                },
                overlaying: 'y',
                side: 'right',
                showgrid: false,
              },
              margin: { l: 60, r: 60, b: 24, t: 24 },
              showlegend: false,
            }}
          />
        </div>
      </div>

      <div className="my-10 flex justify-between">
        <dl>
          <dt className="text-xl font-semibold leading-8">Passenger Processing Heat Map</dt>
          <dd className="text-sm">
            Visualize and display the performance of the selected Check-In facility. Color density makes it easy
            to see changes in data values and relative differences.
          </dd>
        </dl>
      </div>

      <div className="rounded-md border border-default-200 p-5">
        <div className="tab-btn flex items-center justify-end">
          <Button
            className="btn-md btn-default active"
            icon={<Image src="/image/ico-dot-accent.svg" alt="" width={20} height={20} />}
            text="Queue Length"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-dot-orange.svg" alt="" width={20} height={20} />}
            text="Waiting Time"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-dot-green.svg" alt="" width={20} height={20} />}
            text="Throughput"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-dot-green.svg" alt="" width={20} height={20} />}
            text="Facility Efficiency"
            onClick={() => {}}
          />
        </div>

        <div className="rounded-md bg-white">
          <HeatMapChart
            chartData={heatMapChartData}
            chartLayout={{
              xaxis: { showgrid: false },
              yaxis: { showgrid: false },
              margin: { l: 80, r: 8, b: 24, t: 24 },
            }}
          />
        </div>
      </div>
    </>
  );
}

export default FacilityKPISummary;
