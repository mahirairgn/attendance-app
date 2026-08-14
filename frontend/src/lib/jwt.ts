// src/lib/jwt.ts
export interface TokenPayload {
  sub: number;
  email: string;
  role: 'admin' | 'employee';
}

export function decodeToken(): TokenPayload | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}