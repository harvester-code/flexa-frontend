import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';

interface LogOutProps {
  open: boolean;
  onClose: () => void;
}

const PopupContent: React.FC<LogOutProps> = ({ open, onClose }) => {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioMemo, setScenarioMemo] = useState('');
  const [locationAirport, setLocationAirport] = useState('');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: 'bg-include',
      }}
    >
      <img src="/image/popup/description.svg" alt="icon" className="popup-icon" />
      <DialogTitle className="!min-h-0">Create New Scenario</DialogTitle>
      <DialogContent>
        <p className="text mb-[20px] min-h-[40px]">Enter the name and memo for the new scenario.</p>
        <div className="popup-input-wrap">
          <form className="flex flex-col gap-[10px]">
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal"> Name</dt>
              <dd>
                <Input
                  type="text"
                  placeholder="e.g. ICN_T2_Terminal Expansion Scenario"
                  value={scenarioName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setScenarioName(e.target.value)
                  }
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setScenarioMemo(e.target.value)
                  }
                  className="input-rounded"
                />
              </dd>
            </dl>
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal">
                Simaulation location(Airport Level)
              </dt>
              <dd>
                <Input
                  type="text"
                  placeholder="e.g. Incheon Internationla Airport"
                  value={locationAirport}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocationAirport(e.target.value)
                  }
                  className="input-rounded"
                />
              </dd>
            </dl>
            <dl>
              <dt className="mb-[5px] pl-[10px] text-sm font-normal">
                Simulation location(Terminal Level)
              </dt>
              <dd>
                <select name="" id="" className="select w-full">
                  <option value="1">Terminal</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </dd>
            </dl>
          </form>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-primary" onClick={onClose}>
            Create
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupContent;
