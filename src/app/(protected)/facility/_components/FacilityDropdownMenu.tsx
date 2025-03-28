import { ChevronDown } from 'lucide-react';
import { Option } from '@/types/commons';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

export interface FacilityDropdownMenuProps {
  icon?: React.ReactNode;
  iconDirection?: 'right' | 'left';
  items: Option[];
  label: string;
  onSelect?: (item: Option) => void;
}

export default function FacilityDropdownMenu({ items, label, onSelect }: FacilityDropdownMenuProps) {
  const handleSelect = (item: Option) => {
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-10 min-w-64 justify-between rounded-none border-b-2 border-black pb-1 pl-0 pr-0 pt-0 text-3xl font-semibold shadow-none focus-visible:ring-0 [&_svg]:size-6'
          )}
        >
          <span>{label}</span> <ChevronDown />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className={cn('min-w-64')}>
        {items?.map((item) => (
          <DropdownMenuItem
            key={item.value}
            className="cursor-pointer justify-start hover:bg-accent-100"
            onClick={() => handleSelect(item)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
