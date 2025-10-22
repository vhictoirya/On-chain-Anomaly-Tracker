'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the dashboard component with no SSR
const ChainWatchDashboard = dynamic(
  () => import('./components/ChainWatchDashboard'),
  { ssr: false }
);

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">Loading...</div>}>
      <ChainWatchDashboard />
    </Suspense>
  );
}
