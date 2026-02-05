'use client';

import Link from 'next/link';

export default function ListingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-warm-50 dark:bg-warm-950 min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-5xl mb-4">🏚️</div>
        <h2 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">
          เกิดข้อผิดพลาด
        </h2>
        <p className="text-warm-500 dark:text-warm-400 mb-6">
          ไม่สามารถโหลดข้อมูลประกาศได้ กรุณาลองใหม่อีกครั้ง
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
          >
            ลองใหม่
          </button>
          <Link
            href="/listings"
            className="px-6 py-3 border border-warm-300 dark:border-warm-700 rounded-xl text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors font-medium"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
