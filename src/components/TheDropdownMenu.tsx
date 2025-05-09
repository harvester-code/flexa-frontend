import { Option } from '@/types/commons';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

export interface TheDropdownMenuProps {
  className?: string;
  icon?: React.ReactNode;
  iconDirection?: 'right' | 'left';
  items: Option[];
  label: string;
  onSelect?: (item: Option) => void;
}

export default function TheDropdownMenu({
  className,
  icon,
  iconDirection = 'right',
  items,
  label,
  onSelect,
}: TheDropdownMenuProps) {
  const handleSelect = (item: Option) => {
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn('h-10 justify-between rounded-full', className)}>
          {iconDirection === 'left' && icon}
          <span>{label}</span>
          {iconDirection === 'right' && icon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className={cn(className)}>
        {items?.map((item) => (
          <DropdownMenuItem
            key={item.value}
            className="cursor-pointer justify-center hover:bg-accent-100"
            onClick={() => handleSelect(item)}
          >
            {item?.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
