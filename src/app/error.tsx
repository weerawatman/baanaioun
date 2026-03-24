'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-md w-full">
        <div className="text-8xl mb-6">⚙️</div>
        <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-3">
          เกิดข้อผิดพลาดบางอย่าง
        </h1>
        <p className="text-lg text-warm-600 dark:text-warm-400 mb-8">
          เราขออภัยในความไม่สะดวก ระบบกำลังประสบปัญหาทางเทคนิคชั่วคราว
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ลองใหม่อีกครั้ง
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-warm-200 dark:bg-warm-800 text-warm-700 dark:text-warm-300 rounded-xl hover:bg-warm-300 dark:hover:bg-warm-700 transition-colors font-medium"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
        
        {error.digest && (
          <p className="mt-8 text-xs text-warm-400 dark:text-warm-600 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
