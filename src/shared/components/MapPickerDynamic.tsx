'use client';

import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <div className="h-9 w-44 bg-warm-200 dark:bg-warm-700 rounded-xl animate-pulse" />
      <div className="h-[300px] bg-warm-200 dark:bg-warm-700 rounded-xl animate-pulse" />
    </div>
  ),
});

export default MapPicker;
