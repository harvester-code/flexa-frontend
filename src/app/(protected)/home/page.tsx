'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { SANKEY_NODE_COLORS } from '@/constants';
import { faAngleUp, faArrowRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Slider, Typography } from '@mui/material';
import type Plotly from 'plotly.js-dist-min';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

const HorizontalBarChart = dynamic(() => import('@/components/charts/HorizontalBarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [range1, setRange1] = useState<number>(4);
  const [range2, setRange2] = useState<number[]>([4, 20]);
  const [topValue, setTopValue] = useState('');
  const [isSlideActive, setIsSlideActive] = useState<boolean[]>([true, true, true, true]);
  const [chartType, setChartType] = useState(true);

  // FIXME: 라인차트에 날짜 데이터가 없는 상태.
  const [lineChartData, setLineChartData] = useState<Plotly.Data[]>([]);
  const [histogramChartData, setHistogramChartData] = useState<Plotly.Data[]>([]);
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
      const data: Plotly.Data[] = [
        {
          x: [20],
          y: ['monkeys'],
          name: 'SF Zoo',
          orientation: 'h',
          marker: {
            color: 'rgba(55,128,191,0.6)',
            width: 1,
          },
          type: 'bar',
        },
        {
          x: [12],
          y: ['monkeys'],
          name: 'LA Zoo',
          orientation: 'h',
          type: 'bar',
          marker: {
            color: 'rgba(255,153,51,0.6)',
            width: 1,
          },
        },
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

  // ================================================================================
  const handleTabClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleRangeChange = (event: Event, newValue: number | number[]) => {
    setRange2(newValue as number[]);
  };

  const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const toggleSlide = (index: number) => {
    setIsSlideActive((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  return (
    <>
      <ContentsHeader text="Home" />

      {/* FIXME: 동적으로 변경되어 수정 필요 */}
      <div className="selected-block">
        <dl>
          <dt>Selected</dt>
          <dd>
            <ul>
              <li>
                <button>Type &gt; Actual</button>
              </li>
              <li>
                <button>Date &gt; Oct 14, 2024 - Oct 15, 2024</button>
              </li>
              <li>
                <button>Terminal &gt; T1</button>
              </li>
              <li>
                <button>Type &gt; Actual</button>
              </li>
              <li>
                <button>Date &gt; Oct 14, 2024 - Oct 15, 2024</button>
              </li>
              <li>
                <button>Terminal &gt; T1</button>
              </li>
            </ul>
          </dd>
        </dl>
        <div className="flex items-center gap-10">
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-filter.svg" alt="filter" width={24} height={24} />}
            text="Fliter Details"
            onClick={() => {}}
          />
          <Button className="btn-md btn-primary" text="See Results" onClick={() => {}} />
        </div>
      </div>

      {/* ==================================================================================================== */}

      <div className="mt-30 flex items-center justify-between">
        <h2 className="title-sm">Terminal Overview</h2>
        <div className="main-tab flex items-center gap-10">
          <button className={activeIndex === 0 ? 'active' : ''} onClick={() => handleTabClick(0)}>
            Time Stamp
          </button>
          <button className={activeIndex === 1 ? 'active' : ''} onClick={() => handleTabClick(1)}>
            Time Span
          </button>
        </div>
      </div>

      {/* ==================================================================================================== */}

      <div className="overview-container mt-20">
        <div className={`overview-block ${activeIndex === 0 ? '' : 'hide'}`}>
          <div className="map-block">
            <Image src="/image/thumb/@img-main-02.png" alt="map" width={1280} height={600} />
            <div className="map-zoom">
              <button className="btn-zoom-in">
                <FontAwesomeIcon className="nav-icon" icon={faPlus} />
              </button>
              <button className="btn-zoom-out">
                <FontAwesomeIcon className="nav-icon" icon={faMinus} />
              </button>
            </div>
            <div className="map-menu">
              <p className="map-head">Pax ID 5132438</p>
              <div className="scroll-list">
                <div className="map-menu-item">
                  <dl>
                    <dt>Nationality</dt>
                    <dd>South Korea</dd>
                  </dl>
                  <dl>
                    <dt>Sex</dt>
                    <dd>Male</dd>
                  </dl>
                  <dl>
                    <dt>Age</dt>
                    <dd>40s</dd>
                  </dl>
                </div>
                <div className="map-menu-item">
                  <dl>
                    <dt>Airline</dt>
                    <dd>Asiana Airlines(OZ)</dd>
                  </dl>
                  <dl>
                    <dt>Flight Num</dt>
                    <dd>OZ521</dd>
                  </dl>
                  <dl>
                    <dt>Destination</dt>
                    <dd>LHR</dd>
                  </dl>
                </div>
                <div className="map-menu-item">
                  <p className="menu-sub-title">
                    <button>Check-In</button>
                  </p>
                  <dl>
                    <dt>Zone</dt>
                    <dd>C</dd>
                  </dl>
                  <dl>
                    <dt>Counter</dt>
                    <dd>33</dd>
                  </dl>
                  <dl>
                    <dt>Queue Length</dt>
                    <dd>37</dd>
                  </dl>
                  <dl>
                    <dt>Waiting Time</dt>
                    <dd>09:13</dd>
                  </dl>
                </div>
                <div className="map-menu-item">
                  <p className="menu-sub-title">
                    <button>Boarding Pass</button>
                  </p>
                  <p className="menu-sub-title">
                    <button>Security</button>
                  </p>
                  <p className="menu-sub-title">
                    <button>Passport</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* TODO: Schadcn 으로 변경 가능한지 검토하기 */}
          <div className="map-selector select-alone">
            <Typography className="left">
              Oct 14 <br /> 00:00
            </Typography>
            <Slider
              value={range1}
              onChange={(event, newValue) => setRange1(newValue as number)}
              valueLabelDisplay="auto"
              min={0}
              max={24}
              step={1 / 6}
              valueLabelFormat={(value) => `Oct 15 ${formatTime(value)}`}
            />
            <Typography className="right">
              Oct 15 <br /> 24:00
            </Typography>
          </div>
        </div>

        <div className={`overview-block ${activeIndex === 1 ? '' : 'hide'}`}>
          <div className="map-block">
            <Image src="/image/thumb/@img-main-01.png" alt="map" width={1280} height={600} />
            <div className="map-zoom">
              <button className="btn-zoom-in">
                <FontAwesomeIcon className="nav-icon" icon={faPlus} />
              </button>
              <button className="btn-zoom-out">
                <FontAwesomeIcon className="nav-icon" icon={faMinus} />
              </button>
            </div>
          </div>
          {/* TODO: Schadcn 으로 변경 가능한지 검토하기 */}
          <div className="map-selector">
            <Typography className="left">
              Oct 14 <br /> 00:00
            </Typography>
            <Slider
              value={range2}
              onChange={handleRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={24}
              step={1 / 6}
              valueLabelFormat={(value) => `Oct 15 ${formatTime(value)}`}
            />
            <Typography className="right">
              Oct 15 <br /> 24:00
            </Typography>
          </div>
        </div>
      </div>

      {/* ==================================================================================================== */}
      {/* Summary */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[0] ? '' : 'hide'} onClick={() => toggleSlide(0)}>
            Summary <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>

        <div className={`slide-contents ${isSlideActive[0] ? '' : 'hide'}`}>
          <div className="my-[14px] flex justify-end gap-4">
            <div className="min-w-[180px]">
              <SelectBox className="select-sm" options={['Mean', 'Top n%']} defaultValue="" />
            </div>

            <div className="flex items-center gap-1 text-lg font-semibold">
              <span>Top</span>
              <div className="max-w-20">
                <Input
                  className="input-rounded text-center text-sm"
                  type="text"
                  placeholder="0-100"
                  value={topValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopValue(e.target.value)}
                />
              </div>
              <span>%</span>
            </div>
          </div>

          <div className="summary-block">
            <div className="summary-left">
              <div className="summary">
                <dl>
                  <dt>Departure Flights</dt>
                  <dd>306</dd>
                </dl>
                <dl>
                  <dt>Arrival Flights</dt>
                  <dd>311</dd>
                </dl>
              </div>
              <div className="summary">
                <dl>
                  <dt>Delay / Return</dt>
                  <dd>41 / 3</dd>
                </dl>
              </div>
              <div className="summary">
                <dl>
                  <dt>Departure Passengers</dt>
                  <dd>41,357</dd>
                </dl>
                <dl>
                  <dt>Arrival Passengers</dt>
                  <dd>44,386</dd>
                </dl>
              </div>
              <div className="summary">
                <dl>
                  <dt>Transfer Passengers</dt>
                  <dd className="text-default-300">N/A</dd>
                </dl>
              </div>
            </div>

            <div className="summary-right">
              <p>KPI</p>
              <div>
                <dl>
                  <dt>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button>Passengers Throughput</button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </dt>
                  <dd>
                    41,357 <span className="orange">+8%</span>
                  </dd>
                </dl>
                <dl>
                  <dt>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button>Waiting Time</button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </dt>
                  <dd>
                    21:31 <span className="red">+15%</span>
                  </dd>
                </dl>
                <dl>
                  <dt>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button>Queue Length</button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>
                            <strong>Queue Length</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </dt>
                  <dd>
                    271<span className="red">+15%</span>
                  </dd>
                </dl>
                <dl>
                  <dt>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button>Facility efficiency</button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>
                            <strong>Tool-tip Title</strong>
                            <br />
                            The average or top n% of the total queue count experienced by one passenger across
                            all processes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </dt>
                  <dd>
                    27% <span className="green">+6%</span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================================================== */}
      {/* Alert & Issues */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[1] ? '' : 'hide'} onClick={() => toggleSlide(1)}>
            Alert & Issues <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>

        <div className={`slide-contents ${isSlideActive[1] ? '' : 'hide'}`}>
          <div className="my-[14px] flex justify-end gap-[14px]">
            <div className="min-w-60">
              <SelectBox
                options={[
                  'All Facilities',
                  'Check-in',
                  'Boarding Pass Control',
                  'Security Control',
                  'Passport Control',
                ]}
                defaultValue=""
                className="select-sm"
              />
            </div>
            <div className="min-w-60">
              <SelectBox
                options={['Passenger Throughput', 'Waiting Time', 'Queue Length', 'Facility Efficiency']}
                defaultValue=""
                className="select-sm"
              />
            </div>
          </div>

          <div className="issues-list">
            <div className="issue">
              <dl>
                <dt>Check-In C</dt>
                <dd>07:30 AM</dd>
              </dl>
              <p className="time">41:22</p>
              <p className="percent red">+12%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>Check-In B</dt>
                <dd>06:50 AM</dd>
              </dl>
              <p className="time">39:03</p>
              <p className="percent red">+15%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>DG5</dt>
                <dd>07:00 AM</dd>
              </dl>
              <p className="time">33:21</p>
              <p className="percent red">+15%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>DG5</dt>
                <dd>07:00 AM</dd>
              </dl>
              <p className="time">33:21</p>
              <p className="percent red">+15%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>DG5</dt>
                <dd>07:00 AM</dd>
              </dl>
              <p className="time">33:21</p>
              <p className="percent red">+15%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>DG2</dt>
                <dd>07:00 AM</dd>
              </dl>
              <p className="time">39:03</p>
              <p className="percent red">+15%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>DG2</dt>
                <dd>07:00 AM</dd>
              </dl>
              <p className="time">39:03</p>
              <p className="percent orange">+8%</p>
            </div>
            <div className="issue">
              <dl>
                <dt>DG2</dt>
                <dd>07:00 AM</dd>
              </dl>
              <p className="time">20:28</p>
              <p className="percent orange">+8%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================================================== */}
      {/* Details */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[2] ? '' : 'hide'} onClick={() => toggleSlide(2)}>
            <span>Details</span>
            <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>

        <div className={`slide-contents ${isSlideActive[2] ? '' : 'hide'}`}>
          <div className="detail-list">
            <div className="detail-item">
              <div className="detail-head">
                <h4>Check-In</h4>
                <a href="#">
                  <span>Details</span>
                  <FontAwesomeIcon style={{ fontSize: '14px' }} icon={faArrowRight} />
                </a>
              </div>

              <div className="detail-body">
                <div className="summary">
                  <div>
                    <Image src="/image/ico-main-01.svg" width={30} height={30} alt="" />
                    <dl>
                      <dt>Opened</dt>
                      <dd>352 / 486</dd>
                    </dl>
                  </div>
                  <div>
                    <Image src="/image/ico-main-02.svg" width={30} height={30} alt="" />
                    <dl>
                      <dt>Throughput</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                    <dl>
                      <dt>Max Queue</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                    <dl>
                      <dt>Queue Length</dt>
                      <dd>135</dd>
                    </dl>
                  </div>
                  <div>
                    <Image src="/image/ico-main-04.svg" width={30} height={30} alt="" />
                    <dl>
                      <dt>Proc. Time</dt>
                      <dd>00:00:11</dd>
                    </dl>
                  </div>
                  <div>
                    <Image src="/image/ico-main-04-1.svg" width={30} height={30} alt="" />
                    <dl>
                      <dt>Waiting Time</dt>
                      <dd>00:12:29</dd>
                    </dl>
                  </div>
                </div>

                <div className="scroll-list">
                  <div className="scroll-item closed">
                    <div className="scroll-item-head">
                      <h5>
                        <em>A</em>
                        <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        <span>Details</span>
                        <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>

                    <div className="scroll-item-body">
                      <div className="summary-sm disabled">
                        <div>
                          <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>B</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>C</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>D</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>E</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>F</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================================================== */}
      {/* Charts */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[3] ? '' : 'hide'} onClick={() => toggleSlide(3)}>
            Charts <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>

        <div className={`slide-contents ${isSlideActive[3] ? '' : 'hide'}`}>
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
                      className="select-sm max-w-60"
                      defaultValue=""
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
                      className="select-sm max-w-60"
                      defaultValue=""
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
                  <div className="rounded-md bg-white">
                    <HorizontalBarChart
                      chartData={histogramChartData}
                      chartLayout={{
                        barmode: 'stack',
                      }}
                    />
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
                          defaultValue=""
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="mb-2 font-semibold text-default-900">Security Check</p>
                      <div className="w-full">
                        <SelectBox
                          className="select-sm"
                          options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                          defaultValue="Old, New"
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="mb-2 font-semibold text-default-900">Passport</p>
                      <div className="w-full">
                        <SelectBox
                          className="select-sm"
                          options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                          defaultValue="Manual, Automated"
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
        </div>
      </div>
    </>
  );
}

export default HomePage;
