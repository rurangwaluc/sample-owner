"use client";

export function Card({
  title,
  subtitle,
  right = null,
  children,
  className = "",
}) {
  return (
    <div
      className={
        "bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden " +
        className
      }
    >
      {title || subtitle || right ? (
        <div className="px-5 py-4 border-b border-zinc-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <div className="text-sm font-semibold text-zinc-900">{title}</div>
            ) : null}
            {subtitle ? (
              <div className="text-xs text-zinc-600 mt-1">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}

      <div className="p-5">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900 mt-1">{value}</div>
      {sub ? <div className="text-xs text-zinc-600 mt-1">{sub}</div> : null}
    </div>
  );
}

export function SoftButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className={
        "px-4 py-2 rounded-xl border border-zinc-300 text-sm font-medium " +
        (disabled
          ? "bg-zinc-100 text-zinc-400"
          : "bg-white text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100") +
        " " +
        className
      }
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className={
        "px-4 py-2 rounded-xl text-sm font-semibold " +
        (disabled
          ? "bg-zinc-300 text-white"
          : "bg-zinc-900 text-white hover:bg-black active:bg-zinc-800") +
        " " +
        className
      }
    >
      {children}
    </button>
  );
}

export function Table({ columns = [], rows = [], emptyText = "No records." }) {
  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-zinc-700">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={
                  "p-3 font-semibold text-xs uppercase tracking-wide " +
                  (c.align === "right" ? "text-right" : "text-left")
                }
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-zinc-600">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.__key || idx} className="border-t border-zinc-100">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={
                      "p-3 text-zinc-800 " +
                      (c.align === "right" ? "text-right" : "text-left")
                    }
                  >
                    {typeof c.render === "function" ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
