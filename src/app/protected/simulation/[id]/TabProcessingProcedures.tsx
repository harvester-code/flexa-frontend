'use client';

import React, { useState } from 'react';
import { faAngleLeft, faAngleRight, faCheck, faEquals } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import Tooltip from '@mui/material/Tooltip';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';

const Tooltip = (props: any) => { return <div></div> };

export default function TabProcessingProcedures() {
  const [checkIn, setCheckIn] = useState('A, B, C, D, E, F, G, H, J, K, L, M, N, Mobile, CAT');
  const [boarding, setBoarding] = useState('DG1, DG2, DG3, DG4, DG5, DG6');
  const [security, setSecurity] = useState('DG1, DG2, DG3, DG4, DG5, DG6');
  const [control, setControl] = useState('DG1, DG2, DG3, DG4, DG5, DG6');

  return (
    <div>
      <div className="mt-[25px] flex justify-between">
        <div>
          <h2 className="title-sm">Passenger Show-up Patterns</h2>
          <p className="text-sm text-default-500">
            You can check and modify the current airport procedures. <br />
            Match processing procedures according to airport operations and needs using this input.
          </p>
        </div>
        <p className="flex gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faEquals} />}
            text="Edit Procedures"
            onClick={() => {}}
          />
          {/* <Button
            className="btn-md btn-primary"
            icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faEquals} />}
            text="Confirm"
            onClick={() => {}}
          /> */}
        </p>
      </div>
      <dl className="mt-[40px]">
        <dt className="tooltip-line">
          Data connection criteria <span className="text-accent-600">*</span>
          <button>
            <Tooltip
              title={
                <React.Fragment>
                  <strong>Tool-tip Title</strong>
                  <br />
                  The average or top n% of the total queue count experienced by one passenger across
                  all processes.
                </React.Fragment>
              }
              placement="right"
              arrow
            >
              <img src="/image/ico-help.svg" alt="tooltip" />
            </Tooltip>
          </button>
        </dt>
        <dd>
          <SelectBox
            options={['Airline_Code', 'Operating_Carrier_Code']}
            className="select-default"
          />
        </dd>
      </dl>
      <div className="processing-wrap mt-[10px]">
        <div className="processing-item">
          <button className="item-move">
            <FontAwesomeIcon size="sm" icon={faEquals} />
          </button>
          <p className="item-name">
            <span>Check-In</span>
            <button>
              <img src="/image/ico-write.svg" alt="delete" />
            </button>
          </p>
          <dl className="ml-[40px] flex-grow">
            <dt className="tooltip-line">
              Enter the Check-In desks <span className="text-accent-600">*</span>
              <button>
                <Tooltip
                  title={
                    <React.Fragment>
                      <strong>Tool-tip Title</strong>
                      <br />
                      The average or top n% of the total queue count experienced by one passenger
                      across all processes.
                    </React.Fragment>
                  }
                  placement="right"
                  arrow
                >
                  <img src="/image/ico-help.svg" alt="tooltip" />
                </Tooltip>
              </button>
            </dt>
            <dd>
              <Input
                type="text"
                value={checkIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
              />
            </dd>
          </dl>
        </div>
        <div className="processing-item">
          <button className="item-move">
            <FontAwesomeIcon size="sm" icon={faEquals} />
          </button>
          <p className="item-name">
            <span>Boarding Pass</span>
            <button>
              <img src="/image/ico-write.svg" alt="delete" />
            </button>
          </p>
          <dl className="ml-[40px] flex-grow">
            <dt className="tooltip-line">
              Enter the Boarding Pass desks <span className="text-accent-600">*</span>
              <button>
                <Tooltip
                  title={
                    <React.Fragment>
                      <strong>Tool-tip Title</strong>
                      <br />
                      The average or top n% of the total queue count experienced by one passenger
                      across all processes.
                    </React.Fragment>
                  }
                  placement="right"
                  arrow
                >
                  <img src="/image/ico-help.svg" alt="tooltip" />
                </Tooltip>
              </button>
            </dt>
            <dd>
              <Input
                type="text"
                value={boarding}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBoarding(e.target.value)}
              />
            </dd>
          </dl>
        </div>
        <div className="processing-item">
          <button className="item-move">
            <FontAwesomeIcon size="sm" icon={faEquals} />
          </button>
          <p className="item-name">
            <span>Security</span>
            <button>
              <img src="/image/ico-write.svg" alt="delete" />
            </button>
          </p>
          <dl className="ml-[40px] flex-grow">
            <dt className="tooltip-line">
              Enter the Boarding Pass desks <span className="text-accent-600">*</span>
              <button>
                <Tooltip
                  title={
                    <React.Fragment>
                      <strong>Tool-tip Title</strong>
                      <br />
                      The average or top n% of the total queue count experienced by one passenger
                      across all processes.
                    </React.Fragment>
                  }
                  placement="right"
                  arrow
                >
                  <img src="/image/ico-help.svg" alt="tooltip" />
                </Tooltip>
              </button>
            </dt>
            <dd>
              <Input
                type="text"
                value={security}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecurity(e.target.value)}
              />
            </dd>
          </dl>
        </div>
        <div className="processing-item">
          <button className="item-move">
            <FontAwesomeIcon size="sm" icon={faEquals} />
          </button>
          <p className="item-name">
            <span>Passport</span>
            <button>
              <img src="/image/ico-write.svg" alt="delete" />
            </button>
          </p>
          <dl className="ml-[40px] flex-grow">
            <dt className="tooltip-line">
              Enter the Boarding Pass desks <span className="text-accent-600">*</span>
              <button>
                <Tooltip
                  title={
                    <React.Fragment>
                      <strong>Tool-tip Title</strong>
                      <br />
                      The average or top n% of the total queue count experienced by one passenger
                      across all processes.
                    </React.Fragment>
                  }
                  placement="right"
                  arrow
                >
                  <img src="/image/ico-help.svg" alt="tooltip" />
                </Tooltip>
              </button>
            </dt>
            <dd>
              <Input
                type="text"
                value={control}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setControl(e.target.value)}
              />
            </dd>
          </dl>
        </div>
      </div>
      <p className="add-item">
        <button>
          <img src="/image/ico-add-item.svg" alt="add item" />
        </button>
      </p>
      <p className="flex justify-end gap-[10px] px-[20px]">
        <Button className="btn-md btn-tertiary" text="Apply" onClick={() => {}} />
        <Button
          className="btn-md btn-tertiary"
          iconRight={<FontAwesomeIcon className="nav-icon" size="sm" icon={faCheck} />}
          text="Applied"
          onClick={() => {}}
        />
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