import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { popModal, pushModal } from '@/app/provider';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

interface SuccessProps {
  title: string;
  message: string;
  buttonText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

export const PushSuccessPopup = (props: SuccessProps) => {
  const modalId = pushModal({
    component: (
      <SuccessComponent
        {...props}
        onClose={() => {
          popModal(modalId);
          if (props?.onClose) props.onClose();
        }}
      />
    ),
  });
};

const SuccessComponent: React.FC<SuccessProps> = ({ title, message, buttonText = 'Confirm', onConfirm, onClose }) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose?.();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="w-full max-w-md pt-8" aria-describedby={undefined}>
        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <DialogTitle className="!mb-0 !min-h-0">{title}</DialogTitle>
        </div>

        <p className="mb-6 text-sm text-default-500">{message}</p>

        <div className="flex justify-end">
          <Button className="px-8" onClick={handleConfirm}>
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessComponent;
