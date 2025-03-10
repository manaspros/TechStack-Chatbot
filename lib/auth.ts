import { getSession as getAuth0Session } from "@auth0/nextjs-auth0";
import { cookies, headers } from "next/headers";

/**
 * Gets the Auth0 session for the Next.js App Router
 * This wrapper handles the App Router compatibility
 */
export async function getSession() {
  try {
    // In Next.js App Router, we need to pass headers and cookies
    // as Auth0 SDK requires explicit context
    const req = {
      headers: headers(),
      cookies: cookies(),
    };
    const res = {};
    return await getAuth0Session(req, res);
  } catch (error) {
    console.error("Failed to get Auth0 session:", error);
    return null;
  }
}

/**
 * This is a wrapper around the Auth0 withApiAuthRequired function
 * that works with Next.js App Router
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  return session;
}

/**
 * Utility function to extract user ID from session
 * Handles error cases gracefully
 */
export async function getUserId() {
  const session = await getSession();
  return session?.user?.sub || null;
}

/**
 * Helper to check if the user is authenticated
 * Returns a boolean rather than throwing an error
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!(session && session.user);
}
