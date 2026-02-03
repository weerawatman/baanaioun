import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Welcome to Baanaioun
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Your property renovation and management tracker.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/assets"
          className="block p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Assets
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your properties and track their value.
          </p>
        </Link>

        <Link
          href="/renovations"
          className="block p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Renovations
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track renovation projects and their progress.
          </p>
        </Link>

        <Link
          href="/reports"
          className="block p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View financial reports and analytics.
          </p>
        </Link>
      </div>
    </div>
  );
}
