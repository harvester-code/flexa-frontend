'use client';

import React, { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { create } from 'zustand';
import { queryClient } from '@/api/query-client';

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

export default function ClientProviders({ children }) {
  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <PopupProvider />
    </>
  );
}
