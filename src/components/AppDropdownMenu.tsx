import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

interface AppDropdownMenuProps {
  className?: string;
  icon?: React.ReactNode;
  iconDirection?: 'right' | 'left';
  items: string[];
  label: string;
  onSelect?: (item: string) => void;
}

export function AppDropdownMenu({
  className,
  icon,
  iconDirection = 'right',
  items,
  label,
  onSelect,
}: AppDropdownMenuProps) {
  const handleSelect = (item: string) => {
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn(className, 'h-10 rounded-full')}>
          {iconDirection === 'left' && icon}
          <span>{label}</span>
          {iconDirection === 'right' && icon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className={cn(className)}>
        {items.map((item, idx) => (
          <DropdownMenuItem
            key={idx}
            className="cursor-pointer justify-center hover:bg-accent-100"
            onClick={() => handleSelect(item)}
          >
            {item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
