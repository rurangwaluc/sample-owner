import { apiFetch } from "./api";

export async function getMe() {
  return apiFetch("/auth/me", {
    method: "GET",
    credentials: "include",
  });
}

export async function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    credentials: "include",
    body: {
      email: String(email || "")
        .trim()
        .toLowerCase(),
      password: String(password || ""),
    },
  });
}

export async function logout() {
  try {
    return await apiFetch("/auth/logout", {
      method: "POST",
      credentials: "include",
      body: {},
    });
  } catch {
    return null;
  }
}
