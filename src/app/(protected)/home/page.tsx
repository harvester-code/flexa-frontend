'use client';

// TODO: CSS 모듈화하기
import '@/styles/home.css';
import { useState } from 'react';
import Image from 'next/image';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Slider, Typography } from '@mui/material';
import Button from '@/components/Button';
import ContentsHeader from '@/components/ContentsHeader';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';

function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [range1, setRange1] = useState<number>(4);
  const [range2, setRange2] = useState<number[]>([4, 20]);

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
        <div className="flex items-center gap-2.5">
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
        <div className="main-tab flex items-center gap-2.5">
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

      {/* Summary */}
      <HomeAccordion title="Summary">
        <HomeSummary />
      </HomeAccordion>

      {/* Alert & Issues */}
      <HomeAccordion title="Alert & Issues">
        <HomeWarning />
      </HomeAccordion>

      {/* Details */}
      <HomeAccordion title="Details">
        <HomeDetails />
      </HomeAccordion>

      {/* Charts */}
      <HomeAccordion title="Charts">
        <HomeCharts />
      </HomeAccordion>
    </>
  );
}

export default HomePage;
