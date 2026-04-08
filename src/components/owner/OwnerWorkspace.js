"use client";

import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileClock,
  FileSearch,
  HandCoins,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import BranchModals from "./BranchModals";
import OwnerAuditTab from "./tabs/OwnerAuditTab";
import OwnerBranchesTab from "./tabs/OwnerBranchesTab";
import OwnerCashTab from "./tabs/OwnerCashTab";
import OwnerCreditsTab from "./tabs/OwnerCreditsTab";
import OwnerCustomersTab from "./tabs/OwnerCustomersTab";
import OwnerExpensesTab from "./tabs/OwnerExpensesTab";
import OwnerInventoryTab from "./tabs/OwnerInventoryTab";
import OwnerNotesTab from "./tabs/OwnerNotesTab";
import OwnerOverviewTab from "./tabs/OwnerOverviewTab";
import OwnerPaymentsTab from "./tabs/OwnerPaymentsTab";
import OwnerProductsTab from "./tabs/OwnerProductsTab";
import OwnerRefundsTab from "./tabs/OwnerRefundsTab";
import OwnerReportsTab from "./tabs/OwnerReportsTab";
import OwnerSalesTab from "./tabs/OwnerSalesTab";
import OwnerStaffTab from "./tabs/OwnerStaffTab";
import OwnerSupplierBillsTab from "./tabs/OwnerSupplierBillsTab";
import OwnerSupplierEvaluationsTab from "./tabs/OwnerSupplierEvaluationsTab";
import OwnerSupplierProfilesTab from "./tabs/OwnerSupplierProfilesTab";
import OwnerSuppliersTab from "./tabs/OwnerSuppliersTab";
import StaffModals from "./StaffModals";
import ThemeToggle from "../ThemeToggle";
import { useMemo } from "react";

function safe(v) {
  return String(v ?? "").trim();
}

function sectionTitle(activeTab) {
  switch (activeTab) {
    case "overview":
      return "Overview";
    case "branches":
      return "Branches";
    case "staff":
      return "Staff";
    case "inventory":
      return "Inventory";
    case "products":
      return "Products";
    case "sales":
      return "Sales";
    case "payments":
      return "Payments";
    case "credits":
      return "Credits";
    case "suppliers":
      return "Suppliers";
    case "supplier-profiles":
      return "Supplier Profiles";
    case "supplier-evaluations":
      return "Supplier Evaluations";
    case "supplier-bills":
      return "Supplier Bills";
    case "cash":
      return "Cash";
    case "refunds":
      return "Refunds";
    case "expenses":
      return "Expenses";
    case "customers":
      return "Customers";
    case "reports":
      return "Reports";
    case "audit":
      return "Audit";
    case "notes":
      return "Notes";
    default:
      return "Overview";
  }
}

