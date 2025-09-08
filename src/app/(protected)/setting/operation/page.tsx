'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, EllipsisVertical, Minus, PencilLineIcon, Plus, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

const Canvas = dynamic(() => import('./_components/Canvas'), { ssr: false });

function SettingOperationPage() {
  const [airportName, setAirportName] = useState('');
  const [terminals, setTerminals] = useState(['Terminal 1']);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [processes, setProcesses] = useState<string[][]>([['Check-In']]);
  const [processIndex, setProcessIndex] = useState(0);
  const [numOfFacilitiesInProcess, setNumOfFacilitiesInProcess] = useState<number[][]>([[0]]);
  return (
    <div className="mx-auto max-w-page px-page-x pb-page-b">
      <div className="location">
        <span>Settings</span>
        <span>Operation Settings</span>
      </div>
      <div className="mt-[30px] flex flex-col border-b border-input pb-[20px]">
        <h2 className="title-sm">Operation Settings</h2>
        <p className="text-sm text-muted-foreground">
          Enter the current facility information for the airport to set the default values that apply to all members.
        </p>
      </div>
      <div className="mt-[25px] flex h-[40px] items-center gap-[10px]">
        <span className="flex-shrink-0 text-lg font-semibold text-default-900">Airport Name:</span>
        <input
          id="title"
          type="text"
          placeholder="Enter Name"
          value={airportName}
          onChange={(e) => setAirportName((e.target as HTMLInputElement).value)}
          className="h-[40px] w-[150px] bg-transparent text-lg font-semibold text-default-900 !outline-none"
        />
        <Button variant="link">
          <PencilLineIcon />
        </Button>
      </div>
      <div className="mt-[40px] flex justify-between gap-[20px]">
        <div className="tab-setting">
          {terminals.map((terminal, index) => (
            <div key={`tab${index}`} className={`tab ${terminalIndex === index ? 'active' : ''}`}>
              <Button variant="link" onClick={() => setTerminalIndex(index)}>
                {terminal}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="btn-more">
                    <EllipsisVertical className="!size-5" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="pr-[20px]">
                  <DropdownMenuItem onClick={() => {}}>
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Trash2 className="size-5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="default" onClick={() => {}}>
          <Plus className="size-4" />
          Terminal
        </Button>
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
                  <EllipsisVertical className="!size-5" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="pr-[20px]">
                <DropdownMenuItem onClick={() => {}}>
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Trash2 className="size-5" />
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
                    <Button variant="link" onClick={() => setProcessIndex(index)}>
                      {process}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="btn-more">
                          <EllipsisVertical className="!size-5" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="pr-[20px]">
                        <DropdownMenuItem onClick={() => {}}>
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <Trash2 className="size-5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="default" onClick={() => {}}>
                <Plus className="size-4" />
                Process
              </Button>
            </div>
            <div className="mt-[30px] flex items-center justify-between">
              <h3 className="text-lg font-semibold">Number of Facilities in the Process</h3>
              <div className="flex h-[50px] w-[250px] items-center justify-between rounded-full border border-input bg-white p-[10px] text-sm">
                <button
                  onClick={() => {
                    if (numOfFacilitiesInProcess[terminalIndex][processIndex] - 1 < 0) return;
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
                  <Minus className="h-7 w-7" />
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
                  <Plus className="h-7 w-7" />
                </button>
              </div>
            </div>
            <div className="setting-process-list">
              <div className="process-item">
                <div className="process-item-title">
                  <div className="flex items-center gap-[10px]">
                    Zone H
                    <Button variant="link">
                      <PencilLineIcon />
                    </Button>
                  </div>
                  <Button variant="link">
                    <ChevronDown />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Canvas />
      <div className="mt-[50px] flex justify-end">
        <Button variant="primary" size="default" onClick={() => {}}>
          <RefreshCw className="mr-2 h-5 w-5" />
          Update
        </Button>
      </div>
    </div>
  );
}

export default SettingOperationPage;
