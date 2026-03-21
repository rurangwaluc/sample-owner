"use client";

import { useRouter } from "next/navigation";

function safe(v) {
  return String(v ?? "").trim();
}

export default function RoleBar({
  title = "Owner",
  subtitle = "",
  right = null,
  onLogout = null,
}) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900">
            {safe(title)}
          </div>
          {safe(subtitle) ? (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {safe(subtitle)}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {right}

          <button
            type="button"
            onClick={() => router.refresh()}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            title="Refresh"
          >
            Refresh
          </button>

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-900"
              title="Logout"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
