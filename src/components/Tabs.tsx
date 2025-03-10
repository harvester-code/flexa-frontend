import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import styles from './Tabs.module.css';

interface AppTabsProps {
  tabs: { label: string; value: string }[];
  className?: string;
  children?: React.ReactNode;
}

function AppTabs({ tabs, className, children }: AppTabsProps) {
  return (
    <Tabs defaultValue={tabs[0].value} className={cn(styles['tab-setting'], className)}>
      <TabsList className={cn(styles['tab'])}>
        {tabs &&
          tabs.map((t) => (
            <TabsTrigger className={cn(styles['tab-btn'])} value={t.value} key={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export default AppTabs;
