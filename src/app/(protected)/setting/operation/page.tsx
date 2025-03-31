'use client';

import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('./_components/Canvas'), { ssr: false });

function CanvasPage() {
  return <Canvas />;
}

export default CanvasPage;
