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
      <DialogTitle>Are you sure you want to delete ICN_T1_Scenario_Rev2?</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">
            Are you sure you want to delete that list? <br /> The deleted list can be checked in Trash Bin.
          </p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-red-line" onClick={onClose}>
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupContent;
