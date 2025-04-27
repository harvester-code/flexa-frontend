import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface LogOutProps {
  open: boolean;
  onClose: () => void;
}

const PopupContent: React.FC<LogOutProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: '',
      }}
    >
      <DialogTitle>Deny Complete</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">The request has been successfully denied.</p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-lg btn-primary" onClick={onClose}>
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupContent;
