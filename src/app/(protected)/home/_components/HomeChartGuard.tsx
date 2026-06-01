import { type ReactNode } from 'react';
import { ScenarioData } from '@/types/homeTypes';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';

interface HomeChartGuardProps {
  scenario: ScenarioData | null;
  isLoading: boolean;
  data?: unknown;
  children: ReactNode;
}

function HomeChartGuard({ scenario, isLoading, data, children }: HomeChartGuardProps) {
  if (!scenario) return <HomeNoScenario />;
  if (isLoading) return <HomeLoading />;
  if (data !== undefined && !data) return <HomeNoData />;
  return <>{children}</>;
}

export default HomeChartGuard;