function sectionSubtitle(activeTab) {
  switch (activeTab) {
    case "overview":
      return "Business-wide performance, problems, and decisions in one place.";
    case "branches":
      return "Branch structure, status, identity, and operational control.";
    case "staff":
      return "People, permissions, branch assignment, and staff discipline.";
    case "inventory":
      return "Stock truth, movement, and branch-level inventory visibility.";
    case "products":
      return "Catalog structure, pricing readiness, and product control.";
    case "sales":
      return "Sales flow, output, and operational execution visibility.";
    case "payments":
      return "Recorded customer payments, methods, and settlement behavior.";
    case "credits":
      return "Customer credit exposure, control, and repayment visibility.";
    case "suppliers":
      return "Supplier master records, contact detail, and liability context.";
    case "supplier-profiles":
      return "Supplier payment setup, terms, bank details, and instructions.";
    case "supplier-evaluations":
      return "Owner evaluation, preferred suppliers, watchlist, and risk.";
    case "supplier-bills":
      return "Supplier liabilities, due dates, installments, and balances.";
    case "cash":
      return "Cash movement, sessions, and reconciliation visibility.";
    case "refunds":
      return "Refund discipline, reasons, and financial impact visibility.";
    case "expenses":
      return "Operating expenses and branch-level cost discipline.";
    case "customers":
      return "Customer records, activity, balances, and relationships.";
    case "reports":
      return "Owner-grade reporting across branches, stock, money, and staff.";
    case "audit":
      return "Evidence trail for critical actions and sensitive changes.";
    case "notes":
      return "Internal notes, follow-ups, and management attention points.";
    default:
      return "Business-wide performance, problems, and decisions in one place.";
  }
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item.key)}
      className={
        "group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 " +
        (active
          ? "border-stone-900 bg-stone-900 text-white shadow-md dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-700 dark:hover:bg-stone-800")
      }
    >
      <span
        className={
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition " +
          (active
            ? "border-white/10 bg-white/10 text-white dark:border-stone-900/10 dark:bg-stone-900/10 dark:text-stone-950"
            : "border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300")
        }
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {item.label}
        </span>
        {item.description ? (
          <span
            className={
              "mt-0.5 block truncate text-xs " +
              (active
                ? "text-stone-300 dark:text-stone-600"
                : "text-stone-500 dark:text-stone-400")
            }
          >
            {item.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function OwnerWorkspace({
  me = null,
  activeTab = "overview",
  onNavigate,
  onLogout,
  onRefresh,

  summary = null,
  locations = [],
  users = [],
  sales = [],
  audit = [],

  selectedLocationId = null,
  setSelectedLocationId,
  selectedUserId = null,
  setSelectedUserId,

  branchStatusFilter = "ALL",
  setBranchStatusFilter,

  staffSearch = "",
  setStaffSearch,
  staffStatusFilter = "ALL",
  setStaffStatusFilter,
  staffLocationFilter = "",
  setStaffLocationFilter,

  activeLocations = [],

  openCreateBranchModal,
  openEditBranchModal,
  openCloseBranchModal,
  reopenBranch,
  openArchiveBranchModal,

  openCreateUserModal,
  openEditUserModal,
  openDeactivateUserModal,
  onOpenResetPassword,

  branchModalProps = {},
  staffModalProps = {},
}) {
  const navGroups = useMemo(
    () => [
      {
        title: "Control Room",
        items: [
          {
            key: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            description: "Business-wide command view",
          },
          {
            key: "branches",
            label: "Branches",
            icon: Building2,
            description: "Branch structure and state",
          },
          {
            key: "staff",
            label: "Staff",
            icon: Users,
            description: "People and permissions",
          },
        ],
      },
      {
        title: "Operations",
        items: [
          {
            key: "inventory",
            label: "Inventory",
            icon: Package,
            description: "Stock truth and movement",
          },
          {
            key: "products",
            label: "Products",
            icon: Store,
            description: "Catalog and selling setup",
          },
          {
            key: "sales",
            label: "Sales",
            icon: Receipt,
            description: "Sales execution visibility",
          },
          {
            key: "payments",
            label: "Payments",
            icon: CreditCard,
            description: "Recorded customer payments",
          },
          {
            key: "credits",
            label: "Credits",
            icon: HandCoins,
            description: "Credit exposure and recovery",
          },
          {
            key: "customers",
            label: "Customers",
            icon: Users,
            description: "Customer base and balances",
          },
        ],
      },
      {
        title: "Procurement",
        items: [
          {
            key: "suppliers",
            label: "Suppliers",
            icon: Truck,
            description: "Supplier master records",
          },
          {
            key: "supplier-profiles",
            label: "Supplier Profiles",
            icon: FileSearch,
            description: "Payment setup and terms",
          },
          {
            key: "supplier-evaluations",
            label: "Supplier Evaluations",
            icon: ShieldCheck,
            description: "Performance and risk scoring",
          },
          {
            key: "supplier-bills",
            label: "Supplier Bills",
            icon: ClipboardList,
            description: "Liabilities and due dates",
          },
        ],
      },
      {
        title: "Finance",
        items: [
          {
            key: "cash",
            label: "Cash",
            icon: Wallet,
            description: "Cash movement and sessions",
          },
          {
            key: "refunds",
            label: "Refunds",
            icon: FileClock,
            description: "Refund discipline and impact",
          },
          {
            key: "expenses",
            label: "Expenses",
            icon: ScrollText,
            description: "Operating cost visibility",
          },
        ],
      },
      {
        title: "Oversight",
        items: [
          {
            key: "reports",
            label: "Reports",
            icon: BarChart3,
            description: "Owner-grade reporting",
          },
          {
            key: "audit",
            label: "Audit",
            icon: ShieldCheck,
            description: "Evidence and traceability",
          },
          {
            key: "notes",
            label: "Notes",
            icon: Bell,
            description: "Internal follow-up points",
          },
        ],
      },
    ],
    [],
  );

  const allTabs = useMemo(
    () => navGroups.flatMap((group) => group.items),
    [navGroups],
  );

  const activeTabMeta =
    allTabs.find((item) => item.key === activeTab) || allTabs[0];

  function renderActiveTab() {
    switch (activeTab) {
      case "overview":
        return (
          <OwnerOverviewTab
            ownerName={safe(me?.name) || safe(me?.email) || "Owner"}
            locations={locations}
            summary={summary}
            users={users}
            sales={sales}
            audit={audit}
          />
        );

      case "branches":
        return (
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

      case "staff":
        return (
          <OwnerStaffTab
            users={users}
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

      case "inventory":
        return <OwnerInventoryTab locations={locations} />;
      case "products":
        return <OwnerProductsTab locations={locations} />;
      case "sales":
        return <OwnerSalesTab locations={locations} />;
      case "payments":
        return <OwnerPaymentsTab locations={locations} />;
      case "credits":
        return <OwnerCreditsTab locations={locations} />;
      case "suppliers":
        return <OwnerSuppliersTab locations={locations} />;
      case "supplier-profiles":
        return <OwnerSupplierProfilesTab locations={locations} />;
      case "supplier-evaluations":
        return <OwnerSupplierEvaluationsTab locations={locations} />;
      case "supplier-bills":
        return <OwnerSupplierBillsTab locations={locations} />;
      case "cash":
        return <OwnerCashTab locations={locations} />;
      case "refunds":
        return <OwnerRefundsTab locations={locations} />;
      case "expenses":
        return <OwnerExpensesTab locations={locations} />;
      case "customers":
        return <OwnerCustomersTab locations={locations} />;
      case "reports":
        return <OwnerReportsTab locations={locations} />;
      case "audit":
        return <OwnerAuditTab locations={locations} />;
      case "notes":
        return <OwnerNotesTab locations={locations} />;
      default:
        return (
          <OwnerOverviewTab
            ownerName={safe(me?.name) || safe(me?.email) || "Owner"}
            locations={locations}
            summary={summary}
            users={users}
            sales={sales}
            audit={audit}
          />
        );
    }
  }

  return (
    <>
      <div className="grid gap-5 xl:h-[calc(100vh-32px)] xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-6">
        <aside className="hidden xl:block xl:min-h-0">
          <div className="sticky top-4 h-[calc(100vh-48px)] overflow-hidden">
            <div className="h-full overflow-y-auto pr-2">
              <div className="space-y-5">
                {navGroups.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-[28px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950"
                  >
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      {group.title}
                    </p>

                    <div className="mt-3 space-y-2">
                      {group.items.map((item) => (
                        <NavButton
                          key={item.key}
                          item={item}
                          active={activeTab === item.key}
                          onClick={onNavigate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 xl:min-h-0 xl:overflow-y-auto xl:pr-2">
          <div className="sticky top-0 z-20 bg-white p-4 pb-5 dark:bg-stone-950">
            <div className="rounded-[24px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:rounded-[28px] sm:p-5 lg:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Current section
                    </p>
                    <h1 className="mt-1 truncate text-xl font-black tracking-tight text-stone-950 dark:text-stone-50 sm:text-2xl">
                      {activeTabMeta?.label || sectionTitle(activeTab)}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-stone-600 dark:text-stone-400">
                      {sectionSubtitle(activeTab)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {onRefresh ? (
                      <button
                        type="button"
                        onClick={onRefresh}
                        className="hidden h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 sm:inline-flex"
                        title="Refresh"
                      >
                        Refresh
                      </button>
                    ) : null}

                    <ThemeToggle />

                    {onLogout ? (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="hidden h-10 items-center justify-center rounded-xl bg-stone-900 px-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 sm:inline-flex"
                        title="Logout"
                      >
                        Logout
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="xl:hidden">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Workspace section
                  </label>

                  <div className="relative">
                    <select
                      value={activeTab}
                      onChange={(e) => onNavigate?.(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-stone-300 bg-white pl-4 pr-12 text-sm font-semibold text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-500"
                    >
                      {navGroups.map((group) => (
                        <optgroup key={group.title} label={group.title}>
                          {group.items.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-500 dark:text-stone-400">
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
                      {activeTabMeta?.icon ? (
                        <activeTabMeta.icon className="h-5 w-5" />
                      ) : null}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
                        {activeTabMeta?.label || sectionTitle(activeTab)}
                      </p>
                      <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                        {activeTabMeta?.description ||
                          sectionSubtitle(activeTab)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
                    {onRefresh ? (
                      <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                      >
                        Refresh
                      </button>
                    ) : null}

                    {onLogout ? (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-stone-900 px-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                      >
                        Logout
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {renderActiveTab()}
        </section>
      </div>

      <BranchModals {...branchModalProps} />
      <StaffModals {...staffModalProps} />
    </>
  );
}
