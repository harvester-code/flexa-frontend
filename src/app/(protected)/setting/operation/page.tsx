'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { faAngleDown, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import Tooltip from '@/components/Tooltip';
import SelectBox from '@/components/SelectBox';
import Input from '@/components/Input';

const Canvas = dynamic(() => import('./_components/Canvas'), { ssr: false });

function SettingOperationPage() {
  const [airportName, setAirportName] = useState('');
  const [terminals, setTerminals] = useState(['Terminal 1']);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [processes, setProcesses] = useState<string[][]>([['Check-In']]);
  const [processIndex, setProcessIndex] = useState(0);
  const [numOfFacilitiesInProcess, setNumOfFacilitiesInProcess] = useState<number[][]>([[0]]);
  return (
    <div className="mx-auto max-w-[1340px] px-[30px]">
      <div className="location">
        <span>Settings</span>
        <span>Operation Settings</span>
      </div>
      <div className="mt-[30px] flex flex-col border-b border-default-300 pb-[20px]">
        <h2 className="title-sm">Operation Settings</h2>
        <p className="text-sm text-default-500">
          Enter the current facility information for the airport to set the default values that apply to all
          members.
        </p>
      </div>
      <div className="mt-[25px] flex h-[40px] items-center gap-[10px]">
        <span className="flex-shrink-0 text-xl font-semibold text-default-900">Airport Name:</span>
        <input
          id="title"
          type="text"
          placeholder="Enter Name"
          value={airportName}
          onChange={(e) => setAirportName(e.target.value)}
          className="h-[40px] w-[150px] bg-transparent text-xl font-semibold text-default-900 !outline-none"
        />
        <button>
          <Image width={24} height={24} src="/image/ico-edit-title.svg" alt="write" />
        </button>
      </div>
      <div className="mt-[40px] flex justify-between gap-[20px]">
        <div className="tab-setting">
          {terminals.map((terminal, index) => (
            <div key={`tab${index}`} className={`tab ${terminalIndex === index ? 'active' : ''}`}>
              <button className="tab-btn" onClick={() => setTerminalIndex(index)}>
                {terminal}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="btn-more">
                    <Image width={20} height={20} src="/image/ico-dot-menu.svg" alt="more" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="pr-[20px]">
                  <DropdownMenuItem onClick={() => {}}>
                    <Image width={20} height={20} src="/image/ico-restore.svg" alt="" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Image width={20} height={20} src="/image/ico-trash-r.svg" alt="" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        <Button
          className="btn-md btn-default"
          icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faPlus} />}
          text="Terminal"
          onClick={() => {}}
        />
      </div>
      <div className="process-wrap mt-[29px]">
        <div className="process-item-block">
          <div className="flex justify-between">
            <dl className="process-item-title">
              <dt>Terminal Process</dt>
              <dd>Create and set up a process for this terminal.</dd>
            </dl>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="btn-more">
                  <Image width={20} height={20} src="/image/ico-dot-menu.svg" alt="more" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="pr-[20px]">
                <DropdownMenuItem onClick={() => {}}>
                  <Image width={20} height={20} src="/image/ico-restore.svg" alt="" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Image width={20} height={20} src="/image/ico-trash-r.svg" alt="" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* terminal process content */}
          <div className="relative mt-[10px]">
            <div className="flex justify-between gap-[20px]">
              <div className="tab-setting tab-black">
                {processes?.[terminalIndex]?.map((process, index) => (
                  <div key={`tab${index}`} className={`tab ${processIndex === index ? 'active' : ''}`}>
                    <button className="tab-btn" onClick={() => setProcessIndex(index)}>
                      {process}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="btn-more">
                          <Image width={20} height={20} src="/image/ico-dot-menu.svg" alt="more" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="pr-[20px]">
                        <DropdownMenuItem onClick={() => {}}>
                          <Image width={20} height={20} src="/image/ico-restore.svg" alt="" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <Image width={20} height={20} src="/image/ico-trash-r.svg" alt="" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
              <Button
                className="btn-md btn-default"
                icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faPlus} />}
                text="Process"
                onClick={() => {}}
              />
            </div>
            <div className="mt-[30px] flex items-center justify-between">
              <h3 className="text-xl font-semibold">Number of Facilities in the Process</h3>
              <div className="flex h-[50px] w-[250px] items-center justify-between rounded-full border border-default-300 bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    if(numOfFacilitiesInProcess[terminalIndex][processIndex] - 1 < 0) return;
                    setNumOfFacilitiesInProcess(
                      numOfFacilitiesInProcess.map((numOfFacilities, tIndex) => {
                        if (tIndex === terminalIndex) {
                          return numOfFacilities.map((num, pIndex) => {
                            if (pIndex === processIndex) {
                              return num - 1;
                            }
                            return num;
                          });
                        }
                        return numOfFacilities;
                      })
                    );
                  }}
                >
                  <Image width={30} height={30} src="/image/ico-num-minus.svg" alt="-" />
                </button>
                <span>{numOfFacilitiesInProcess[terminalIndex][processIndex]}</span>
                <button
                  onClick={() => {
                    setNumOfFacilitiesInProcess(
                      numOfFacilitiesInProcess.map((numOfFacilities, tIndex) => {
                        if (tIndex === terminalIndex) {
                          return numOfFacilities.map((num, pIndex) => {
                            if (pIndex === processIndex) {
                              return num + 1;
                            }
                            return num;
                          });
                        }
                        return numOfFacilities;
                      })
                    );
                  }}
                >
                  <Image width={30} height={30} src="/image/ico-num-plus.svg" alt="+" />
                </button>
              </div>
            </div>
            <div className="setting-process-list">
              <div className="process-item">
                <div className="process-item-title">
                  <div className="flex items-center gap-[10px]">
                    Zone H
                    <button>
                      <img src="/image/ico-edit-title.svg" alt="edit" />
                    </button>
                  </div>
                  <button>
                    <FontAwesomeIcon className="icon-14" size="sm" icon={faAngleDown} />
                  </button>
                </div>

              </div>
            </div>            
          </div>
        </div>
      </div>
      <Canvas />;
      <div className="mt-[50px] flex justify-end">
        <Button
          className="btn-md btn-primary w-[120px]"
          icon={<Image width={20} height={20} src="/image/ico-re.svg" alt="" />}
          text="Update"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

export default SettingOperationPage;
