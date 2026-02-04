import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-6">
        Welcome to Baanaioun
      </h1>
      <p className="text-warm-600 dark:text-warm-400 mb-8">
        Your property renovation and management tracker.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/assets"
          className="block p-6 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
            Assets
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            Manage your properties and track their value.
          </p>
        </Link>

        <Link
          href="/renovations"
          className="block p-6 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
            Renovations
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            Track renovation projects and their progress.
          </p>
        </Link>

        <Link
          href="/reports"
          className="block p-6 bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
            Reports
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            View financial reports and analytics.
          </p>
        </Link>
      </div>
    </div>
  );
}
