import React from 'react';
import Image from 'next/image';
import { popModal, pushModal } from '@/app/provider';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'btn-default'
    | 'btn-primary'
    | 'btn-gradient'
    | 'btn-secondary'
    | 'btn-tertiary'
    | 'btn-red-line'
    | 'btn-green-line'
    | 'btn-delete'
    | 'btn-link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'btn-sm' | 'btn-md' | 'btn-lg';
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
  static confirm(content: React.ReactNode, buttonText: string = 'Confirm', onClick?: () => void, title?: string) {
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
            variant: 'btn-red-line',
            size: 'btn-sm',
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

const PopupComponent: React.FC<PopupAlertProps> = ({ title, content, iconPath, onClose, buttonPos, buttonNeg }) => {
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
              <Button
                className={`flex-1 ${buttonNeg?.className || ''}`}
                variant={buttonNeg?.variant || 'btn-default'}
                size={buttonNeg?.size || 'btn-sm'}
                onClick={() => {
                  buttonNeg?.onClick?.();
                  onClose?.();
                }}
                onFocus={(e) => {
                  e.currentTarget.blur();
                }}
              >
                {buttonNeg?.text}
              </Button>
            ) : null}
            {buttonPos ? (
              <Button
                className={`flex-1 ${buttonPos?.className || ''}`}
                variant={buttonPos?.variant || 'btn-primary'}
                size={buttonPos?.size || 'btn-sm'}
                onClick={() => {
                  buttonPos?.onClick?.();
                  onClose?.();
                }}
                onFocus={(e) => {
                  e.currentTarget.blur();
                }}
              >
                {buttonPos?.text}
              </Button>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PopupComponent;
