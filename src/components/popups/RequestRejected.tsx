import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface RequestRejectedProps {
  open: boolean;
  onClose: () => void;
}

const RequestRejected: React.FC<RequestRejectedProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: 'bg-include',
      }}
    >
      <Image width={24} height={24} src="/image/popup/report_off.svg" alt="icon" className="popup-icon" />
      <DialogTitle>The request to access the solutino has been rejected.</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">
            The approval request sent to danny@datamarketing.co.kr was not approved. Please check the details and
            resubmit your request.
          </p>
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-lg btn-primary" onClick={onClose}>
            Resubmit Request
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestRejected;
