'use client';

import React, { ReactNode } from 'react';
import FooterComponent from '@/components/Footer';
import Navigation from '@/components/Navigation';

interface RootLayoutDefaultProps {
  children: ReactNode;
}

const RootLayoutDefault: React.FC<RootLayoutDefaultProps> = ({ children }) => {
  return (
    <>
      <Navigation />
      <div id="container">
        <section id="content">{children}</section>
        <FooterComponent />
      </div>
    </>
  );
};

export default RootLayoutDefault;
