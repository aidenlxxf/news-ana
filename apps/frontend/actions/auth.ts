"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserProfileDto } from "@na/schema";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { login, register } from "@/lib/api";

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 24 * 60 * 60, // 24 hours
  path: "/",
};

type LoginActionState =
  | { success: false; error: string }
  | { success: true; user: UserProfileDto }
  | null;

/**
 * Login action
 */
export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return {
      success: false,
      error: "Username and password are required",
    };
  }

  try {
    const authResponse = await login(username, password);

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set(
      AUTH_COOKIE_NAME,
      authResponse.access_token,
      COOKIE_OPTIONS,
    );
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
  redirect("/");
}

/**
 * Register action
 */
export async function registerAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || !password || !confirmPassword) {
    return {
      success: false,
      error: "All fields are required",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Passwords do not match",
    };
  }

  try {
    const authResponse = await register(username, password);

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set(
      AUTH_COOKIE_NAME,
      authResponse.access_token,
      COOKIE_OPTIONS,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
  redirect("/");
}

/**
 * Logout action
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
