import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface LogOutProps {
  open: boolean;
  onClose: () => void;
}

const LogOut: React.FC<LogOutProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: '',
      }}
    >
      <DialogTitle>Do you want to log out from the 2018 MacBook Pro 15-inch?</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">Logging out will end your access on this device</p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-primary" onClick={onClose}>
            Log Out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogOut;
