"use client";

import { getMe, logout } from "../../lib/auth";
import { safe, safeNumber } from "../../components/owner/OwnerShared";
import { useEffect, useMemo, useState } from "react";

import DashboardSkeleton from "../../components/PageSkeleton";
import OwnerWorkspace from "../../components/owner/OwnerWorkspace";
import { apiFetch } from "../../lib/api";
import { useRouter } from "next/navigation";

const TAB_KEYS = [
  "overview",
  "branches",
  "staff",
  "inventory",
  "arrivals",
  "products",
  "sales",
  "payments",
  "credits",
  "suppliers",
  "supplier-bills",
  "proformas",
  "delivery-notes",
  "cash",
  "refunds",
  "expenses",
  "customers",
  "reports",
  "audit",
  "notes",
];

const EMPTY_BRANCH_FORM = {
  name: "",
  code: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tin: "",
  momoCode: "",
  bankAccounts: [],
  logoUrl: "",
};

function updateUrlTab(tab) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.replaceState({}, "", url.toString());
}

function getInitialTab() {
  if (typeof window === "undefined") return "overview";
  const value = new URLSearchParams(window.location.search).get("tab");
  return TAB_KEYS.includes(value) ? value : "overview";
}

function normalizeBranchForm(location = {}) {
  return {
    name: safe(location?.name),
    code: safe(location?.code),
    phone: safe(location?.phone),
    email: safe(location?.email),
    website: safe(location?.website),
    address: safe(location?.address),
    tin: safe(location?.tin),
    momoCode: safe(location?.momoCode || location?.momo_code),
    bankAccounts: Array.isArray(location?.bankAccounts)
      ? location.bankAccounts
      : Array.isArray(location?.bank_accounts)
        ? location.bank_accounts
        : [],
    logoUrl: safe(location?.logoUrl || location?.logo_url),
  };
}

function cleanBankAccounts(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const s = entry.trim();
        return s || null;
      }

      if (!entry || typeof entry !== "object") return null;

      const bankName = safe(entry.bankName || entry.bank || entry.name);
      const accountName = safe(entry.accountName || entry.holderName);
      const accountNumber = safe(entry.accountNumber || entry.number);

      if (!bankName && !accountName && !accountNumber) return null;

      return {
        ...(bankName ? { bankName } : {}),
        ...(accountName ? { accountName } : {}),
        ...(accountNumber ? { accountNumber } : {}),
      };
    })
    .filter(Boolean);
}

function buildBranchPayload(form) {
  return {
    name: safe(form?.name),
    code: safe(form?.code).toUpperCase(),
    phone: safe(form?.phone) || undefined,
    email: safe(form?.email) || undefined,
    website: safe(form?.website) || undefined,
    address: safe(form?.address) || undefined,
    tin: safe(form?.tin) || undefined,
    momoCode: safe(form?.momoCode) || undefined,
    bankAccounts: cleanBankAccounts(form?.bankAccounts),
    logoUrl: safe(form?.logoUrl) || undefined,
  };
}

