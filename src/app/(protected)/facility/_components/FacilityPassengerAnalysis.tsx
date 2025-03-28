import Image from 'next/image';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Slider } from '@/components/ui/Slider';
import FacilityPassengerAnalysisBarChart from './FacilityPassengerAnalysisBarChart';
import FacilityPassengerAnalysisDonutChart from './FacilityPassengerAnalysisDonutChart';

interface FacilityPassengerAnalysisProps {
  passengerAnalysisBarChartData?: any;
  passengerAnalysisDonutChartData?: any;
}

function FacilityPassengerAnalysis({
  passengerAnalysisBarChartData,
  passengerAnalysisDonutChartData,
}: FacilityPassengerAnalysisProps) {
  return (
    <div className="my-[30px]">
      <div className="mt-8 flex justify-between">
        <dl className="flex flex-col gap-2.5">
          <dt className="text-xl font-semibold leading-none text-default-800">
            Check-In Counter Zone Top View
          </dt>
          <dd className="font-medium leading-none text-default-600">
            Analyze passenger waiting status around the Check-In counter. The color of the passenger dot can be
            changed through the upper right filter.
          </dd>
        </dl>
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

          <div>
            <Slider defaultValue={[50]} />
          </div>
        </div>
      </div>

      <FacilityPassengerAnalysisDonutChart passengerAnalysisDonutChartData={passengerAnalysisDonutChartData} />

      <FacilityPassengerAnalysisBarChart passengerAnalysisBarChartData={passengerAnalysisBarChartData} />
    </div>
  );
}

export default FacilityPassengerAnalysis;
