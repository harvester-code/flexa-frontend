'use client';

import dynamic from 'next/dynamic';

const LandingCanvas = dynamic(() => import('./_components/LandingCanvas'), { ssr: false });

function LandPage() {
  return <LandingCanvas />;
}

export default LandPage;
