"use client";

import {
  AlertBox,
  FieldLabel,
  FormInput,
  FormSelect,
  OverlayModal,
  safe,
} from "./OwnerShared";

const STAFF_ROLE_OPTIONS = [
  "admin",
  "manager",
  "store_keeper",
  "seller",
  "cashier",
];

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.11 4.93" />
      <path d="M6.61 6.61A17.32 17.32 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 5.39-1.39" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <FormInput
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pr-14"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

export default function StaffModals({
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
}) {
  return (
    <>
      <OverlayModal
        open={createUserModalOpen}
        title="Create user"
        subtitle="Create a new staff account under an active branch."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createUser}
              disabled={
                modalSubmitting ||
                !safe(createUserForm.name) ||
                !safe(createUserForm.email) ||
                !String(createUserForm.password || "").trim() ||
                !safe(createUserForm.role) ||
                !safe(createUserForm.locationId)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Creating..." : "Create user"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div>
            <FieldLabel htmlFor="create-user-name">Full name</FieldLabel>
            <FormInput
              id="create-user-name"
              value={createUserForm.name}
              onChange={(e) =>
                setCreateUserForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="e.g. Jean Claude"
            />
          </div>

          <div>
            <FieldLabel htmlFor="create-user-email">Email</FieldLabel>
            <FormInput
              id="create-user-email"
              type="email"
              value={createUserForm.email}
              onChange={(e) =>
                setCreateUserForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="user@business.com"
            />
          </div>

          <PasswordField
            id="create-user-password"
            label="Password"
            value={createUserForm.password}
            onChange={(e) =>
              setCreateUserForm((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            placeholder="Minimum 8 characters"
            show={createUserShowPassword}
            onToggle={() => setCreateUserShowPassword((prev) => !prev)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="create-user-role">Role</FieldLabel>
              <FormSelect
                id="create-user-role"
                value={createUserForm.role}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                {STAFF_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="create-user-branch">
                Active branch
              </FieldLabel>
              <FormSelect
                id="create-user-branch"
                value={createUserForm.locationId}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({
                    ...prev,
                    locationId: e.target.value,
                  }))
                }
              >
                <option value="">Select active branch</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {safe(location.name)}{" "}
                    {safe(location.code) ? `(${safe(location.code)})` : ""}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Only <strong>ACTIVE</strong> branches can receive new users.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={editUserModalOpen}
        title="Edit user"
        subtitle="Update role, branch assignment, and account state."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateUser}
              disabled={
                modalSubmitting ||
                !safe(editUserForm.name) ||
                !safe(editUserForm.role) ||
                !safe(editUserForm.locationId)
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

          <div>
            <FieldLabel htmlFor="edit-user-name">Full name</FieldLabel>
            <FormInput
              id="edit-user-name"
              value={editUserForm.name}
              onChange={(e) =>
                setEditUserForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Full name"
            />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300 break-all">
            Email: <strong>{safe(activeUser?.email) || "-"}</strong>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="edit-user-role">Role</FieldLabel>
              <FormSelect
                id="edit-user-role"
                value={editUserForm.role}
                onChange={(e) =>
                  setEditUserForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                {STAFF_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FieldLabel htmlFor="edit-user-branch">Active branch</FieldLabel>
              <FormSelect
                id="edit-user-branch"
                value={editUserForm.locationId}
                onChange={(e) =>
                  setEditUserForm((prev) => ({
                    ...prev,
                    locationId: e.target.value,
                  }))
                }
              >
                <option value="">Select active branch</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {safe(location.name)}{" "}
                    {safe(location.code) ? `(${safe(location.code)})` : ""}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="edit-user-status">Account status</FieldLabel>
            <FormSelect
              id="edit-user-status"
              value={editUserForm.isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(e) =>
                setEditUserForm((prev) => ({
                  ...prev,
                  isActive: e.target.value === "ACTIVE",
                }))
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </FormSelect>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Branch reassignment is allowed only to <strong>ACTIVE</strong>{" "}
            branches.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={resetPasswordModalOpen}
        title="Reset user password"
        subtitle="Set a new password for this staff account in a controlled owner-only workflow."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={resetUserPassword}
              disabled={
                modalSubmitting ||
                !String(resetPasswordForm.password || "").trim() ||
                String(resetPasswordForm.password || "") !==
                  String(resetPasswordForm.confirmPassword || "")
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            User: <strong>{safe(activeUser?.name)}</strong> —{" "}
            {safe(activeUser?.email)}
          </div>

          <PasswordField
            id="reset-user-password"
            label="New password"
            value={resetPasswordForm.password}
            onChange={(e) =>
              setResetPasswordForm((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            placeholder="Minimum 8 characters"
            show={resetUserShowPassword}
            onToggle={() => setResetUserShowPassword((prev) => !prev)}
          />

          <PasswordField
            id="reset-user-confirm-password"
            label="Confirm new password"
            value={resetPasswordForm.confirmPassword}
            onChange={(e) =>
              setResetPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Re-enter the new password"
            show={resetUserShowConfirmPassword}
            onToggle={() => setResetUserShowConfirmPassword((prev) => !prev)}
          />

          {String(resetPasswordForm.confirmPassword || "").trim() &&
          String(resetPasswordForm.password || "") !==
            String(resetPasswordForm.confirmPassword || "") ? (
            <AlertBox message="Password confirmation does not match." />
          ) : null}

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            Use password reset only for a legitimate operational reason. The
            user should be informed to sign in with the new password and change
            it if your policy requires that.
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={deactivateUserModalOpen}
        title="Deactivate user"
        subtitle="This removes active access without deleting business history."
        onClose={closeAllUserModals}
        footer={
          <>
            <button
              type="button"
              onClick={closeAllUserModals}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={deactivateUser}
              disabled={modalSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
            >
              {modalSubmitting ? "Deactivating..." : "Confirm deactivate"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <AlertBox message={modalError} />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            User: <strong>{safe(activeUser?.name)}</strong> —{" "}
            {safe(activeUser?.email)}
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
            This keeps sales, audit, and branch history intact while removing
            active access.
          </div>
        </div>
      </OverlayModal>
    </>
  );
}
