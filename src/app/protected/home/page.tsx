'use client';

import { useState } from 'react';
import { faAngleUp, faArrowRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSupabaseTestData } from '@/api/home';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import SelectBox from '@/components/SelectBox';
import { Input } from '@/components/UIs/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UIs/Tooltip';

export default function HomePage() {
  const { data, isLoading, error } = useSupabaseTestData();
  const [chartType, setChartType] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSlideActive, setIsSlideActive] = useState([false, false]);
  const [topValue, setTopValue] = useState('');

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
  };

  const toggleSlide = (index: number) => {
    setIsSlideActive((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  if (isLoading) return <div>로딩중...</div>;
  if (error) return <div>에러 발생 {error.message}</div>;

  return (
    <div>
      <ContentsHeader text="Home" />
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
            </ul>
          </dd>
        </dl>
        <div className="flex items-center gap-10">
          <Button
            className="btn-md btn-default"
            icon={<img src="/image/ico-filter.svg" alt="filter" />}
            text="Fliter Details"
            onClick={() => {}}
          />
          <Button className="btn-md btn-primary" text="See Results" onClick={() => {}} />
        </div>
      </div>
      <div className="mt-[30px] flex items-center justify-between">
        <h2 className="title-sm">Terminal Overview</h2>
        <div className="main-tab flex items-center gap-[10px]">
          <button className={activeIndex === 0 ? 'active' : ''} onClick={() => handleTabClick(0)}>
            Time Stamp
          </button>
          <button className={activeIndex === 1 ? 'active' : ''} onClick={() => handleTabClick(1)}>
            Time Span
          </button>
        </div>
      </div>

      {/* 오버뷰 컨테이너 */}
      <div className="overview-container mt-[20px]">
        <div className={`overview-block ${activeIndex === 0 ? '' : 'hide'}`}>
          <div className="map-block">
            <img src="/image/thumb/@img-main-02.png" alt="map" />
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
          <div className="map-selector select-alone">
            {/* <Typography className="left">
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
            </Typography> */}
          </div>
        </div>
        <div className={`overview-block ${activeIndex === 1 ? '' : 'hide'}`}>
          <div className="map-block">
            <img src="/image/thumb/@img-main-01.png" alt="map" />
            <div className="map-zoom">
              <button className="btn-zoom-in">
                <FontAwesomeIcon className="nav-icon" icon={faPlus} />
              </button>
              <button className="btn-zoom-out">
                <FontAwesomeIcon className="nav-icon" icon={faMinus} />
              </button>
            </div>
          </div>
          <div className="map-selector">
            {/* <Typography className="left">
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
            </Typography> */}
          </div>
        </div>
      </div>

      {/* 슬라이드 컨텐츠 */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[0] ? '' : 'hide'} onClick={() => toggleSlide(0)}>
            Summary <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>
        <div className={`slide-contents ${isSlideActive[0] ? '' : 'hide'}`}>
          <div className="mt-15 gap-15 flex justify-end">
            <div className="w-180">
              <SelectBox options={['Mean', 'Top n%']} defaultValue="" className="select-sm" />
            </div>
            <div className="flex items-center gap-5 text-lg font-semibold">
              Top
              <div className="w-80">
                <Input
                  type="text"
                  placeholder="0-100"
                  value={topValue}
                  onChange={(e) => setTopValue(e.target.value)}
                  className="input-rounded text-center text-sm"
                />
              </div>
              %
            </div>
          </div>
          <div className="summary-block">
            <div className="summery-left">
              <div className="summery">
                <dl>
                  <dt>Departure Flights</dt>
                  <dd>306</dd>
                </dl>
                <dl>
                  <dt>Arrival Flights</dt>
                  <dd>311</dd>
                </dl>
              </div>
              <div className="summery">
                <dl>
                  <dt>Delay / Return</dt>
                  <dd>41 / 3</dd>
                </dl>
              </div>
              <div className="summery">
                <dl>
                  <dt>Departure Passengers</dt>
                  <dd>41,357</dd>
                </dl>
                <dl>
                  <dt>Arrival Passengers</dt>
                  <dd>44,386</dd>
                </dl>
              </div>
              <div className="summery">
                <dl>
                  <dt>Transfer Passengers</dt>
                  <dd className="text-default-300">N/A</dd>
                </dl>
              </div>
            </div>
            <div className="summery-right">
              <p>KPI</p>
              <div>
                <dl>
                  <dt>
                    <TooltipProvider>
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
                    <TooltipProvider>
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
                    <TooltipProvider>
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
                    <TooltipProvider>
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

      {/* 슬라이드 컨텐츠 */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[1] ? '' : 'hide'} onClick={() => toggleSlide(1)}>
            Alert & Issues <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>
        <div className={`slide-contents ${isSlideActive[1] ? '' : 'hide'}`}>
          <div className="mt-15 gap-15 flex justify-end">
            <div className="w-240">
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
            <div className="w-240">
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

      {/* 슬라이드 컨텐츠 */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[2] ? '' : 'hide'} onClick={() => toggleSlide(2)}>
            Details <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>
        <div className={`slide-contents ${isSlideActive[2] ? '' : 'hide'}`}>
          <div className="detail-list">
            {/* 디테일 아이템 */}
            <div className="detail-item">
              <div className="detail-head">
                <h4>Check-In</h4>
                <a href="#">
                  Details <FontAwesomeIcon style={{ fontSize: '12px' }} icon={faArrowRight} />
                </a>
              </div>
              <div className="detail-body">
                <div className="summary">
                  <div>
                    <img src="/image/ico-main-01.svg" alt="" />
                    <dl>
                      <dt>Opened</dt>
                      <dd>352 / 486</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-02.svg" alt="" />
                    <dl>
                      <dt>Throughput</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Max Queue</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Queue Length</dt>
                      <dd>135</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04.svg" alt="" />
                    <dl>
                      <dt>Proc. Time</dt>
                      <dd>00:00:11</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04-1.svg" alt="" />
                    <dl>
                      <dt>Waiting Time</dt>
                      <dd>00:12:29</dd>
                    </dl>
                  </div>
                </div>
                <div className="scroll-list">
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>A</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm disabled">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
            {/* 디테일 아이템 끝 */}
            <div className="detail-item">
              <div className="detail-head">
                <h4>Boarding pass Control</h4>
                <a href="#">
                  Details <FontAwesomeIcon style={{ fontSize: '12px' }} icon={faArrowRight} />
                </a>
              </div>
              <div className="detail-body">
                <div className="summary">
                  <div>
                    <img src="/image/ico-main-01.svg" alt="" />
                    <dl>
                      <dt>Opened</dt>
                      <dd>352 / 486</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-02.svg" alt="" />
                    <dl>
                      <dt>Throughput</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Max Queue</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Queue Length</dt>
                      <dd>135</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04.svg" alt="" />
                    <dl>
                      <dt>Proc. Time</dt>
                      <dd>00:00:11</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04-1.svg" alt="" />
                    <dl>
                      <dt>Waiting Time</dt>
                      <dd>00:12:29</dd>
                    </dl>
                  </div>
                </div>
                <div className="scroll-list">
                  {/* closed 상태 클래스 추가 */}
                  <div className="scroll-item closed">
                    <div className="scroll-item-head">
                      <h5>
                        <em>DG1</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG2</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG3</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG4</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG5</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG6</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
            <div className="detail-item">
              <div className="detail-head">
                <h4>Security Control</h4>
                <a href="#">
                  Details <FontAwesomeIcon style={{ fontSize: '12px' }} icon={faArrowRight} />
                </a>
              </div>
              <div className="detail-body">
                <div className="summary">
                  <div>
                    <img src="/image/ico-main-01.svg" alt="" />
                    <dl>
                      <dt>Opened</dt>
                      <dd>352 / 486</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-02.svg" alt="" />
                    <dl>
                      <dt>Throughput</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Max Queue</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Queue Length</dt>
                      <dd>135</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04.svg" alt="" />
                    <dl>
                      <dt>Proc. Time</dt>
                      <dd>00:00:11</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04-1.svg" alt="" />
                    <dl>
                      <dt>Waiting Time</dt>
                      <dd>00:12:29</dd>
                    </dl>
                  </div>
                </div>
                <div className="scroll-list">
                  {/* closed 상태 클래스 추가 */}
                  <div className="scroll-item closed">
                    <div className="scroll-item-head">
                      <h5>
                        <em>DG1</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG3</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG4</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG5</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG6</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
            <div className="detail-item">
              <div className="detail-head">
                <h4>Passport Control</h4>
                <a href="#">
                  Details <FontAwesomeIcon style={{ fontSize: '12px' }} icon={faArrowRight} />
                </a>
              </div>
              <div className="detail-body">
                <div className="summary">
                  <div>
                    <img src="/image/ico-main-01.svg" alt="" />
                    <dl>
                      <dt>Opened</dt>
                      <dd>352 / 486</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-02.svg" alt="" />
                    <dl>
                      <dt>Throughput</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Max Queue</dt>
                      <dd>500</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-03.svg" alt="" />
                    <dl>
                      <dt>Queue Length</dt>
                      <dd>135</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04.svg" alt="" />
                    <dl>
                      <dt>Proc. Time</dt>
                      <dd>00:00:11</dd>
                    </dl>
                  </div>
                  <div>
                    <img src="/image/ico-main-04-1.svg" alt="" />
                    <dl>
                      <dt>Waiting Time</dt>
                      <dd>00:12:29</dd>
                    </dl>
                  </div>
                </div>
                <div className="scroll-list">
                  <div className="scroll-item">
                    <div className="scroll-item-head">
                      <h5>
                        <em>DG1</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG2</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG3</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG4</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG5</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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
                        <em>DG6</em> <span className="stats-close">CLOSED</span>
                      </h5>
                      <a href="#">
                        Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                      </a>
                    </div>
                    <div className="scroll-item-body">
                      <div className="summary-sm">
                        <div>
                          <img src="/image/ico-main-01.svg" alt="" />
                          <dl>
                            <dt>Opened</dt>
                            <dd>0 / 2</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-02.svg" alt="" />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-03.svg" alt="" />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>0</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04.svg" alt="" />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>00:00:00</dd>
                          </dl>
                        </div>
                        <div>
                          <img src="/image/ico-main-04-1.svg" alt="" />
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

      {/* 슬라이드 컨텐츠 */}
      <div className="slide-container">
        <div className="slide-head">
          <h3 className={isSlideActive[3] ? '' : 'hide'} onClick={() => toggleSlide(3)}>
            Charts <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
          </h3>
        </div>
        <div className={`slide-contents ${isSlideActive[3] ? '' : 'hide'}`}>
          <div className="charts">
            {/* 차트 아이템 */}
            <div className="chart-item">
              <div className="chart-item-head">
                <h5>Flow Chart</h5>
                <div>
                  Bar Chart
                  <Checkbox
                    id="chart-type"
                    label=""
                    checked={chartType}
                    onChange={() => setChartType(!chartType)}
                    className="checkbox-toggle"
                  />
                  Line Chart
                </div>
              </div>
              <div className="chart-item-body">
                <div className="chart-block">
                  <div className="flex items-center justify-between">
                    <div className="w-[240px]">
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
                    <div className="tab-btn flex items-center">
                      <Button
                        className="btn-md btn-default active"
                        icon={<img src="/image/ico-dot-violet.svg" alt="" />}
                        text="Throughput"
                        onClick={() => {}}
                      />
                      <Button
                        className="btn-md btn-default active"
                        icon={<img src="/image/ico-dot-orange.svg" alt="" />}
                        text="Waiting Time"
                        onClick={() => {}}
                      />
                      <Button
                        className="btn-md btn-default"
                        icon={<img src="/image/ico-dot-green.svg" alt="" />}
                        text="Queue Length"
                        onClick={() => {}}
                      />
                      <Button
                        className="btn-md btn-default"
                        icon={<img src="/image/ico-dot-green.svg" alt="" />}
                        text="Facility Efficiency"
                        onClick={() => {}}
                      />
                    </div>
                  </div>
                  <div className="mt-[40px] flex h-[360px] items-center justify-center rounded-md bg-white">
                    API AREA
                  </div>
                </div>
              </div>
            </div>
            {/* 차트 아이템 끝 */}
            <div className="chart-item">
              <div className="chart-item-head">
                <h5>Histogram</h5>
              </div>
              <div className="chart-item-body">
                <div className="chart-block">
                  <div className="flex items-center justify-between">
                    <div className="w-[240px]">
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
                    <div className="tab-btn flex items-center">
                      <Button
                        className="btn-md btn-default active"
                        icon={<img src="/image/ico-dot-orange.svg" alt="" />}
                        text="Waiting Time"
                        onClick={() => {}}
                      />
                      <Button
                        className="btn-md btn-default"
                        icon={<img src="/image/ico-dot-green.svg" alt="" />}
                        text="Queue Length"
                        onClick={() => {}}
                      />
                      <Button
                        className="btn-md btn-default"
                        icon={<img src="/image/ico-dot-green.svg" alt="" />}
                        text="Facility Efficiency"
                        onClick={() => {}}
                      />
                    </div>
                  </div>
                  <div className="mt-[40px] flex h-[360px] items-center justify-center rounded-md bg-white">
                    API AREA
                  </div>
                </div>
              </div>
            </div>
            <div className="chart-item">
              <div className="chart-item-head">
                <h5>Sankey Chart</h5>
                <p className="text-sm font-medium">Total Passengers Processed: 1,568 pax</p>
              </div>
              <div className="chart-item-body">
                <div className="chart-block">
                  <div className="mt-[30px] grid grid-cols-5 gap-[60px]">
                    <div className="flex flex-col items-center justify-center gap-[10px]">
                      <p className="font-semibold text-default-900">Check-In</p>
                      <p className="flex h-[40px] items-center justify-center text-sm font-medium text-default-600">
                        By Check-In Counter
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-[10px]">
                      <p className="font-semibold text-default-900">Boarding pass</p>
                      <div className="w-full">
                        <SelectBox
                          options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                          defaultValue=""
                          className="select-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-[10px]">
                      <p className="font-semibold text-default-900">Security Check</p>
                      <div className="w-full">
                        <SelectBox
                          options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                          defaultValue="Old, New"
                          className="select-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-[10px]">
                      <p className="font-semibold text-default-900">Passport</p>
                      <div className="w-full">
                        <SelectBox
                          options={['By Gate', 'New, OLD', 'Manual, Automated', 'Fasttrack O,Fasttrack X']}
                          defaultValue="Manual, Automated"
                          className="select-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-[10px]">
                      <p className="font-semibold text-default-900">Boarding</p>
                      <p className="flex h-[40px] items-center justify-center text-sm font-medium text-default-600">
                        Eastern, Western
                      </p>
                    </div>
                  </div>
                  <div className="mt-[40px] flex h-[360px] items-center justify-center rounded-md">
                    API AREA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
    </div>
  );
}
