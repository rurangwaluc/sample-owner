"use client";

import {
  EmptyState,
  SectionCard,
  StatCard,
  money,
  safe,
  safeDate,
  safeNumber,
} from "../OwnerShared";

export default function OwnerOverviewTab(props) {
  const summary = props?.summary || null;
  const locations = Array.isArray(props?.locations) ? props.locations : [];
  const sales = Array.isArray(props?.sales) ? props.sales : [];
  const audit = Array.isArray(props?.audit) ? props.audit : [];

  const totals = summary?.totals || {
    usersCount: 0,
    productsCount: 0,
    salesCount: 0,
    paymentsCount: 0,
  };

  const salesTotal = sales.reduce((sum, row) => {
    return sum + safeNumber(row?.totalAmount ?? row?.total ?? 0);
  }, 0);

  const topBranch = [...locations].sort((a, b) => {
    return safeNumber(b?.salesCount) - safeNumber(a?.salesCount);
  })[0];

  const recentAudit = [...audit]
    .sort((a, b) => {
      const da = new Date(a?.createdAt || a?.created_at || 0).getTime();
      const db = new Date(b?.createdAt || b?.created_at || 0).getTime();
      return db - da;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Branches"
          value={locations.length}
          sub="Visible business locations"
        />
        <StatCard
          label="Users"
          value={totals.usersCount}
          sub="Staff accounts across branches"
        />
        <StatCard
          label="Products"
          value={totals.productsCount}
          sub="Tracked stock records"
        />
        <StatCard
          label="Sales total"
          value={money(salesTotal)}
          sub="Loaded from current sales data"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Owner summary"
          subtitle="This is the fast business picture, not a data dump."
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Branch signal
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                {topBranch
                  ? `${safe(topBranch.name)} (${safe(topBranch.code)}) currently leads by sales count with ${safeNumber(topBranch.salesCount)} records.`
                  : "No branch comparison is available yet."}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Staff footprint
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                The system currently sees {safeNumber(totals.usersCount)} staff
                account{safeNumber(totals.usersCount) === 1 ? "" : "s"} across
                all branches.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Audit visibility
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                {recentAudit.length > 0
                  ? `${recentAudit.length} recent audit entr${recentAudit.length === 1 ? "y" : "ies"} are visible right now.`
                  : "No recent audit activity is visible yet."}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Recent audit activity"
          subtitle="The owner should see operational movement fast."
        >
          {recentAudit.length === 0 ? (
            <EmptyState text="No recent audit records available." />
          ) : (
            <div className="space-y-3">
              {recentAudit.map((row, index) => (
                <div
                  key={row?.id ?? index}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {safe(row?.action || "-")}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {safeDate(row?.createdAt || row?.created_at)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                    {safe(row?.description || "-")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
