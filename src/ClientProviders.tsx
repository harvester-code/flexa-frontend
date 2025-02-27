'use client';

import React, { useEffect } from 'react';
import RecoilBase from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { QueryClientProvider } from "react-query";
import { queryClient } from '@/api/query-client';
import { loadFromStorage } from './store';

export default function ClientProviders({ children }) {
  useEffect(() => {
    loadFromStorage();
  }, []);
  return (
    <RecoilBase.RecoilRoot>
      <RecoilNexus />
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </RecoilBase.RecoilRoot>
  );
}
