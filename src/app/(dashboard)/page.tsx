import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-6">
        ยินดีต้อนรับสู่ Baanaioun
      </h1>
      <p className="text-warm-600 dark:text-warm-400 mb-8">
        ระบบจัดการทรัพย์สินและติดตามการก่อสร้าง/รีโนเวท
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/assets"
          className="block p-6 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
            ทรัพย์สิน
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            จัดการทรัพย์สินและติดตามมูลค่า
          </p>
        </Link>

        <Link
          href="/renovations"
          className="block p-6 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
            ก่อสร้าง/รีโนเวท
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            ติดตามโครงการก่อสร้างและรีโนเวท
          </p>
        </Link>

        <Link
          href="/reports"
          className="block p-6 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
            รายงาน
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            ดูรายงานการเงินและวิเคราะห์ข้อมูล
          </p>
        </Link>
      </div>
    </div>
  );
}
