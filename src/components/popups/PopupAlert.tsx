import React from 'react';
import Image from 'next/image';
import { popModal, pushModal } from '@/contexts/ClientProviders';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

interface PopupAlertProps {
  content: React.ReactNode;
  title?: string;
  buttonPos?: ButtonProps;
  buttonNeg?: ButtonProps;
  iconPath?: string;
  onClose?: () => void;
  preset?: 'DEFAULT' | 'DELETE';
}

export class PopupAlert {
  static confirm(
    content: React.ReactNode,
    buttonText: string = 'Confirm',
    onClick?: () => void,
    title?: string
  ) {
    const modalId = pushModal({
      component: (
        <PopupComponent
          title={title}
          content={content}
          buttonPos={{ text: buttonText, onClick }}
          onClose={() => {
            popModal(modalId);
          }}
        />
      ),
    });
  }

  static delete(
    content: React.ReactNode,
    deleteButtonText: string = 'Delete',
    onDelete?: () => void,
    title?: string,
    cancelButtonText: string = 'Cancel',
    onCancel?: () => void
  ) {
    const modalId = pushModal({
      component: (
        <PopupComponent
          title={title}
          content={content}
          buttonPos={{
            text: deleteButtonText,
            onClick: onDelete,
            className: 'btn-sm border border-[#D92D20] text-[#D92D20]',
          }}
          buttonNeg={{ text: cancelButtonText, onClick: onCancel }}
          onClose={() => {
            popModal(modalId);
          }}
        />
      ),
    });
  }

  static custom(props: PopupAlertProps) {
    const modalId = pushModal({
      component: (
        <PopupComponent
          {...props}
          onClose={() => {
            popModal(modalId);
            if (props?.onClose) props.onClose();
          }}
        />
      ),
    });
  }
}

const PopupComponent: React.FC<PopupAlertProps> = ({
  title,
  content,
  iconPath,
  onClose,
  buttonPos,
  buttonNeg,
}) => {
  return (
    <Dialog
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        {iconPath && <Image width={16} height={16} src={iconPath} alt="icon" className="popup-icon" />}
        {title ? <DialogTitle>{title}</DialogTitle> : null}
        <div className="popup-contents mt-[14px] text-sm">
          <p className="text">{content}</p>
        </div>
        {buttonNeg || buttonPos ? (
          <div className="popup-btn-wrap mt-[14px] flex gap-x-[12px]">
            {buttonNeg ? (
              <button
                className={`flex-1 ${buttonNeg?.className || 'btn-sm btn-default'}`}
                onClick={() => {
                  buttonNeg?.onClick?.();
                  onClose?.();
                }}
                onFocus={(e) => {
                  e.target.blur();
                }}
              >
                {buttonNeg?.text}
              </button>
            ) : null}
            {buttonPos ? (
              <button
                className={`flex-1 ${buttonPos?.className || 'btn-sm btn-primary'}`}
                onClick={() => {
                  buttonPos?.onClick?.();
                  onClose?.();
                }}
                onFocus={(e) => {
                  e.target.blur();
                }}
              >
                {buttonPos?.text}
              </button>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PopupComponent;
