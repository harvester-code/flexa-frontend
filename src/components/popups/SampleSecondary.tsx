import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface SecondaryPopupProps {
  open: boolean;
  onClose: () => void;
  onSecondaryPopup: () => void;
}

const SecondaryPopup: React.FC<SecondaryPopupProps> = ({ open, onClose, onSecondaryPopup }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: '',
      }}
    >
      <DialogTitle>Title...</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-primary" onClick={onSecondaryPopup}>
            open popup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecondaryPopup;
