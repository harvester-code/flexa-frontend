import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface LogOutCompleteProps {
  open: boolean;
  onClose: () => void;
}

const LogOutComplete: React.FC<LogOutCompleteProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: '',
      }}
    >
      <DialogTitle>Log Out Complete</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">You have been successfully logged out from this device.</p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-lg btn-primary" onClick={onClose}>
            Log Out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogOutComplete;
