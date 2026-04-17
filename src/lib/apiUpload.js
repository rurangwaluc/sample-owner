function normalizeBase(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

const BASE = normalizeBase(
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL,
);

function resolveUrl(path) {
  const clean = String(path || "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${BASE}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

function toFileList(files) {
  return Array.from(files || []).filter(Boolean);
}

function normalizeUploadedUrls(data) {
  return Array.isArray(data?.urls) ? data.urls : [];
}

function buildAttachmentObjects(files, urls) {
  const len = Math.min(files.length, urls.length);
  const out = [];

  for (let i = 0; i < len; i += 1) {
    const file = files[i];
    const fileUrl = String(urls[i] || "").trim();
    if (!file || !fileUrl) continue;

    out.push({
      fileUrl,
      originalName: file.name || null,
      contentType: file.type || null,
      fileSize: Number.isFinite(file.size) ? file.size : null,
      absoluteUrl: resolveUrl(fileUrl),
    });
  }

  return out;
}

export async function uploadFiles(files) {
  if (!BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE in environment. Restart dev server after setting it.",
    );
  }

  const list = toFileList(files);
  if (!list.length) {
    return { files: [], urls: [], absoluteUrls: [], attachments: [] };
  }

  const form = new FormData();
  for (const file of list) {
    form.append("files", file);
  }

  const res = await fetch(`${BASE}/uploads`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json()
    : { error: await res.text() };

  if (!res.ok) {
    const err = new Error(data?.error || `Upload failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const urls = normalizeUploadedUrls(data);
  const absoluteUrls = urls.map(resolveUrl);
  const attachments = buildAttachmentObjects(list, urls);

  return {
    ...data,
    urls,
    absoluteUrls,
    attachments,
  };
}

export async function uploadExpenseProofs(files) {
  const result = await uploadFiles(files);
  return result.attachments;
}

export function resolveAssetUrl(path) {
  return resolveUrl(path);
}
