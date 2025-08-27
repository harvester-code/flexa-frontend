import '@/styles/globals.css';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import Providers from './provider';

export const metadata: Metadata = {
  title: 'Flexa | WaitFree Airport',
  description: 'Make your airport wait-free',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <html lang="en">
        <body className={cn('antialiased')}>{children}</body>
      </html>
    </Providers>
  );
}
