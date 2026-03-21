"use client";

import {
  EmptyState,
  FormInput,
  FormSelect,
  SectionCard,
  StaffRowCard,
  StatCard,
  safe,
} from "../OwnerShared";
import { useMemo, useState } from "react";

import AsyncButton from "../../AsyncButton";
import StaffDetailsDrawer from "../StaffDetailsDrawer";

const STAFF_STATUS_FILTERS = ["ALL", "ACTIVE", "INACTIVE"];

export default function OwnerStaffTab({
  users = [],
  locations = [],
  activeLocations = [],
  selectedUserId,
  onSelectUser,
  onOpenCreate,
  onOpenEdit,
  onOpenDeactivate,
  onOpenResetPassword,
  staffSearch,
  onChangeStaffSearch,
  staffStatusFilter,
  onChangeStaffStatusFilter,
  staffLocationFilter,
  onChangeStaffLocationFilter,
}) {
  const visibleUsers = useMemo(
    () =>
      Array.isArray(users) ? users.filter((row) => row?.role !== "owner") : [],
    [users],
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);

  const locationOptions = useMemo(
    () =>
      Array.isArray(locations)
        ? locations.filter(
            (row) => safe(row?.status).toUpperCase() !== "ARCHIVED",
          )
        : [],
    [locations],
  );

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((row) => {
      const query = safe(staffSearch).toLowerCase();

      const matchesSearch =
        !query ||
        safe(row?.name).toLowerCase().includes(query) ||
        safe(row?.email).toLowerCase().includes(query) ||
        safe(row?.role).toLowerCase().includes(query) ||
        safe(row?.location?.name).toLowerCase().includes(query) ||
        safe(row?.location?.code).toLowerCase().includes(query);

      const matchesStatus =
        staffStatusFilter === "ALL"
          ? true
          : staffStatusFilter === "ACTIVE"
            ? !!row?.isActive
            : !row?.isActive;

      const matchesLocation = !staffLocationFilter
        ? true
        : String(row?.locationId ?? row?.location?.id ?? "") ===
          String(staffLocationFilter);

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [visibleUsers, staffSearch, staffStatusFilter, staffLocationFilter]);

  const counts = useMemo(
    () => ({
      ALL: visibleUsers.length,
      ACTIVE: visibleUsers.filter((x) => !!x?.isActive).length,
      INACTIVE: visibleUsers.filter((x) => !x?.isActive).length,
    }),
    [visibleUsers],
  );

  const branchSummary = useMemo(() => {
    return locationOptions.map((location) => {
      const branchUsers = visibleUsers.filter(
        (user) =>
          String(user?.locationId ?? user?.location?.id ?? "") ===
          String(location?.id),
      );

      return {
        id: location.id,
        name: safe(location.name),
        code: safe(location.code),
        status: safe(location.status),
        totalUsers: branchUsers.length,
        activeUsers: branchUsers.filter((x) => !!x?.isActive).length,
        inactiveUsers: branchUsers.filter((x) => !x?.isActive).length,
      };
    });
  }, [locationOptions, visibleUsers]);

  function openDetails(user) {
    setDrawerUser(user || null);
    setDrawerOpen(true);
    onSelectUser?.(user?.id ?? null);
  }

  function closeDetails() {
    setDrawerOpen(false);
  }

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Cross-branch staff directory"
          subtitle="Search, filter, manage staff, and reset credentials without mixing the system owner into branch staffing."
          right={
            <AsyncButton
              idleText="Create user"
              loadingText="Opening..."
              successText="Ready"
              onClick={async () => onOpenCreate?.()}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total staff"
              value={counts.ALL}
              sub="All visible branch staff accounts"
            />
            <StatCard
              label="Active staff"
              value={counts.ACTIVE}
              sub="Currently active accounts"
            />
            <StatCard
              label="Inactive staff"
              value={counts.INACTIVE}
              sub="Deactivated accounts"
            />
            <StatCard
              label="Active branches"
              value={activeLocations.length}
              sub="Branches available for assignment"
            />
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_240px_auto]">
            <FormInput
              value={staffSearch}
              onChange={(e) => onChangeStaffSearch?.(e.target.value)}
              placeholder="Search by name, email, role, branch, or code"
            />

            <FormSelect
              value={staffLocationFilter || ""}
              onChange={(e) => onChangeStaffLocationFilter?.(e.target.value)}
            >
              <option value="">All branches</option>
              {locationOptions.map((row) => (
                <option key={row.id} value={row.id}>
                  {safe(row.name)} {safe(row.code) ? `(${safe(row.code)})` : ""}
                </option>
              ))}
            </FormSelect>

            <div className="flex flex-wrap gap-2">
              {STAFF_STATUS_FILTERS.map((status) => {
                const active = staffStatusFilter === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onChangeStaffStatusFilter?.(status)}
                    className={
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition " +
                      (active
                        ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800")
                    }
                  >
                    <span>{status === "ALL" ? "All staff" : status}</span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs " +
                        (active
                          ? "bg-white/10 dark:bg-stone-900/10"
                          : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300")
                      }
                    >
                      {counts[status]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {branchSummary.map((row) => (
              <div
                key={row.id}
                className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {row.name || "-"}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {row.code || "-"} · {row.status || "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeStaffLocationFilter?.(
                        String(staffLocationFilter) === String(row.id)
                          ? ""
                          : String(row.id),
                      )
                    }
                    className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    {String(staffLocationFilter) === String(row.id)
                      ? "Selected"
                      : "Filter"}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Total
                    </p>
                    <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                      {row.totalUsers}
                    </p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Active
                    </p>
                    <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                      {row.activeUsers}
                    </p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                      Inactive
                    </p>
                    <p className="mt-2 text-base font-bold text-stone-950 dark:text-stone-50">
                      {row.inactiveUsers}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {filteredUsers.length === 0 ? (
              <EmptyState text="No staff members match the current cross-branch filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredUsers.map((row) => (
                  <StaffRowCard
                    key={row.id}
                    row={row}
                    active={String(row.id) === String(selectedUserId)}
                    onSelect={(picked) => openDetails(picked)}
                  />
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <StaffDetailsDrawer
        open={drawerOpen}
        user={drawerUser}
        onClose={closeDetails}
        onOpenEdit={onOpenEdit}
        onOpenResetPassword={onOpenResetPassword}
        onOpenDeactivate={onOpenDeactivate}
      />
    </>
  );
}
