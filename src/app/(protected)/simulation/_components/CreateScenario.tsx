import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { createScenario } from '@/services/simulationService';
import { useUser } from '@/queries/userQueries';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';

interface CreateScenarioProps {
  open: boolean;
  onClose: () => void;
  onCreate: (simulationId: string) => void;
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

const CreateScenario: React.FC<CreateScenarioProps> = ({ open, onClose, onCreate }) => {
  const [formData, setFormData] = useState<FormData>({
    scenarioName: '',
    airport: '',
    terminal: '',
    memo: '',
  });
  const { data: userInfo } = useUser();
  const { toast } = useToast();

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
      toast({
        title: 'Input Required',
        description: validationError,
        variant: 'destructive',
      });
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
        toast({
          title: 'Creation Complete',
          description: 'The scenario has been created successfully.',
        });
        onCreate(data.scenario_id);
        onClose?.();
      } else {
        toast({
          title: 'Creation Failed',
          description: 'Failed to create the scenario.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create the scenario.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Scenario</DialogTitle>
          <DialogDescription>Please fill in the scenario details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {INPUT_FIELDS.map((field) => (
            <div key={field.key} className="grid gap-3">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type="text"
                placeholder={field.placeholder}
                value={formData[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScenario;
