import {
  handleAuth,
  handleCallback,
  handleLogin,
} from "@auth0/nextjs-auth0/edge";
import { NextRequest } from "next/server";

// Export Auth0 handlers with custom configuration
export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      // Specify scope explicitly
      scope: process.env.AUTH0_SCOPE,
      // Add audience if you're using API
      // audience: process.env.AUTH0_AUDIENCE,
    },
    returnTo: "/chatbot", // Default return URL after login
  }),
  callback: handleCallback({
    afterCallback: (req: any, res: any, session: any) => {
      // Custom logic after successful authentication (if needed)
      return session;
    },
  }),
});

// Also handle POST requests for specific Auth0 flows
export const POST = GET;
