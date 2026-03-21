export function StatSkeleton() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="h-3 w-24 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-3 h-3 w-28 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}

export function CardSkeleton({ lines = 4 }) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="h-4 w-36 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />

      <div className="mt-6 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-950"
          />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-800">
        <div className="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-3 animate-pulse rounded bg-stone-200 dark:bg-stone-800"
            />
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-950"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={5} />
      </div>

      <TableSkeleton rows={5} />
    </div>
  );
}
