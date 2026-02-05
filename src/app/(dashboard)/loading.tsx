export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-warm-200 dark:bg-warm-700 rounded-lg w-48" />
        <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-6"
            >
              <div className="h-5 bg-warm-200 dark:bg-warm-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/2 mb-4" />
              <div className="h-8 bg-warm-200 dark:bg-warm-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
