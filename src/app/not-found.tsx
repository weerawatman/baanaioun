import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🏚️</div>
        <h1 className="text-4xl font-bold text-warm-900 dark:text-warm-50 mb-4">404 - ไม่พบหน้านี้</h1>
        <p className="text-lg text-warm-600 dark:text-warm-400 mb-8 max-w-md mx-auto">
          ขออภัย หน้าที่คุณกำลังมองหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่พร้อมใช้งานชั่วคราว
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-colors font-semibold shadow-lg shadow-primary-500/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
