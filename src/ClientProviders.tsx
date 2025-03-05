'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from 'react-query';
import { queryClient } from '@/api/query-client';

export default function ClientProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
