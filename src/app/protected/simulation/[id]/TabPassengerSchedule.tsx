'use client';

import React, { useState } from 'react';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import SelectBox from '@/components/SelectBox';

export default function TabPassengerSchedule() {
  const [addConditions, setAddConditions] = useState(true);
  return (
    <div>
      <h2 className="title-sm mt-[25px]">Passenger Schedule</h2>
      <p className="mt-[30px] text-[40px] text-xl font-semibold text-default-800">Passenger Show-up Patterns</p>
      <div className="mt-[20px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
        <Checkbox
          id="add-conditions"
          label=""
          checked={addConditions}
          onChange={() => setAddConditions(!addConditions)}
          className="checkbox-toggle"
        />
        <dl>
          <dt className="font-semibold">Add Conditions</dt>
          <dd className="text-sm font-medium text-default-400">
            Enable the option to set conditions for filtering passenger data.{' '}
          </dd>
        </dl>
      </div>
      <div className="schedule-block mt-[30px]">
        <div className="schedule-bottom">
          <div className="flex flex-col gap-[10px]">
            <p className="font-semibold text-default-900">
              Passengers with above characteristics arrive at the airport
            </p>
            <div className="flex items-center gap-[10px] text-xl">
              normally distributed with mean
              <div className="w-[100px]">
                <SelectBox options={['115', '120', '125', '130', '135', '140', '145', '150']} />
              </div>
              variance
              <div className="w-[100px]">
                <SelectBox options={['05', '10', '15', '20', '25', '30', '35', '40']} />
              </div>
              minutes
            </div>
            <p className="text-xl">before the flight departure.</p>
          </div>
        </div>
      </div>
      <p className="mt-[20px] flex justify-end px-[20px]">
        <Button className="btn-md btn-tertiary" text="Apply" onClick={() => {}} />
      </p>
      <div className="mt-[30px] flex justify-between">
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>
        <button className="btn-md btn-default btn-rounded w-[210px] justify-between">
          <span className="flex flex-grow items-center justify-center">Processing Procedures</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
