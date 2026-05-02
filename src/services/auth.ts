
import { api } from "./api";
import { setSession, clearSession, SessionUser } from "./session";

export async function signup(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  const res = await api<{ token: string; user: SessionUser }>("/api/auth/signup", {
    method: "POST",
    json: input,
  });

  await setSession(res.token, res.user);

  return res.user;
}

export async function login(input: { email: string; password: string; force?: boolean }): Promise<SessionUser> {
  const res = await api<{ token: string; user: SessionUser }>("/api/auth/login", {
    method: "POST",
    json: input,
  });

  await setSession(res.token, res.user);

  return res.user;
}

export async function logout() {
  await clearSession();
}

