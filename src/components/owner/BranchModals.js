"use client";

import {
  AlertBox,
  FieldLabel,
  FormInput,
  FormTextarea,
  OverlayModal,
  safe,
} from "./OwnerShared";
import { resolveAssetUrl, uploadFiles } from "../../lib/apiUpload";
import { useMemo, useRef, useState } from "react";

function normalizeBankAccountsForInput(value) {
  if (Array.isArray(value)) {
    return value
      .map((acc) => {
        if (!acc) return "";

        if (typeof acc === "string") {
          return acc.trim();
        }

        const bankName = safe(acc.bankName) || safe(acc.bank) || safe(acc.name);
        const accountName = safe(acc.accountName) || safe(acc.holderName);
        const accountNumber = safe(acc.accountNumber) || safe(acc.number);

        return [bankName, accountName, accountNumber]
          .filter(Boolean)
          .join(" • ");
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function normalizeBankAccountsFromInput(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function BranchLogoPicker({
  value,
  onChange,
  disabled = false,
  label = "Branch logo",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const previewUrl = useMemo(() => {
    const clean = safe(value);
    return clean ? resolveAssetUrl(clean) : "";
  }, [value]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadError("");

    try {
      const result = await uploadFiles(files);
      const uploaded = Array.isArray(result?.urls) ? result.urls[0] : "";
      if (!uploaded) throw new Error("No uploaded file URL returned");
      onChange(uploaded);
    } catch (error) {
      setUploadError(
        error?.data?.error || error?.message || "Failed to upload logo",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <FieldLabel htmlFor="branch-logo-url">{label}</FieldLabel>

      <FormInput
        id="branch-logo-url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/public/branch-logos/your-logo.png or https://..."
        disabled={disabled || uploading}
      />

      <div className="flex flex-wrap gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={disabled || uploading}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          {uploading ? "Uploading..." : "Upload logo"}
        </button>

        {safe(value) ? (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled || uploading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Remove logo
          </button>
        ) : null}
      </div>

      {uploadError ? <AlertBox message={uploadError} /> : null}

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Logo preview
        </div>

        {previewUrl ? (
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
            <img
              src={previewUrl}
              alt="Branch logo preview"
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            No logo selected yet.
          </div>
        )}
      </div>
    </div>
  );
}

function BranchIdentityFields({ form, setForm, disabled = false }) {
  const bankAccountsText = useMemo(
    () => normalizeBankAccountsForInput(form.bankAccounts),
    [form.bankAccounts],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="branch-name">Branch name</FieldLabel>
          <FormInput
            id="branch-name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. GRAPE HARDWARE"
            disabled={disabled}
          />
        </div>

        <div>
          <FieldLabel htmlFor="branch-code">Branch code</FieldLabel>
          <FormInput
            id="branch-code"
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
            }
            placeholder="e.g. GRAPE"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="branch-phone">Phone</FieldLabel>
          <FormInput
            id="branch-phone"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+2507..."
            disabled={disabled}
          />
        </div>

        <div>
          <FieldLabel htmlFor="branch-email">Email</FieldLabel>
          <FormInput
            id="branch-email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="branch@example.com"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="branch-website">Website</FieldLabel>
          <FormInput
            id="branch-website"
            value={form.website}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, website: e.target.value }))
            }
            placeholder="https://example.com"
            disabled={disabled}
          />
        </div>

        <div>
          <FieldLabel htmlFor="branch-tin">TIN number</FieldLabel>
          <FormInput
            id="branch-tin"
            value={form.tin}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tin: e.target.value }))
            }
            placeholder="TIN number"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="branch-address">Address</FieldLabel>
        <FormTextarea
          id="branch-address"
          value={form.address}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, address: e.target.value }))
          }
          placeholder="Branch physical address"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="branch-momo-code">MoMo code</FieldLabel>
          <FormInput
            id="branch-momo-code"
            value={form.momoCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, momoCode: e.target.value }))
            }
            placeholder="MoMo code"
            disabled={disabled}
          />
        </div>

        <div>
          <FieldLabel htmlFor="branch-bank-accounts">Bank accounts</FieldLabel>
          <FormTextarea
            id="branch-bank-accounts"
            value={bankAccountsText}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                bankAccounts: normalizeBankAccountsFromInput(e.target.value),
              }))
            }
            placeholder={
              "One account per line\nExample:\nBK • SHABA LTD • 123456789\nEquity • SHABA LTD • 987654321"
            }
            rows={5}
            disabled={disabled}
          />
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Write one bank account per line.
          </div>
        </div>
      </div>

      <BranchLogoPicker
        value={form.logoUrl}
        onChange={(logoUrl) =>
          setForm((prev) => ({
            ...prev,
            logoUrl,
          }))
        }
        disabled={disabled}
      />
    </div>
  );
}

export default function BranchModals({
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
}) {
  return (
    <>
      <OverlayModal
        open={createModalOpen}
        title="Create branch"
        subtitle="Create a new business branch with identity, contact detail, payment detail, and document branding."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createBranch}
              disabled={
                modalSubmitting ||
                !safe(createForm.name) ||
                !safe(createForm.code)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Creating..." : "Create branch"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <BranchIdentityFields
            form={createForm}
            setForm={setCreateForm}
            disabled={modalSubmitting}
          />

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            New branches are created as <strong>ACTIVE</strong>. The owner can
            immediately assign staff, set full branch identity, and use the
            branch on invoices, delivery notes, proformas, and payment details.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={editModalOpen}
        title="Edit branch"
        subtitle="Update branch identity, contact detail, payment detail, and document branding without touching business history."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateBranch}
              disabled={
                modalSubmitting || !safe(editForm.name) || !safe(editForm.code)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <BranchIdentityFields
            form={editForm}
            setForm={setEditForm}
            disabled={modalSubmitting}
          />
        </div>
      </OverlayModal>

      <OverlayModal
        open={closeModalOpen}
        title="Close branch"
        subtitle="Closing a branch keeps history but stops it from being treated as active."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={closeBranch}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Closing..." : "Confirm close"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Branch: <strong>{safe(activeLocation?.name)}</strong> (
            {safe(activeLocation?.code)})
          </div>

          <div>
            <FieldLabel htmlFor="close-reason">Reason</FieldLabel>
            <FormTextarea
              id="close-reason"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Why is this branch being closed?"
            />
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={archiveModalOpen}
        title="Archive branch"
        subtitle="Archived branches stay in history but are removed from normal active operations."
        onClose={closeAllBranchModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllBranchModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={archiveBranch}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Archiving..." : "Confirm archive"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Branch: <strong>{safe(activeLocation?.name)}</strong> (
            {safe(activeLocation?.code)})
          </div>

          <div>
            <FieldLabel htmlFor="archive-reason">Reason</FieldLabel>
            <FormTextarea
              id="archive-reason"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Why is this branch being archived?"
            />
          </div>
        </div>
      </OverlayModal>
    </>
  );
}
