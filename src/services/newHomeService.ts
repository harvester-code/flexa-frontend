import { createAPIService } from '@/lib/axios';

const api = createAPIService('new-homes');

export const fetchNewHomeDashboard = ({
  scenarioId,
}: {
  scenarioId?: string;
}) => {
  if (!scenarioId) {
    throw new Error('scenarioId is required');
  }

  return api.get(`/${scenarioId}/dashboard`);
};
