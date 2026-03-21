import { apiFetch } from "./api";

export async function getMe() {
  // ✅ choose ONE based on backend
  return apiFetch("/auth/me", { method: "GET" }); // or "/auth/me"
}

export async function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function logout() {
  // if your backend has it; otherwise just redirect client-side
  try {
    await apiFetch("/auth/logout", { method: "POST", body: {} });
  } catch {
    // ignore
  }
}
