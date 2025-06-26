import { LoaderCircle } from 'lucide-react';

interface TabNavigationButtonsProps {
  buttons: {
    loading?: boolean;
    label: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    onClick: () => void;
  }[];
}

const TabNavigationButtons = ({ buttons }: TabNavigationButtonsProps) => {
  // Set default values
  buttons = buttons.map((btn) => ({
    ...btn,
    loading: btn.loading || false,
    iconPosition: btn.iconPosition || 'right',
  }));

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 flex items-center justify-between">
      {buttons.map((btn, index) => (
        <button
          key={index}
          className="flex min-h-10 min-w-52 items-center rounded-full border border-default-200 bg-white px-3.5 text-default-700 shadow-[inset_0_-2px_0_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.05)] hover:bg-default-50"
          onClick={btn.onClick}
        >
          {btn.iconPosition === 'left' &&
            (btn.loading ? <LoaderCircle className="animate-spin" /> : <span>{btn.icon}</span>)}

          <span className="flex-1">{btn.label}</span>

          {btn.iconPosition === 'right' &&
            (btn.loading ? <LoaderCircle className="animate-spin" /> : <span>{btn.icon}</span>)}
        </button>
      ))}
    </div>
  );
};

export default TabNavigationButtons;
