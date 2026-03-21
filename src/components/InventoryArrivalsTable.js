"use client";

function safeDate(v) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export default function InventoryArrivalsTable({ rows }) {
  const list = Array.isArray(rows) ? rows : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">Product</th>
            <th className="text-right p-3">Qty</th>
            <th className="text-left p-3">Notes</th>
            <th className="text-left p-3">Docs</th>
            <th className="text-left p-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => {
            const docs = Array.isArray(a.documents) ? a.documents : [];
            return (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-medium">{a.id}</td>
                <td className="p-3">
                  #{a.productId} {a.productName ? `• ${a.productName}` : ""}
                </td>
                <td className="p-3 text-right">{a.qtyReceived}</td>
                <td className="p-3">{a.notes || "-"}</td>

                <td className="p-3">
                  {docs.length ? (
                    <div className="flex flex-col gap-1">
                      {docs.map((d) => (
                        <a
                          key={d.id || d.fileUrl}
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          Open document
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No docs</span>
                  )}
                </td>

                <td className="p-3">{safeDate(a.createdAt)}</td>
              </tr>
            );
          })}

          {list.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-gray-600">
                No arrivals found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
