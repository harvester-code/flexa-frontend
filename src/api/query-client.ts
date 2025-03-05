import { QueryClient, useMutation, useQueries, useQuery } from 'react-query';

export { useQuery, useQueries, useMutation };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});
