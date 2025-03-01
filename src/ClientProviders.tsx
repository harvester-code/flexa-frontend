'use client';

import { queryClient } from '@/api/query-client';
import React, { useEffect } from 'react';
import { QueryClientProvider } from 'react-query';

export default function ClientProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
