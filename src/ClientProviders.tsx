'use client';

import React from 'react';
import RecoilBase from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { QueryClientProvider } from "react-query";
import { queryClient } from '@/lib/react-query';

export default function ClientProviders({ children }) {
  return (
    <RecoilBase.RecoilRoot>
      <RecoilNexus />
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </RecoilBase.RecoilRoot>
  );
}
