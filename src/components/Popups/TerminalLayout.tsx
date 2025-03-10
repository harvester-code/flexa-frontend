import React from 'react';
import Image from 'next/image';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

interface TerminalLayoutProps {
  open: boolean;
  onClose: () => void;
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle className="!min-h-0">Terminal Layout</DialogTitle>
      <DialogContent>
        <p className="text mb-[20px] h-[40px]">Click on the analytics page you want to go to</p>
        <button className="flex w-full flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 p-[20px] py-[30px]">
          <p>
            <Image width={40} height={40} src="/image/ico-cloud.svg" alt="upload" className="w-[40px]" />
          </p>
          <p className="mt-[10px] text-xs">
            <span className="text-base font-semibold leading-none text-accent-700">Click to Upload</span>
            or Drag & Drop
          </p>
          <p className="text-xs leading-none">SVG, PNG, JPG or GIF (max. 800x400px)</p>
        </button>
        <div className="mt-[10px] flex w-full flex-col items-center justify-center rounded-md border border-default-200 p-[15px] py-[20px]">
          <div className="flex w-full items-start justify-between">
            <div className="flex items-center gap-[20px]">
              <Image width={24} height={24} src="/image/ico-file-csv.png" alt="terminal" />
              <dl className="flex flex-col gap-[10px] text-sm">
                <dt className="font-semibold leading-none text-default-900">T1_Departure_Floor.svg</dt>
                <dd className="leading-none">4.2 MB</dd>
              </dl>
            </div>

            <button>
              <Image width={20} height={20} src="/image/ico-trash.svg" alt="trash" />
            </button>
          </div>
          <div className="progress-bar !mt-[20px]">
            <div className="progress-bar-inner">
              <p style={{ width: '100%' }}></p>
            </div>
            <p>100%</p>
          </div>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-primary">Upload</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TerminalLayout;
