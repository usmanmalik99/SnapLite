import { API_URL } from "./api";
import { getSessionToken } from "./session";

// Keep this wrapper for screens that use apiGet/apiPost.
// NOTE: The server in /server runs on PORT 5001 by default.
const BASE_URL = API_URL;

async function request(path: string, opts: RequestInit) {
  const token = await getSessionToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export function apiGet(path: string) {
  return request(path, { method: "GET" });
}

export function apiPost(path: string, body: any) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}
