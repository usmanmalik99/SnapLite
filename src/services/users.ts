import { api } from "./api";

export async function findUserByEmail(email: string): Promise<{ id: string; email: string; firstName: string; lastName: string }> {
  return api(`/api/users/by-email?email=${encodeURIComponent(email)}`);
}
