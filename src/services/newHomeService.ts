import { createAPIService } from '@/lib/axios';

const api = createAPIService('new-homes');

export const fetchFacilityCharts = ({
  scenarioId,
  intervalMinutes = 60,
}: {
  scenarioId?: string;
  intervalMinutes?: number;
}) => {
  if (!scenarioId) {
    throw new Error('scenarioId is required');
  }

  return api.get(`/${scenarioId}/facility-charts`, {
    params: {
      interval_minutes: intervalMinutes,
    },
  });
};
