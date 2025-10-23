import React, { useState } from "react";
import { createScenario } from "@/services/simulationService";
import { useUser } from "@/queries/userQueries";
import { Button } from "@/components/ui/Button";
import { PlaneTakeoff } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/ui/Spinner";
import AirportSelector from "../[id]/_components/flights/AirportSelector";

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
  {
    key: "scenarioName",
    label: "Scenario Name",
    placeholder: "T2 Expansion",
    required: true,
  },
  { key: "terminal", label: "Terminal", placeholder: "T1", required: false },
  { key: "memo", label: "Memo", placeholder: "Description", required: false },
];

const CreateScenario: React.FC<CreateScenarioProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState<FormData>({
    scenarioName: "",
    airport: "",
    terminal: "",
    memo: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const { data: userInfo } = useUser();
  const { toast } = useToast();

  const updateField = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // 값이 변경되면 해당 필드의 에러 제거
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    // Scenario Name만 필수 검증
    if (!formData.scenarioName.trim()) {
      newErrors.scenarioName = "Scenario Name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const resetForm = () => {
    setFormData({
      scenarioName: "",
      airport: "",
      terminal: "",
      memo: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await createScenario({
        name: formData.scenarioName,
        airport: formData.airport.trim() || null,
        terminal: formData.terminal.trim() || null,
        editor: userInfo?.fullName || "",
        memo: formData.memo.trim() || null,
      });

      if (data?.scenario_id) {
        toast({
          title: "Creation Complete",
          description: "The scenario has been created successfully.",
        });
        onCreate(data.scenario_id);
        resetForm();
        onClose?.();
      } else {
        toast({
          title: "Creation Failed",
          description: "Failed to create the scenario.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create the scenario.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <PlaneTakeoff className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle>Create New Scenario</DialogTitle>
              <DialogDescription>
                Please fill in the scenario details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          {INPUT_FIELDS.map((field) => (
            <React.Fragment key={field.key}>
              <div className="grid gap-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type="text"
                  placeholder={field.placeholder}
                  value={formData[field.key]}
                  onChange={(e) =>
                    updateField(field.key, (e.target as HTMLInputElement).value)
                  }
                  onKeyDown={handleKeyDown}
                  className={errors[field.key] ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors[field.key] && (
                  <p className="text-sm text-red-500">{errors[field.key]}</p>
                )}
              </div>

              {field.key === "scenarioName" && (
                <div className="grid gap-2">
                  <Label>Airport</Label>
                  <AirportSelector
                    value={formData.airport}
                    onChange={(value) => updateField("airport", value)}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading} className="min-w-24 overflow-hidden">
            <span className="flex items-center justify-center">
              {isLoading && (
                <Spinner size={16} className="mr-2 shrink-0 text-white" />
              )}
              <span className="truncate">Create</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScenario;
