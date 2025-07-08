import { cookies } from "next/headers";
import type { UserProfileDto } from "@na/schema";

// Backend API base URL
const API_BASE_URL = process.env.BACKEND_HOST || "http://localhost:3001";

// Cookie name for storing JWT token
export const AUTH_COOKIE_NAME = "auth_token";

/**
 * Get JWT token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Verify JWT token with backend and get user profile
 */
export async function verifyToken(
  token: string,
): Promise<UserProfileDto | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const user: UserProfileDto = await response.json();
    return user;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Get authenticated user from cookies
 * Returns user profile if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<UserProfileDto | null> {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}

/**
 * Check if JWT token is expired (basic check without verification)
 * This is a client-side helper for token refresh timing
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't parse, consider it expired
  }
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp;
  } catch (error) {
    return null;
  }
}
