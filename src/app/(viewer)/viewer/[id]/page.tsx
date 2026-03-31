"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const ViewerScene = dynamic(() => import("./_components/ViewerScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Loading 3D Viewer...</p>
      </div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViewerPage({ params }: PageProps) {
  const { id: scenarioId } = use(params);

  return <ViewerScene scenarioId={scenarioId} />;
}
