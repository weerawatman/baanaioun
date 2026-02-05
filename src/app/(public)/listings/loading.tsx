export default function ListingsLoading() {
  return (
    <div className="bg-warm-50 dark:bg-warm-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-warm-200 dark:bg-warm-700 rounded-lg w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-warm-200 dark:bg-warm-700" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-warm-200 dark:bg-warm-700 rounded w-3/4" />
                  <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/2" />
                  <div className="h-8 bg-warm-200 dark:bg-warm-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
