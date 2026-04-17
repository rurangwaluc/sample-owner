"use client";

function normalizeBase(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function getApiBaseUrl() {
  const nextEnvUrl =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  if (nextEnvUrl) {
    return normalizeBase(nextEnvUrl);
  }

  const viteEnvUrl =
    typeof import.meta !== "undefined" &&
    import.meta?.env &&
    (import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_BACKEND_URL);

  if (viteEnvUrl) {
    return normalizeBase(viteEnvUrl);
  }

  return "http://localhost:4000";
}

async function readErrorSafe(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      return data?.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  try {
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function getPurchaseOrderPdfUrl(
  purchaseOrderId,
  { download = false } = {},
) {
  const id = Number(purchaseOrderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid purchase order id");
  }

  const baseUrl = getApiBaseUrl();
  const query = download ? "?download=1" : "";

  return `${baseUrl}/purchase-orders/${id}/pdf${query}`;
}

export async function previewPurchaseOrderPdf(purchaseOrderId) {
  const id = Number(purchaseOrderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid purchase order id");
  }

  const url = getPurchaseOrderPdfUrl(id);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await readErrorSafe(
      response,
      "Failed to preview purchase order PDF",
    );
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    window.URL.revokeObjectURL(objectUrl);
    throw new Error("Popup blocked while opening purchase order PDF preview");
  }

  previewWindow.location.href = objectUrl;

  setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60000);
}

export async function downloadPurchaseOrderPdf(
  purchaseOrderId,
  fallbackName = "",
) {
  const id = Number(purchaseOrderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid purchase order id");
  }

  const url = getPurchaseOrderPdfUrl(id, { download: true });

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await readErrorSafe(
      response,
      "Failed to download purchase order PDF",
    );
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  const disposition = response.headers.get("content-disposition") || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);

  const serverFileName = utf8Match?.[1]
    ? decodeURIComponent(utf8Match[1])
    : plainMatch?.[1]
      ? plainMatch[1]
      : "";

  const fileName = serverFileName || fallbackName || `purchase-order-${id}.pdf`;

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(objectUrl);
}
