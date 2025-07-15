import { useState } from 'react';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { cn } from '@/lib/utils';

interface TheRadioGroupProps {
  items?: {
    value: string;
    label: string;
    description?: string;
  }[];
  defaultValue?: string;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}

export default function TheRadioGroup({ defaultValue, selectedValue, items, onValueChange }: TheRadioGroupProps) {
  const [internalValue, setInternalValue] = useState(selectedValue || defaultValue);

  const handleValueChange = (value: string) => {
    // alert(`Selected value: ${value}`);

    setInternalValue(value);
    onValueChange?.(value);
  };

  const currentValue = selectedValue || internalValue;

  return (
    <RadioGroup className="flex" defaultValue={defaultValue} value={currentValue} onValueChange={handleValueChange}>
      {items?.map((item) => (
        <div
          key={item.value}
          className={cn(
            'flex-1 cursor-pointer rounded-lg px-2 py-4',
            item.value === currentValue ? 'border border-brand' : 'border border-default-200'
          )}
          onClick={() => handleValueChange(item.value)}
        >
          <div className="flex items-center">
            <RadioGroupItem value={item.value} id={item.value} />
            <Label htmlFor={item.value} className="ml-2 cursor-pointer">
              {item.label}
            </Label>
          </div>

          {item.description && <p className="ml-6 mt-1 text-sm text-gray-500">{item.description}</p>}
        </div>
      ))}
    </RadioGroup>
  );
}
