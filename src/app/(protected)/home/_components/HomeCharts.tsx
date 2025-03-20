import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { SANKEY_NODE_COLORS } from '@/constants';
import type Plotly from 'plotly.js-dist-min';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import SelectBox from '@/components/SelectBox';
// TODO: CSS 모듈화하기
import './HomeCharts.css';

const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

function HomeCharts() {
  const [chartType, setChartType] = useState(true);

  // FIXME: 라인차트에 날짜 데이터가 없는 상태.
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [histogramChartData, setHistogramChartData] = useState<
    { label: string; value: number; color: string }[]
  >([]);
  const [sankeyChartData, setSankeyChartData] = useState<Plotly.Data[]>([]);

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
    const fetchHistogramChartData = async () => {
      const data = [
        { label: '00:00 - 15:00', value: 14, color: '#4400d9' },
        { label: '15:00 - 30:00', value: 27, color: '#622bd9' },
        { label: '30:00 - 45:00', value: 24, color: '#7f56d9' },
        { label: '45:00 - 60:00', value: 19, color: '#9d82d9' },
        { label: '60:00 -', value: 16, color: '#bbaed9' },
      ];

      setHistogramChartData(data);
    };

    fetchHistogramChartData();
  }, []);

  // ================================================================================
  // TODO: 실제 API로 교체하기
  useEffect(() => {
    const fetchSankeyChartData = async () => {
      try {
        const res = await fetch('/samples/data/passenger_flow_sankey_chart_data.json');
        // FIXME: 오타 발생
        const { sanky } = await res.json();

        const data: Plotly.Data[] = [
          {
            type: 'sankey',
            orientation: 'h',
            node: {
              pad: 15,
              thickness: 20,
              // line: {
              //   color: 'black',
              //   width: 0.5,
              // },
              label: sanky.label,
              color: SANKEY_NODE_COLORS,
            },
            link: sanky.link,
          },
        ];

        setSankeyChartData(data);
      } catch (error) {
        console.error((error as Error).message);
      }
    };

    fetchSankeyChartData();
  }, []);

  return (
    <div className="charts">
      {/* Line Chart */}
      <div className="chart-item">
        <div className="chart-item-head">
          <h5>Flow Chart</h5>
          <div>
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
        </div>

        <div className="chart-item-body">
          <div className="chart-block">
            <div className="flex items-center justify-between">
              <SelectBox
                className="!min-w-60"
                options={[
                  'All Facilities',
                  'Check-in',
                  'Boarding Pass Control',
                  'Security Control',
                  'Passport Control',
                ]}
              />

              <div className="tab-btn flex items-center">
                <Button
                  className="btn-md btn-default active"
                  icon={<Image src="/image/ico-dot-violet.svg" alt="" width={10} height={10} />}
                  text="Throughput"
                  onClick={() => {}}
                />
                <Button
                  className="btn-md btn-default active"
                  icon={<Image src="/image/ico-dot-orange.svg" alt="" width={10} height={10} />}
                  text="Waiting Time"
                  onClick={() => {}}
                />
                <Button
                  className="btn-md btn-default"
                  icon={<Image src="/image/ico-dot-green.svg" alt="" width={10} height={10} />}
                  text="Queue Length"
                  onClick={() => {}}
                />
                <Button
                  className="btn-md btn-default"
                  icon={<Image src="/image/ico-dot-green.svg" alt="" width={10} height={10} />}
                  text="Facility Efficiency"
                  onClick={() => {}}
                />
              </div>
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
        </div>
      </div>

      {/* Histogram Chart */}
      <div className="chart-item">
        <div className="chart-item-head">
          <h5>Histogram</h5>
        </div>
        <div className="chart-item-body">
          <div className="chart-block">
            <div className="flex items-center justify-between">
              <SelectBox
                className="!min-w-60"
                options={[
                  'All Facilities',
                  'Check-in',
                  'Boarding Pass Control',
                  'Security Control',
                  'Passport Control',
                ]}
              />

              <div className="tab-btn flex items-center">
                <Button
                  className="btn-md btn-default active"
                  icon={<Image src="/image/ico-dot-orange.svg" alt="" width={10} height={10} />}
                  text="Waiting Time"
                  onClick={() => {}}
                />
                <Button
                  className="btn-md btn-default"
                  icon={<Image src="/image/ico-dot-green.svg" alt="" width={10} height={10} />}
                  text="Queue Length"
                  onClick={() => {}}
                />
                <Button
                  className="btn-md btn-default"
                  icon={<Image src="/image/ico-dot-green.svg" alt="" width={10} height={10} />}
                  text="Facility Efficiency"
                  onClick={() => {}}
                />
              </div>
            </div>
            <div className="mt-10 rounded-md bg-white">
              <div className="flex text-center">
                {histogramChartData &&
                  histogramChartData.map((d, idx) => (
                    <div style={{ width: `${d.value}%` }} key={idx}>
                      <div
                        className={`py-3.5 ${idx === 0 ? 'rounded-l-lg' : idx === histogramChartData.length - 1 ? 'rounded-r-lg' : ''}`}
                        style={{ background: `${d.color}` }}
                      >
                        <p className="text-3xl font-bold text-white">{d.value}%</p>
                      </div>
                      <p className="mt-1 text-sm font-medium">{d.label}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sankey Chart */}
      <div className="chart-item">
        <div className="chart-item-head">
          <h5>Sankey Chart</h5>
          <p className="text-sm font-medium">Total Passengers Processed: 1,568 pax</p>
        </div>

        <div className="chart-item-body">
          <div className="chart-block">
            <div className="mb-6 grid grid-cols-5 gap-14">
              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Check-In</p>
                <p className="text-sm font-medium text-default-600">By Check-In Counter</p>
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Boarding pass</p>
                <div className="w-full">
                  <SelectBox
                    className="select-sm"
                    options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Security Check</p>
                <div className="w-full">
                  <SelectBox
                    className="select-sm"
                    options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Passport</p>
                <div className="w-full">
                  <SelectBox
                    className="select-sm"
                    options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="mb-2 font-semibold text-default-900">Boarding</p>
                <p className="text-sm font-medium text-default-600">Eastern, Western</p>
              </div>
            </div>

            <SankeyChart
              chartData={sankeyChartData}
              chartLayout={{
                margin: { l: 80, r: 80, b: 24, t: 24 },
                font: { size: 20 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeCharts;
