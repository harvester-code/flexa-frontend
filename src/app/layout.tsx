import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ClientProviders from '@/ClientProviders';
import '@/styles/globals.css';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Flexa | WaitFree Airport',
  description: 'Make your airport wait-free',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientProviders>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Toaster />
        </body>
      </ClientProviders>
    </html>
  );
}
