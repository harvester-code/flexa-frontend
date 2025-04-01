import React, { useState } from 'react';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

interface LogOutProps {
  open: boolean;
  onClose: () => void;
}

const AnalysisPopup: React.FC<LogOutProps> = ({ open, onClose }) => {
  const [activeButton, setActiveButton] = useState('Home');

  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: 'bg-include',
      }}
    >
      <IconButton aria-label="close" onClick={onClose} className="ico-popup-close">
        <CloseIcon />
      </IconButton>
      <Image width={24} height={24} src="/image/popup/file_export.svg" alt="icon" className="popup-icon" />
      <DialogTitle className="!min-h-0">Go to the desired analysis page</DialogTitle>
      <DialogContent>
        <p className="text mb-[20px] min-h-[40px]">Click on the analytics page you want to go to</p>
        <ul className="checkbtn-list">
          <li>
            <button
              className={activeButton === 'Home' ? 'active' : ''}
              onClick={() => handleButtonClick('Home')}
            >
              <p className="checkbtn"></p>
              <dl>
                <dt>Home</dt>
                <dd>Overall operational status within the airport</dd>
              </dl>
            </button>
          </li>
          <li>
            <button
              className={activeButton === 'Security' ? 'active' : ''}
              onClick={() => handleButtonClick('Security')}
            >
              <p className="checkbtn"></p>
              <dl>
                <dt>Security</dt>
                <dd>Passenger flow and security screening analysis.</dd>
              </dl>
            </button>
          </li>
          <li>
            <button
              className={activeButton === 'Check-In' ? 'active' : ''}
              onClick={() => handleButtonClick('Check-In')}
            >
              <p className="checkbtn"></p>
              <dl>
                <dt>Check-In</dt>
                <dd>Passenger flow at Check-In</dd>
              </dl>
            </button>
          </li>
          <li>
            <button
              className={activeButton === 'Passenger Flow' ? 'active' : ''}
              onClick={() => handleButtonClick('Passenger Flow')}
            >
              <p className="checkbtn"></p>
              <dl>
                <dt>Passenger Flow</dt>
                <dd>Overall Passenger movement trends.</dd>
              </dl>
            </button>
          </li>
        </ul>
        <div className="popup-btn-wrap">
          <button className="btn-lg btn-primary" onClick={onClose}>
            Go to the selected page
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisPopup;
