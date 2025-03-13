import React, { useState } from 'react';
import Image from 'next/image';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Menu, MenuItem } from '@mui/material';
import Button from '@/components/Button';
import { Slider } from '@/components/ui/Slider';

function FacilityPassengerAnalysis() {
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const handleColorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorAnchorEl(event.currentTarget);
  };
  const handleColorClose = () => {
    setColorAnchorEl(null);
  };

  const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const tableData = [
    { id: 1, Airline: 'Korean Air(KE)', Pax: '7,233' },
    { id: 2, Airline: 'Asiana Airlines(OZ)', Pax: '7,233' },
    { id: 3, Airline: 'Jin Air(JL)', Pax: '7,233' },
    { id: 4, Airline: 'EASTAR JET(ZE)', Pax: '33' },
    { id: 5, Airline: 'Jeju Air(7C)', Pax: '33' },
  ];

  return (
    <div className="my-[30px]">
      <div className="flex justify-between">
        <dl className="flex flex-col gap-2.5">
          <dt className="text-xl font-semibold leading-none text-default-800">
            Check-In Counter Zone Top View
          </dt>
          <dd className="font-medium leading-none text-default-600">
            Analyze passenger waiting status around the Check-In counter. The color of the passenger dot can be
            changed through the upper right filter.
          </dd>
        </dl>

        <div className="flex items-center gap-2.5">
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-filter.svg" alt="filter" />}
            text="Color Criteria"
            onClick={handleColorClick}
          />
          <Menu
            anchorEl={colorAnchorEl}
            open={Boolean(colorAnchorEl)}
            onClose={handleColorClose}
            PaperProps={{
              className: 'sub-menu !w-150',
            }}
          >
            <MenuItem onClick={() => {}}>Airline</MenuItem>
            <MenuItem onClick={() => {}}>Age</MenuItem>
            <MenuItem onClick={() => {}}>Sex</MenuItem>
            <MenuItem onClick={() => {}}>Destination</MenuItem>
            <MenuItem onClick={() => {}}>Nationality</MenuItem>
            <MenuItem onClick={() => {}}>Flight Number</MenuItem>
          </Menu>
        </div>
      </div>

      <div className="relative mt-8 flex flex-col">
        <div className="flex flex-col gap-8">
          <div className="relative flex flex-grow items-center justify-center rounded-md">
            <Image src="/image/thumb/@img-main-02.png" alt="map" width={1280} height={600} className="w-full" />

            <div className="absolute left-2.5 top-2.5 z-10 flex flex-col overflow-hidden rounded-md border border-default-300">
              <button className="flex h-11 w-11 items-center justify-center border-b bg-white hover:text-accent-600">
                <FontAwesomeIcon className="nav-icon" icon={faPlus} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center bg-white hover:text-accent-600">
                <FontAwesomeIcon className="nav-icon" icon={faMinus} />
              </button>
            </div>

            {/* FLOATING MAP */}
            <div className="absolute right-2.5 top-2.5 w-[260px] max-w-[calc(100%-20px)] rounded-md border-b border-default-200 bg-white pb-2.5 pl-2.5 pr-1">
              <p className="px-[15px] pb-2.5 pt-2.5 text-sm font-semibold text-default-900">Pax ID 5132438</p>

              <div>
                <div className="px-[15px] py-[5px]">
                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Nationality</dt>
                    <dd className="text-sm font-semibold text-default-900">South Korea</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Sex</dt>
                    <dd className="text-sm font-semibold text-default-900">Male</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Age</dt>
                    <dd className="text-sm font-semibold text-default-900">40s</dd>
                  </dl>
                </div>

                <div className="px-[15px] py-[5px]">
                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Airline</dt>
                    <dd className="text-sm font-semibold text-default-900">Asiana Airlines(OZ)</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Flight Num</dt>
                    <dd className="text-sm font-semibold text-default-900">OZ521</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Destination</dt>
                    <dd className="text-sm font-semibold text-default-900">LHR</dd>
                  </dl>
                </div>

                <div className="px-[15px] py-[5px]">
                  <p className="flex h-10 items-center text-sm font-semibold text-accent-600">
                    <button>Check-In</button>
                  </p>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Zone</dt>
                    <dd className="text-sm font-semibold text-default-900">C</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Counter</dt>
                    <dd className="text-sm font-semibold text-default-900">33</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Queue Length</dt>
                    <dd className="text-sm font-semibold text-default-900">37</dd>
                  </dl>

                  <dl className="flex items-center justify-between">
                    <dt className="text-sm text-default-900">Waiting Time</dt>
                    <dd className="text-sm font-semibold text-default-900">09:13</dd>
                  </dl>
                </div>

                <div className="px-[15px] py-[5px]">
                  <p className="flex h-10 items-center text-sm font-semibold text-accent-600">
                    <button>Boarding Pass</button>
                  </p>
                  <p className="flex h-10 items-center text-sm font-semibold text-accent-600">
                    <button>Security</button>
                  </p>
                  <p className="flex h-10 items-center text-sm font-semibold text-accent-600">
                    <button>Passport</button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-between">
            <dl className="flex flex-col gap-2.5">
              <dt className="text-xl font-semibold leading-none text-default-800">
                Number of people excluded from analysis
              </dt>
              <dd className="font-medium leading-none text-default-600">
                Number of passengers who used mobile Check-In and did not use Baggage Check-In service at the
                airport during the analysis period.
              </dd>
            </dl>

            <p className="text-xl font-semibold text-default-900">0 Pax (0% of the total)</p>
          </div>

          <div className="mt-2.5">
            <Slider defaultValue={[50]} />
          </div>
        </div>
      </div>

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
        <div className="flex items-center">
          <Button
            className="btn-default active"
            icon={<Image width={20} height={20} src="/image/ico-dot-accent.svg" alt="" />}
            text="Airline"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-orange.svg" alt="" />}
            text="Destination"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Flight Number"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Check-In Counter"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Ticket Issuance"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Baggage Check-In"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Departure Gate"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Apron Number"
            onClick={() => {}}
          />
        </div>

        <div className="mt-mb-10 mb-10 text-xl font-semibold text-default-900">
          Total Queue Length: 15,681 Pax
        </div>

        <div className="gap-90 flex items-end justify-between">
          <div className="">API AREA</div>

          <div className="overflow-hidden rounded-md border border-default-300" style={{ maxWidth: '50%' }}>
            <table className="">
              <colgroup>
                <col className="w-90" />
                <col className="w-auto" />
              </colgroup>

              <thead>
                <tr>
                  <th colSpan={2} className="text-md !border-r-0 text-left !font-medium">
                    Airline TOP 5
                  </th>
                </tr>
              </thead>

              <tbody>
                {tableData.map((airline) => (
                  <tr key={airline.id}>
                    <td className="text-left font-medium !text-default-800">{airline.id}</td>
                    <td>
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-md !font-medium text-default-800">{airline.Airline}</span>
                        <span className="text-sm !font-medium text-default-600">{airline.Pax}Pax</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-between">
        <dl className="flex flex-col gap-2.5">
          <dt className="text-xl font-semibold leading-none text-default-800">
            Passenger Processing Analysis Chart
          </dt>
          <dd className="font-medium leading-none text-default-600">
            Analyze the sum of the performances of the selected Check-In facilities for each indicator. You can
            select up to two indicators.
          </dd>
        </dl>

        <div className="flex items-center gap-2.5">
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-filter.svg" alt="filter" />}
            text="Color Criteria"
            onClick={handleColorClick}
          />

          <Menu
            anchorEl={colorAnchorEl}
            open={Boolean(colorAnchorEl)}
            onClose={handleColorClose}
            PaperProps={{
              className: 'sub-menu !w-150',
            }}
          >
            <MenuItem onClick={() => {}}>Airline</MenuItem>
            <MenuItem onClick={() => {}}>Age</MenuItem>
            <MenuItem onClick={() => {}}>Sex</MenuItem>
            <MenuItem onClick={() => {}}>Destination</MenuItem>
            <MenuItem onClick={() => {}}>Nationality</MenuItem>
            <MenuItem onClick={() => {}}>Flight Number</MenuItem>
          </Menu>
        </div>
      </div>

      <div className="mt-10 rounded-md border border-default-200 p-5">
        <div className="flex items-center">
          <Button
            className="btn-default active"
            icon={<Image width={20} height={20} src="/image/ico-dot-accent.svg" alt="" />}
            text="Queue Length"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-orange.svg" alt="" />}
            text="Waiting Time"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Throughput"
            onClick={() => {}}
          />
          <Button
            className="btn-default"
            icon={<Image width={20} height={20} src="/image/ico-dot-green.svg" alt="" />}
            text="Facility Efficiency"
            onClick={() => {}}
          />
        </div>

        <div className="rounded-md bg-white">API AREA</div>
      </div>
    </div>
  );
}

export default FacilityPassengerAnalysis;
