import React, { useState } from 'react';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import Input from '@/components/Input';

interface ProcessProps {
  open: boolean;
  onClose: () => void;
}

const Process: React.FC<ProcessProps> = ({ open, onClose }) => {
  const [firstProcess, setFirstProcess] = useState('Check-In');
  const [secondProcess, setSecondProcess] = useState('Boarding Pass');
  const [thirdProcess, setThirdProcess] = useState('');
  const [fourthProcess, setFourthProcess] = useState('');
  return (
    <Dialog open={open} onClose={onClose}>
      <IconButton aria-label="close" onClick={onClose} className="ico-popup-close">
        <CloseIcon />
      </IconButton>

      <DialogContent>
        <DialogTitle className="!mb-0 !min-h-0">Process</DialogTitle>
        <p className="text !pb-[5px] pt-[5px]">Choose your own process</p>
        <hr />
        <ul className="mt-[5px] flex w-full flex-col border-b border-default-200 pb-[5px]">
          <li className="flex h-[40px] w-full items-center justify-start gap-[8px] px-[10px]">
            <span className="w-[50px] flex-none text-sm font-semibold">Step. 1</span>
            <Input
              type="text"
              placeholder="Enter the Process"
              value={firstProcess}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstProcess(e.target.value)}
              className="input-default input-transparent !h-[30px]"
            />
          </li>
          <li className="flex h-[40px] w-full items-center justify-start gap-[8px] px-[10px]">
            <span className="w-[50px] flex-none text-sm font-semibold">Step. 2</span>
            <Input
              type="text"
              placeholder="Enter the Process"
              value={secondProcess}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecondProcess(e.target.value)}
              className="input-default input-transparent !h-[30px]"
            />
          </li>
          <li className="flex h-[40px] w-full items-center justify-start gap-[8px] px-[10px]">
            <span className="w-[50px] flex-none text-sm font-semibold">Step. 3</span>
            <Input
              type="text"
              placeholder="Enter the Process"
              value={thirdProcess}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThirdProcess(e.target.value)}
              className="input-default input-transparent !h-[30px]"
            />
          </li>
          <li className="flex h-[40px] w-full items-center justify-start gap-[8px] px-[10px]">
            <span className="w-[50px] flex-none text-sm font-semibold">Step. 4</span>
            <Input
              type="text"
              placeholder="Enter the Process"
              value={fourthProcess}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFourthProcess(e.target.value)}
              className="input-default input-transparent !h-[30px]"
            />
          </li>
        </ul>
        <div className="mt-[5px] flex flex-col gap-[5px]">
          <button className="flex h-[40px] w-full justify-start gap-[8px] px-[10px] text-sm">
            <img src="/image/ico-process-add.svg" alt="add" />
            Add
          </button>
          <button className="flex h-[40px] w-full justify-start gap-[8px] px-[10px] text-sm">
            <img src="/image/ico-process-apply.svg" alt="apply" />
            Apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Process;
