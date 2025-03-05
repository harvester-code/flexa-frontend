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
      <DialogTitle>Are you sure you want to deny this Request?</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">Are you sure you want to deny “Danny Park’s Request” for accessing the pages?</p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-red-line" onClick={onClose}>
            Deny
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupContent;
