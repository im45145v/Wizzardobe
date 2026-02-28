/**
 * Authentication placeholder.
 * Clean user isolation with structured auth support.
 *
 * Replace with actual auth provider (NextAuth, Clerk, etc.) in production.
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Get the current authenticated user.
 * Placeholder: returns a demo user for development.
 * In production, this reads from session/JWT.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // Placeholder: check for auth header or session
  // In production, integrate with your auth provider
  const demoUserId = process.env.DEMO_USER_ID;

  if (demoUserId) {
    return {
      id: demoUserId,
      email: "demo@wizzardobe.com",
      name: "Demo User",
    };
  }

  return null;
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