export default function DashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [sales, setSales] = useState([]);
  const [audit, setAudit] = useState([]);

  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [branchStatusFilter, setBranchStatusFilter] = useState("ALL");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] = useState("ALL");
  const [staffLocationFilter, setStaffLocationFilter] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [deactivateUserModalOpen, setDeactivateUserModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

  const [activeLocation, setActiveLocation] = useState(null);
  const [activeUser, setActiveUser] = useState(null);

  const [createForm, setCreateForm] = useState({ ...EMPTY_BRANCH_FORM });
  const [editForm, setEditForm] = useState({ ...EMPTY_BRANCH_FORM });

  const [closeReason, setCloseReason] = useState("");
  const [archiveReason, setArchiveReason] = useState("");

  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    locationId: "",
  });

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    role: "admin",
    locationId: "",
    isActive: true,
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [createUserShowPassword, setCreateUserShowPassword] = useState(false);
  const [resetUserShowPassword, setResetUserShowPassword] = useState(false);
  const [resetUserShowConfirmPassword, setResetUserShowConfirmPassword] =
    useState(false);

  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const activeLocations = useMemo(
    () =>
      locations.filter((row) => safe(row?.status).toUpperCase() === "ACTIVE"),
    [locations],
  );

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setBooting(true);

      try {
        const data = await getMe();
        const user = data?.user || null;

        if (!alive) return;

        if (!user || user.role !== "owner") {
          router.replace("/login");
          return;
        }

        setMe(user);
      } catch {
        if (!alive) return;
        router.replace("/login");
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  async function loadWorkspace() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const [summaryRes, locationsRes, usersRes, salesRes, auditRes] =
      await Promise.allSettled([
        apiFetch("/owner/summary", { method: "GET" }),
        apiFetch("/owner/locations", { method: "GET" }),
        apiFetch("/users", { method: "GET" }),
        apiFetch("/owner/sales?limit=50&offset=0", { method: "GET" }),
        apiFetch("/audit?limit=50", { method: "GET" }),
      ]);

    let firstError = "";

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value?.summary || null);
    } else {
      setSummary(null);
      firstError =
        firstError ||
        summaryRes.reason?.data?.error ||
        summaryRes.reason?.message ||
        "Failed to load owner summary";
    }

    if (locationsRes.status === "fulfilled") {
      const rows = Array.isArray(locationsRes.value?.locations)
        ? locationsRes.value.locations
        : [];
      setLocations(rows);
      setSelectedLocationId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev)) ? prev : null,
      );
    } else {
      setLocations([]);
      firstError =
        firstError ||
        locationsRes.reason?.data?.error ||
        locationsRes.reason?.message ||
        "Failed to load locations";
    }

    if (usersRes.status === "fulfilled") {
      const rows = Array.isArray(usersRes.value?.users)
        ? usersRes.value.users
        : [];
      setUsers(rows);
      setSelectedUserId((prev) =>
        prev && rows.some((x) => String(x.id) === String(prev)) ? prev : null,
      );
    } else {
      setUsers([]);
      firstError =
        firstError ||
        usersRes.reason?.data?.error ||
        usersRes.reason?.message ||
        "Failed to load users";
    }

    if (salesRes.status === "fulfilled") {
      const rows =
        salesRes.value?.sales ||
        salesRes.value?.items ||
        salesRes.value?.rows ||
        [];
      setSales(Array.isArray(rows) ? rows : []);
    } else {
      setSales([]);
    }

    if (auditRes.status === "fulfilled") {
      const rows =
        auditRes.value?.logs ||
        auditRes.value?.audit ||
        auditRes.value?.items ||
        auditRes.value?.rows ||
        [];
      setAudit(Array.isArray(rows) ? rows : []);
    } else {
      setAudit([]);
    }

    setErrorText(firstError);
    setLoading(false);
  }

  useEffect(() => {
    if (!me) return;
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  function handleTabChange(key) {
    setActiveTab(key);
    updateUrlTab(key);
    setSuccessText("");
    setErrorText("");
  }

  function closeAllBranchModals() {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setCloseModalOpen(false);
    setArchiveModalOpen(false);
    setActiveLocation(null);
    setModalError("");
    setModalSubmitting(false);
    setCloseReason("");
    setArchiveReason("");
  }

  function closeAllUserModals() {
    setCreateUserModalOpen(false);
    setEditUserModalOpen(false);
    setDeactivateUserModalOpen(false);
    setResetPasswordModalOpen(false);
    setActiveUser(null);
    setModalError("");
    setModalSubmitting(false);
    setCreateUserShowPassword(false);
    setResetUserShowPassword(false);
    setResetUserShowConfirmPassword(false);
    setResetPasswordForm({
      password: "",
      confirmPassword: "",
    });
  }

  function openCreateBranchModal() {
    setCreateForm({ ...EMPTY_BRANCH_FORM });
    setModalError("");
    setCreateModalOpen(true);
  }

  function openEditBranchModal(location) {
    setActiveLocation(location || null);
    setEditForm(normalizeBranchForm(location));
    setModalError("");
    setEditModalOpen(true);
  }

  function openCloseBranchModal(location) {
    setActiveLocation(location || null);
    setCloseReason("");
    setModalError("");
    setCloseModalOpen(true);
  }

  function openArchiveBranchModal(location) {
    setActiveLocation(location || null);
    setArchiveReason(safe(location?.closeReason));
    setModalError("");
    setArchiveModalOpen(true);
  }

  function openCreateUserModal() {
    const defaultLocationId = activeLocations[0]?.id
      ? String(activeLocations[0].id)
      : "";

    setCreateUserForm({
      name: "",
      email: "",
      password: "",
      role: "admin",
      locationId: defaultLocationId,
    });
    setCreateUserShowPassword(false);
    setModalError("");
    setCreateUserModalOpen(true);
  }

  function openEditUserModal(user) {
    setActiveUser(user || null);
    setEditUserForm({
      name: safe(user?.name),
      role: safe(user?.role) || "admin",
      locationId: user?.locationId ? String(user.locationId) : "",
      isActive: user?.isActive !== false,
    });
    setModalError("");
    setEditUserModalOpen(true);
  }

  function openDeactivateUserModal(user) {
    setActiveUser(user || null);
    setModalError("");
    setDeactivateUserModalOpen(true);
  }

  function openResetPasswordModal(user) {
    setActiveUser(user || null);
    setResetPasswordForm({
      password: "",
      confirmPassword: "",
    });
    setResetUserShowPassword(false);
    setResetUserShowConfirmPassword(false);
    setModalError("");
    setResetPasswordModalOpen(true);
  }

  async function createBranch() {
    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch("/owner/locations", {
        method: "POST",
        body: buildBranchPayload(createForm),
      });

      closeAllBranchModals();
      await loadWorkspace();
      setActiveTab("branches");
      setSuccessText("Branch created successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to create branch",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function updateBranch() {
    if (!activeLocation?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/locations/${activeLocation.id}`, {
        method: "PATCH",
        body: buildBranchPayload(editForm),
      });

      closeAllBranchModals();
      await loadWorkspace();
      setSelectedLocationId(activeLocation.id);
      setSuccessText("Branch updated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to update branch",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function closeBranch() {
    if (!activeLocation?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/locations/${activeLocation.id}/close`, {
        method: "POST",
        body: {
          reason: safe(closeReason),
        },
      });

      closeAllBranchModals();
      await loadWorkspace();
      setSelectedLocationId(activeLocation.id);
      setSuccessText("Branch closed successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to close branch",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function reopenBranch(location) {
    if (!location?.id) return;

    setErrorText("");
    setSuccessText("");

    try {
      await apiFetch(`/owner/locations/${location.id}/reopen`, {
        method: "POST",
      });
      await loadWorkspace();
      setSelectedLocationId(location.id);
      setSuccessText("Branch restored to active successfully.");
    } catch (error) {
      setErrorText(
        error?.data?.error || error?.message || "Failed to reopen branch",
      );
    }
  }

  async function archiveBranch() {
    if (!activeLocation?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/owner/locations/${activeLocation.id}/archive`, {
        method: "POST",
        body: {
          reason: safe(archiveReason),
        },
      });

      closeAllBranchModals();
      await loadWorkspace();
      setSelectedLocationId(activeLocation.id);
      setSuccessText("Branch archived successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to archive branch",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function createUser() {
    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch("/users", {
        method: "POST",
        body: {
          name: safe(createUserForm.name),
          email: safe(createUserForm.email).toLowerCase(),
          password: String(createUserForm.password || ""),
          role: safe(createUserForm.role),
          locationId: safeNumber(createUserForm.locationId),
        },
      });

      closeAllUserModals();
      await loadWorkspace();
      setActiveTab("staff");
      setSuccessText("User created successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to create user",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function updateUser() {
    if (!activeUser?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/users/${activeUser.id}`, {
        method: "PATCH",
        body: {
          name: safe(editUserForm.name),
          role: safe(editUserForm.role),
          locationId: safeNumber(editUserForm.locationId),
          isActive: !!editUserForm.isActive,
        },
      });

      closeAllUserModals();
      await loadWorkspace();
      setSelectedUserId(activeUser.id);
      setSuccessText("User updated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to update user",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function resetUserPassword() {
    if (!activeUser?.id) return;

    const password = String(resetPasswordForm.password || "");
    const confirmPassword = String(resetPasswordForm.confirmPassword || "");

    if (!password.trim()) {
      setModalError("New password is required.");
      return;
    }

    if (password.length < 8) {
      setModalError("New password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setModalError("Password confirmation does not match.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/users/${activeUser.id}/reset-password`, {
        method: "POST",
        body: { password },
      });

      closeAllUserModals();
      await loadWorkspace();
      setSelectedUserId(activeUser.id);
      setSuccessText("User password reset successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to reset password",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function deactivateUser() {
    if (!activeUser?.id) return;

    setModalSubmitting(true);
    setModalError("");

    try {
      await apiFetch(`/users/${activeUser.id}`, {
        method: "DELETE",
      });

      closeAllUserModals();
      await loadWorkspace();
      setSelectedUserId(activeUser.id);
      setSuccessText("User deactivated successfully.");
    } catch (error) {
      setModalError(
        error?.data?.error || error?.message || "Failed to deactivate user",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  const branchModalProps = {
    createModalOpen,
    editModalOpen,
    closeModalOpen,
    archiveModalOpen,
    closeAllBranchModals,
    modalError,
    modalSubmitting,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    closeReason,
    setCloseReason,
    archiveReason,
    setArchiveReason,
    activeLocation,
    createBranch,
    updateBranch,
    closeBranch,
    archiveBranch,
  };

  const staffModalProps = {
    createUserModalOpen,
    editUserModalOpen,
    deactivateUserModalOpen,
    resetPasswordModalOpen,
    closeAllUserModals,
    modalError,
    modalSubmitting,
    createUserForm,
    setCreateUserForm,
    editUserForm,
    setEditUserForm,
    resetPasswordForm,
    setResetPasswordForm,
    activeLocations,
    activeUser,
    createUser,
    updateUser,
    deactivateUser,
    resetUserPassword,
    createUserShowPassword,
    setCreateUserShowPassword,
    resetUserShowPassword,
    setResetUserShowPassword,
    resetUserShowConfirmPassword,
    setResetUserShowConfirmPassword,
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-stone-100 p-5 dark:bg-stone-950">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <OwnerWorkspace
      me={me}
      loading={loading}
      errorText={errorText}
      successText={successText}
      activeTab={activeTab}
      onNavigate={handleTabChange}
      onLogout={handleLogout}
      onRefresh={loadWorkspace}
      summary={summary}
      locations={locations}
      users={users}
      sales={sales}
      audit={audit}
      selectedLocationId={selectedLocationId}
      setSelectedLocationId={setSelectedLocationId}
      selectedUserId={selectedUserId}
      setSelectedUserId={setSelectedUserId}
      branchStatusFilter={branchStatusFilter}
      setBranchStatusFilter={setBranchStatusFilter}
      staffSearch={staffSearch}
      setStaffSearch={setStaffSearch}
      staffStatusFilter={staffStatusFilter}
      setStaffStatusFilter={setStaffStatusFilter}
      staffLocationFilter={staffLocationFilter}
      setStaffLocationFilter={setStaffLocationFilter}
      activeLocations={activeLocations}
      openCreateBranchModal={openCreateBranchModal}
      openEditBranchModal={openEditBranchModal}
      openCloseBranchModal={openCloseBranchModal}
      reopenBranch={reopenBranch}
      openArchiveBranchModal={openArchiveBranchModal}
      openCreateUserModal={openCreateUserModal}
      openEditUserModal={openEditUserModal}
      openDeactivateUserModal={openDeactivateUserModal}
      onOpenResetPassword={openResetPasswordModal}
      branchModalProps={branchModalProps}
      staffModalProps={staffModalProps}
    />
  );
}
