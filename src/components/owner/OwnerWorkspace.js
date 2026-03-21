"use client";

import { AlertBox, downloadCSV, safe } from "./OwnerShared";

import AppShell from "../AppShell";
import AsyncButton from "../AsyncButton";
import BranchModals from "./BranchModals";
import DashboardSkeleton from "../PageSkeleton";
import OwnerArrivalsTab from "./tabs/OwnerArrivalsTab";
import OwnerAuditTab from "./tabs/OwnerAuditTab";
import OwnerBranchesTab from "./tabs/OwnerBranchesTab";
import OwnerCashTab from "./tabs/OwnerCashTab";
import OwnerCreditsTab from "./tabs/OwnerCreditsTab";
import OwnerCustomersTab from "./tabs/OwnerCustomersTab";
import OwnerDeliveryNotesTab from "./tabs/OwnerDeliveryNotesTab";
import OwnerExpensesTab from "./tabs/OwnerExpensesTab";
import OwnerInventoryTab from "./tabs/OwnerInventoryTab";
import OwnerNotesTab from "./tabs/OwnerNotesTab";
import OwnerOverviewTab from "./tabs/OwnerOverviewTab";
import OwnerPaymentsTab from "./tabs/OwnerPaymentsTab";
import OwnerProductsTab from "./tabs/OwnerProductsTab";
import OwnerProformasTab from "./tabs/OwnerProformasTab";
import OwnerRefundsTab from "./tabs/OwnerRefundsTab";
import OwnerReportsTab from "./tabs/OwnerReportsTab";
import OwnerSalesTab from "./tabs/OwnerSalesTab";
import OwnerStaffTab from "./tabs/OwnerStaffTab";
import OwnerSupplierBillsTab from "./tabs/OwnerSupplierBillsTab";
import OwnerSuppliersTab from "./tabs/OwnerSuppliersTab";
import StaffModals from "./StaffModals";
import { useMemo } from "react";

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function OwnerWorkspace({
  me,
  loading,
  errorText,
  successText,
  activeTab,
  onNavigate,
  onLogout,
  onRefresh,
  summary,
  locations,
  users,
  sales,
  audit,
  selectedLocationId,
  setSelectedLocationId,
  selectedUserId,
  setSelectedUserId,
  branchStatusFilter,
  setBranchStatusFilter,
  staffSearch,
  setStaffSearch,
  staffStatusFilter,
  staffLocationFilter,
  setStaffLocationFilter,
  setStaffStatusFilter,
  activeLocations,
  openCreateBranchModal,
  openEditBranchModal,
  openCloseBranchModal,
  reopenBranch,
  openArchiveBranchModal,
  openCreateUserModal,
  openEditUserModal,
  openDeactivateUserModal,
  onOpenResetPassword,
  branchModalProps,
  staffModalProps,
}) {
  const greeting = useMemo(() => getTimeGreeting(), []);

  const visibleStaffUsers = useMemo(
    () =>
      Array.isArray(users) ? users.filter((row) => row?.role !== "owner") : [],
    [users],
  );

  const tabMetaMap = useMemo(
    () => ({
      overview: {
        title: "Owner Dashboard",
        subtitle:
          "See the business quickly, without bouncing through multiple pages.",
      },
      branches: {
        title: "Branch Management",
        subtitle:
          "Create, edit, close, reopen, and archive branches from one owner workspace.",
      },
      staff: {
        title: "Staff Management",
        subtitle:
          "Create, edit, deactivate, reset passwords, and assign staff by active branch.",
      },
      inventory: {
        title: "Inventory",
        subtitle:
          "Track and inspect cross-branch stock visibility with owner-level control.",
      },
      arrivals: {
        title: "Inventory Arrivals",
        subtitle:
          "Record stock received into branches and review arrival history professionally.",
      },
      products: {
        title: "Products",
        subtitle:
          "Manage catalog structure for hardware, apparel, PPE, and mixed stock.",
      },
      sales: {
        title: "Sales",
        subtitle: "Monitor sales activity across the business.",
      },
      payments: {
        title: "Payments",
        subtitle: "Monitor incoming payments and payment activity.",
      },
      credits: {
        title: "Credits",
        subtitle: "Track credit sales and outstanding balances.",
      },
      suppliers: {
        title: "Suppliers",
        subtitle: "Manage supplier records and supplier relationships.",
      },
      "supplier-bills": {
        title: "Purchase Orders",
        subtitle:
          "Manage purchase commitments, ordered items, and supplier-facing purchasing records.",
      },
      proformas: {
        title: "Proformas",
        subtitle:
          "Create and track printable quotations and pre-invoice documents across branches.",
      },
      "delivery-notes": {
        title: "Delivery Notes",
        subtitle:
          "Issue and track printable goods dispatch documents tied to completed sales.",
      },
      cash: {
        title: "Cash",
        subtitle: "Control cash sessions, reconciliations, and deposits.",
      },
      refunds: {
        title: "Refunds",
        subtitle: "Track refund activity across branches.",
      },
      expenses: {
        title: "Expenses",
        subtitle: "Monitor business expenses and operational spending.",
      },
      customers: {
        title: "Customers",
        subtitle: "View customer records and customer activity.",
      },
      reports: {
        title: "Reports",
        subtitle: "Review owner-level reports and business summaries.",
      },
      audit: {
        title: "Audit Log",
        subtitle:
          "Track what happened, where, and when, without leaving the workspace.",
      },
      notes: {
        title: "Notes / Alerts",
        subtitle: "Review notes, reminders, and business alerts.",
      },
    }),
    [],
  );

  const tabMeta = tabMetaMap[activeTab] || tabMetaMap.overview;
  const showDashboardHero = activeTab === "overview";

  async function handleExport() {
    if (activeTab === "branches") {
      const rows = [
        [
          "Branch Name",
          "Branch Code",
          "Status",
          "Users",
          "Products",
          "Sales",
          "Payments",
          "Opened At",
          "Closed At",
          "Archived At",
          "Reason",
        ],
        ...locations.map((row) => [
          row?.name ?? "",
          row?.code ?? "",
          row?.status ?? "",
          row?.usersCount ?? 0,
          row?.productsCount ?? 0,
          row?.salesCount ?? 0,
          row?.paymentsCount ?? 0,
          row?.openedAt ?? "",
          row?.closedAt ?? "",
          row?.archivedAt ?? "",
          row?.closeReason ?? "",
        ]),
      ];

      downloadCSV("owner-branches.csv", rows);
      return;
    }

    if (activeTab === "staff") {
      const rows = [
        ["Name", "Email", "Role", "Branch Name", "Branch Code", "Status"],
        ...visibleStaffUsers.map((row) => [
          row?.name ?? "",
          row?.email ?? "",
          row?.role ?? "",
          row?.location?.name ?? "",
          row?.location?.code ?? "",
          row?.isActive ? "Active" : "Inactive",
        ]),
      ];

      downloadCSV("owner-staff.csv", rows);
      return;
    }

    if (activeTab === "audit") {
      const rows = [
        ["Action", "Entity", "Description", "Date"],
        ...audit.map((row) => [
          row?.action ?? "",
          row?.entity ?? "",
          row?.description ?? "",
          row?.createdAt || row?.created_at || "",
        ]),
      ];

      downloadCSV("owner-audit.csv", rows);
      return;
    }

    const rows = [
      ["Metric", "Value"],
      ["Branches", locations.length],
      ["Users", visibleStaffUsers.length],
      ["Products", summary?.totals?.productsCount ?? 0],
      ["Sales", summary?.totals?.salesCount ?? 0],
      ["Payments", summary?.totals?.paymentsCount ?? 0],
    ];

    downloadCSV("owner-overview.csv", rows);
  }

  let content = null;

  if (loading) {
    content = <DashboardSkeleton />;
  } else if (activeTab === "branches") {
    content = (
      <OwnerBranchesTab
        locations={locations}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
        branchStatusFilter={branchStatusFilter}
        onChangeBranchStatusFilter={setBranchStatusFilter}
        onOpenCreate={openCreateBranchModal}
        onOpenEdit={openEditBranchModal}
        onOpenClose={openCloseBranchModal}
        onOpenReopen={reopenBranch}
        onOpenArchive={openArchiveBranchModal}
      />
    );
  } else if (activeTab === "staff") {
    content = (
      <OwnerStaffTab
        users={visibleStaffUsers}
        locations={locations}
        activeLocations={activeLocations}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        onOpenCreate={openCreateUserModal}
        onOpenEdit={openEditUserModal}
        onOpenDeactivate={openDeactivateUserModal}
        onOpenResetPassword={onOpenResetPassword}
        staffSearch={staffSearch}
        onChangeStaffSearch={setStaffSearch}
        staffStatusFilter={staffStatusFilter}
        onChangeStaffStatusFilter={setStaffStatusFilter}
        staffLocationFilter={staffLocationFilter}
        onChangeStaffLocationFilter={setStaffLocationFilter}
      />
    );
  } else if (activeTab === "inventory") {
    content = <OwnerInventoryTab locations={locations} />;
  } else if (activeTab === "arrivals") {
    content = <OwnerArrivalsTab locations={locations} />;
  } else if (activeTab === "products") {
    content = <OwnerProductsTab locations={locations} />;
  } else if (activeTab === "sales") {
    content = <OwnerSalesTab locations={locations} />;
  } else if (activeTab === "payments") {
    content = <OwnerPaymentsTab locations={locations} />;
  } else if (activeTab === "credits") {
    content = <OwnerCreditsTab locations={locations} />;
  } else if (activeTab === "suppliers") {
    content = <OwnerSuppliersTab locations={locations} />;
  } else if (activeTab === "supplier-bills") {
    content = <OwnerSupplierBillsTab locations={locations} />;
  } else if (activeTab === "proformas") {
    content = <OwnerProformasTab locations={locations} />;
  } else if (activeTab === "delivery-notes") {
    content = <OwnerDeliveryNotesTab locations={locations} />;
  } else if (activeTab === "cash") {
    content = <OwnerCashTab locations={locations} users={users} />;
  } else if (activeTab === "refunds") {
    content = <OwnerRefundsTab locations={locations} />;
  } else if (activeTab === "expenses") {
    content = <OwnerExpensesTab locations={locations} />;
  } else if (activeTab === "customers") {
    content = <OwnerCustomersTab locations={locations} />;
  } else if (activeTab === "reports") {
    content = <OwnerReportsTab locations={locations} />;
  } else if (activeTab === "audit") {
    content = <OwnerAuditTab audit={audit} locations={locations} />;
  } else if (activeTab === "notes") {
    content = <OwnerNotesTab locations={locations} />;
  } else {
    content = (
      <OwnerOverviewTab
        summary={summary}
        locations={locations}
        sales={sales}
        audit={audit}
      />
    );
  }

  return (
    <>
      <AppShell
        title={tabMeta.title}
        subtitle={tabMeta.subtitle}
        user={me}
        onLogout={onLogout}
        navItems={[
          { key: "overview", label: "Dashboard" },
          { key: "branches", label: "Branches", badge: locations.length || 0 },
          { key: "staff", label: "Team", badge: visibleStaffUsers.length || 0 },
          { key: "inventory", label: "Inventory" },
          { key: "arrivals", label: "Arrivals" },
          { key: "products", label: "Products" },
          { key: "sales", label: "Sales" },
          { key: "payments", label: "Payments" },
          { key: "credits", label: "Credits" },
          { key: "suppliers", label: "Suppliers" },
          { key: "supplier-bills", label: "Purchase Orders" },
          { key: "proformas", label: "Proformas" },
          { key: "delivery-notes", label: "Delivery Notes" },
          { key: "cash", label: "Cash" },
          { key: "refunds", label: "Refunds" },
          { key: "expenses", label: "Expenses" },
          { key: "customers", label: "Customers" },
          { key: "reports", label: "Reports" },
          { key: "audit", label: "Audit" },
          { key: "notes", label: "Notes / Alerts" },
        ]}
        activeKey={activeTab}
        onNavigate={onNavigate}
      >
        <div className="space-y-6">
          {showDashboardHero ? (
            <div className="flex flex-col gap-4 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
                  Owner workspace
                </div>

                <h1 className="mt-4 text-3xl font-black leading-tight text-stone-950 dark:text-stone-50 sm:text-4xl">
                  {greeting}, {safe(me?.name || me?.email || "Owner")}.
                </h1>

                <p className="mt-3 text-base leading-7 text-stone-700 dark:text-stone-300">
                  You should be able to move across owner tasks without losing
                  context or waiting for the whole page to rebuild.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <AsyncButton
                  idleText="Refresh workspace"
                  loadingText="Refreshing..."
                  successText="Refreshed"
                  onClick={onRefresh}
                  variant="secondary"
                />

                <AsyncButton
                  idleText="Export current view"
                  loadingText="Exporting..."
                  successText="Exported"
                  onClick={handleExport}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <AsyncButton
                idleText="Refresh workspace"
                loadingText="Refreshing..."
                successText="Refreshed"
                onClick={onRefresh}
                variant="secondary"
              />

              <AsyncButton
                idleText="Export current view"
                loadingText="Exporting..."
                successText="Exported"
                onClick={handleExport}
              />
            </div>
          )}

          <AlertBox message={errorText} />
          <AlertBox message={successText} tone="success" />

          {content}
        </div>
      </AppShell>

      <BranchModals {...branchModalProps} />
      <StaffModals {...staffModalProps} />
    </>
  );
}
