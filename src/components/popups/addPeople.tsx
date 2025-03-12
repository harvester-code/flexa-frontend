import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import Checkbox from '@/components/Checkbox';

interface AddPeopleProps {
  open: boolean;
  onClose: () => void;
}

const AddPeople: React.FC<AddPeopleProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [history, setHistory] = useState(false);
  const [noHistory, setNoHistory] = useState(false);

  const handleHistoryChange = (checked: boolean) => {
    setHistory(checked);
    if (checked) {
      setNoHistory(false);
    }
  };

  const handleNoHistoryChange = (checked: boolean) => {
    setNoHistory(checked);
    if (checked) {
      setHistory(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle className="!min-h-0">Add another account</DialogTitle>

      <DialogContent>
        <hr />
        <div className="mt-[5px] px-[10px] py-[8px]">
          <input
            id="email"
            type="text"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full !outline-none"
          />
        </div>
        <div className="px-[10px]">
          <Checkbox
            id="check01"
            label={<span className="text-base">Don’t include chat history</span>}
            checked={history}
            onChange={(e) => handleHistoryChange(e.target.checked)}
            className="checkbox text-sm"
          />
        </div>
        <div className="mt-[5px] px-[10px]">
          <Checkbox
            id="check02"
            label={<span className="text-base">Include all chat history</span>}
            checked={noHistory}
            onChange={(e) => handleNoHistoryChange(e.target.checked)}
            className="checkbox text-sm"
          />
        </div>
        <div className="popup-btn-wrap">
          <button className="btn-sm btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-primary">Add</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPeople;
