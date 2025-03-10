declare module "@auth0/nextjs-auth0/client" {
  import { ReactNode } from "react";

  export interface UserProfile {
    name?: string;
    nickname?: string;
    picture?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    [key: string]: any;
  }

  export interface UserContext {
    user?: UserProfile;
    error?: Error;
    isLoading: boolean;
  }

  export interface UserProviderProps {
    children: ReactNode;
  }

  export function UserProvider({ children }: UserProviderProps): JSX.Element;
  export function useUser(): UserContext;
  export function withPageAuthRequired<P = any>(
    Component: React.ComponentType<P>,
    options?: any
  ): React.ComponentType<P>;
}

declare module "@auth0/nextjs-auth0" {
  import { NextApiRequest, NextApiResponse } from "next";
  import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

  export interface Session {
    user: {
      name?: string;
      nickname?: string;
      picture?: string;
      sub?: string;
      email?: string;
      email_verified?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export function handleAuth(
    options?: any
  ): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

  export function getSession(
    req: NextApiRequest | GetServerSidePropsContext["req"],
    res: NextApiResponse | GetServerSidePropsContext["res"]
  ): Promise<Session | null | undefined>;

  export function withApiAuthRequired<T>(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T>
  ): (req: NextApiRequest, res: NextApiResponse) => Promise<T>;

  export function withPageAuthRequired<P = any>(
    options?: any
  ): (
    context: GetServerSidePropsContext
  ) => Promise<GetServerSidePropsResult<P>>;
}
