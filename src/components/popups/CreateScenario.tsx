import React, { useState } from 'react';
import Image from 'next/image';
import { popModal, pushModal } from '@/app/provider';
import { createScenario } from '@/services/simulations';
import { useUser } from '@/queries/userQueries';
import Input from '@/components/Input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { PopupAlert } from './PopupAlert';

interface PopupProps {
  onCreate: (simulationId: string) => void;
  onClose?: () => void;
}

export const PushCreateScenarioPopup = (props: PopupProps) => {
  const modalId = pushModal({
    component: (
      <PopupComponent
        {...props}
        onClose={() => {
          popModal(modalId);
          if (props?.onClose) props.onClose();
        }}
      />
    ),
  });
};

const PopupComponent: React.FC<PopupProps> = ({ onCreate, onClose }) => {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioMemo, setScenarioMemo] = useState('');
  const [locationAirport, setLocationAirport] = useState('');
  const [terminal, setTerminal] = useState('');
  const { data: userInfo } = useUser();

  return (
    <Dialog
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
    >
      <DialogContent className="w-[400px] min-w-[400px] pt-[34px]" aria-describedby={undefined}>
        <Image width={16} height={16} src="/image/popup/description.svg" alt="icon" className="popup-icon" />
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
                PopupAlert.confirm('Please enter the scenario name.', 'confirm', () => {}, 'Test');
                return;
              }
              if (!terminal) {
                PopupAlert.confirm('Please select the simulation location.');
                return;
              }
              if (!scenarioMemo) {
                PopupAlert.confirm('Please enter the memo.');
                return;
              }
              createScenario({
                simulation_name: scenarioName,
                terminal,
                memo: scenarioMemo,
                editor: userInfo?.fullName || '',
                group_id: String(userInfo?.groupId),
              })
                .then(({ data }) => {
                  if (data?.scenario_id) {
                    onCreate(data?.scenario_id);
                    onClose?.();
                  } else PopupAlert.confirm('Failed to create the scenario.');
                })
                .catch((e) => {
                  console.log(e);
                  PopupAlert.confirm('Failed to create the scenario.');
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

export default PopupComponent;
