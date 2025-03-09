import { QueryClient, useMutation, useQueries, useQuery } from '@tanstack/react-query';

export { useQuery, useQueries, useMutation };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});
