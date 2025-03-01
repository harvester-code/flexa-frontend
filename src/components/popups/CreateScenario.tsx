import { createScenario } from '@/api/simulations';
import { createContextMenuScope } from '@radix-ui/react-context-menu';
import React, { useState } from 'react';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { useUserInfo } from '@/store/zustand';

interface ICreateScenarioData {
  name: string;
  memo: string;
  airport: string;
  terminal: string;
}
interface LogOutProps {
  open: boolean;
  onCreate: (simulationId: string) => void;
  onClose: () => void;
}

const PopupContent: React.FC<LogOutProps> = ({ open, onCreate, onClose }) => {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioMemo, setScenarioMemo] = useState('');
  const [locationAirport, setLocationAirport] = useState('');
  const [terminal, setTerminal] = useState('');
  const { userInfo } = useUserInfo();
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="w-[400px] min-w-[400px] pt-[34px]">
        <img src="/image/popup/description.svg" alt="icon" className="popup-icon" />
        <DialogTitle className="!min-h-0">Create New Scenario</DialogTitle>
        <p className="text mb-[8px] min-h-[40px]">Enter the name and memo for the new scenario.</p>
        <div className="popup-input-wrap">
          <form className="flex flex-col gap-[12px]">
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal"> Name</dt>
              <dd>
                <Input
                  type="text"
                  placeholder="e.g. ICN_T2_Terminal Expansion Scenario"
                  value={scenarioName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScenarioName(e.target.value)}
                  className="input-rounded"
                />
              </dd>
            </dl>
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal"> Memo</dt>
              <dd>
                <Input
                  type="text"
                  placeholder="e.g. Simulation for ICN T2 Terminal Expansion"
                  value={scenarioMemo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScenarioMemo(e.target.value)}
                  className="input-rounded"
                />
              </dd>
            </dl>
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal">Simaulation location(Airport Level)</dt>
              <dd>
                <Input
                  type="text"
                  placeholder="e.g. Incheon Internationla Airport"
                  value={locationAirport}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationAirport(e.target.value)}
                  className="input-rounded"
                />
              </dd>
            </dl>
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal">Simulation location(Terminal Level)</dt>
              <dd>
                <select name="" id="" className="select w-full" onChange={(e) => setTerminal(e.target.value)}>
                  <option value="">Terminal</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                </select>
              </dd>
            </dl>
          </form>
        </div>
        <div className="popup-btn-wrap mt-[8px] flex">
          <button className="btn-sm btn-default flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-sm btn-primary ml-[12px] flex-1"
            onClick={() => {
              if (!scenarioName) {
                alert('Please enter the scenario name.');
                return;
              }
              if (!terminal) {
                alert('Please select the simulation location.');
                return;
              }
              if (!scenarioMemo) {
                alert('Please enter the memo.');
                return;
              }
              createScenario({
                simulation_name: scenarioName,
                terminal,
                note: scenarioMemo,
                editor: userInfo?.fullName || '',
              })
                .then(({ data }) => {
                  if (data?.simulation_id) {
                    onCreate(data?.simulation_id);
                    onClose();
                  } else alert('Failed to create the scenario.');
                })
                .catch((e) => {
                  console.log(e);
                  alert('Failed to create the scenario.');
                });
            }}
          >
            Create
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupContent;
