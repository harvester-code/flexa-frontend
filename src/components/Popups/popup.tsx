import React from 'react';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

interface CustomPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  iconPath?: string;
  className?: string;
}

const CustomPopup: React.FC<CustomPopupProps> = ({ open, onClose, title, content, iconPath, className }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: className || '',
      }}
    >
      <IconButton aria-label="close" onClick={onClose} className="ico-popup-close">
        <CloseIcon />
      </IconButton>

      {iconPath && <Image src={iconPath} alt="icon" className="popup-icon" />}
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <div className="popup-contents">
          <p className="text">{content}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPopup;
