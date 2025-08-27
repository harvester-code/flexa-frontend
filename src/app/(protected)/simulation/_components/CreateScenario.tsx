import React, { useState } from 'react';
import Image from 'next/image';
import { popModal, pushModal } from '@/app/provider';
import { createScenario } from '@/services/simulationService';
import { useUser } from '@/queries/userQueries';
import { PopupAlert } from '@/components/PopupAlert';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { PushSuccessPopup } from './Success';

interface PopupProps {
  onCreate: (simulationId: string) => void;
  onClose?: () => void;
}

interface FormData {
  scenarioName: string;
  airport: string;
  terminal: string;
  memo: string;
}

interface InputField {
  key: keyof FormData;
  label: string;
  placeholder: string;
  required: boolean;
}

const INPUT_FIELDS: InputField[] = [
  { key: 'scenarioName', label: 'Scenario Name', placeholder: 'T2 Expansion', required: true },
  { key: 'airport', label: 'Airport', placeholder: 'ICN', required: true },
  { key: 'terminal', label: 'Terminal', placeholder: 'T1', required: true },
  { key: 'memo', label: 'Memo', placeholder: 'Description', required: true },
];

export const PushCreateScenarioPopup = (props: PopupProps) => {
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
};

const PopupComponent: React.FC<PopupProps> = ({ onCreate, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    scenarioName: '',
    airport: '',
    terminal: '',
    memo: '',
  });
  const { data: userInfo } = useUser();

  const updateField = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): string | null => {
    for (const field of INPUT_FIELDS) {
      if (field.required && !formData[field.key].trim()) {
        return `Please enter the ${field.label.toLowerCase()}.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      PopupAlert.confirm(validationError, 'confirm', () => {}, 'Input Required');
      return;
    }

    try {
      const { data } = await createScenario({
        name: formData.scenarioName,
        airport: formData.airport,
        terminal: formData.terminal,
        memo: formData.memo,
        editor: userInfo?.fullName || '',
      });

      if (data?.scenario_id) {
        PushSuccessPopup({
          title: 'Creation Complete',
          message: 'The scenario has been created successfully.',
          onConfirm: () => {
            onCreate(data.scenario_id);
            onClose?.();
          },
        });
      } else {
        PopupAlert.confirm('Failed to create the scenario.');
      }
    } catch (error) {
      console.error(error);
      PopupAlert.confirm('Failed to create the scenario.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="w-full max-w-lg pt-8" aria-describedby={undefined}>
        <DialogTitle className="mb-4 flex items-center gap-3">
          <Image width={20} height={20} src="/image/popup/description.svg" alt="icon" className="size-5" />
          <span className="!mb-0 !min-h-0">Create New Scenario</span>
        </DialogTitle>

        <p className="mb-2 min-h-5 text-sm text-default-500">Please fill in the scenario details.</p>

        <div className="popup-input-wrap">
          <form className="flex flex-col gap-3">
            {INPUT_FIELDS.map((field) => (
              <dl key={field.key}>
                <dt className="mb-1 pl-2.5 text-sm font-normal">{field.label}</dt>
                <dd>
                  <Input
                    variant="custom"
                    type="text"
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="h-10 rounded-full border border-input"
                  />
                </dd>
              </dl>
            ))}
          </form>
        </div>

        <div className="popup-btn-wrap mt-2 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupComponent;
