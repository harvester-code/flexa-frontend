'use client';

import React from 'react';
import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { APIProvider } from '@vis.gl/react-google-maps';
import { create } from 'zustand';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// ====================================================================
interface IModalProps {
  component: React.ReactNode;
}

interface IModalData extends IModalProps {
  id: string;
}

const _modalStack: IModalData[] = [];

const useModalTrigger = create<{ timestamp: number }>((set) => ({
  timestamp: Date.now(),
  trigger: () => set({ timestamp: Date.now() }),
}));

const _trigger = () => {
  useModalTrigger.setState({ timestamp: Date.now() });
};

export const pushModal = (props: IModalProps) => {
  const id = String(Date.now());
  _modalStack.push({ id, ...props });
  _trigger();
  return id;
};

export const popModal = (id?: string) => {
  if (id) {
    for (let i = 0; i < _modalStack.length; i++)
      if (_modalStack[i].id == id) {
        _modalStack.splice(i, 1);
        _trigger();
        return true;
      }
  } else {
    _modalStack.pop();
    _trigger();
    return true;
  }

  return false;
};

function PopupProvider({}) {
  useModalTrigger();
  return (
    <>
      {_modalStack.map((modalCurrent) => (
        <React.Fragment key={`MODAL_${modalCurrent.id}`}>{modalCurrent.component}</React.Fragment>
      ))}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        {children}
        <PopupProvider />
        <ReactQueryDevtools initialIsOpen={false} />
      </APIProvider>
    </QueryClientProvider>
  );
}

// 참고: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
