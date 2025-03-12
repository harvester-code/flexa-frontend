import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface SuccessfulllyUpdatedProps {
  open: boolean;
  onClose: () => void;
}

const SuccessfulllyUpdated: React.FC<SuccessfulllyUpdatedProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: '',
      }}
    >
      <DialogTitle>Successfullly updated</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">
            Your password has been successfully updated. <br /> Please log in with your new password.
          </p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-lg btn-primary" onClick={onClose}>
            Log in Again
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessfulllyUpdated;
