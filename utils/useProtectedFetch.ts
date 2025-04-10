"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Custom hook for making authenticated API requests
 */
const useProtectedFetch = () => {
  const { getAccessTokenSilently, user, isAuthenticated, loginWithRedirect, getAccessTokenWithPopup } = useAuth0();
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [cachedUser, setCachedUser] = useState<any>(null);

  // Store auth state in session storage for persistence
  useEffect(() => {
    // Load cached user from session storage on mount
    const storedUser = sessionStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setCachedUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Update stored user when Auth0 user changes
    if (user) {
      setCachedUser(user);
      sessionStorage.setItem('auth_user', JSON.stringify(user));
    }
  }, [user]);
  
  /**
   * Get the authentication token, with retries if necessary
   */
  const getToken = useCallback(async () => {
    // Try to use cached token first
    if (cachedToken) {
      return cachedToken;
    }
    
    try {
      console.log('Getting Auth0 token silently...');
      let token;
      
      try {
        // First try silent token acquisition
        token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          },
          timeoutInSeconds: 60,
          detailedResponse: false,
          cacheMode: 'off', // Don't use Auth0 internal cache to ensure fresh token
        });
      } catch (silentError) {
        // If silent acquisition fails, try with popup as fallback
        console.log('Silent token acquisition failed, trying popup...');
        token = await getAccessTokenWithPopup({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          }
        });
      }
      
      if (token) {
        console.log('Auth0 token received successfully');
        setCachedToken(token);
        // Also store in session storage for page refreshes
        sessionStorage.setItem('auth_token', token);
        return token;
      } else {
        throw new Error('No token received from Auth0');
      }
    } catch (error: any) {
      console.error('Failed to get Auth0 token:', error);
      
      // Clear any expired/invalid tokens
      setCachedToken(null);
      sessionStorage.removeItem('auth_token');
      
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login...');
        // Store current path to return after login
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('returnPath', currentPath);
        
        // Use replace: true to avoid issues with browser history
        loginWithRedirect({
          appState: { returnTo: currentPath },
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
            redirect_uri: window.location.origin
          }
        });
        
        // Return null for now since we're redirecting
        return null;
      }
      
      throw new Error('Failed to get authentication token');
    }
  }, [getAccessTokenSilently, getAccessTokenWithPopup, isAuthenticated, loginWithRedirect, cachedToken]);
  
  /**
   * Get user information, with fallback to cached user
   */
  const getUserInfo = useCallback(async () => {
    try {
      // First, try to use Auth0 current user
      if (user) {
        console.log('Using current Auth0 user:', user.sub);
        return user;
      }
      
      // If no user from Auth0 but we have a cached user, use that
      if (cachedUser) {
        console.log('Using cached user:', cachedUser.sub);
        return cachedUser;
      }
      
      // Try to get a token which will force authentication if needed
      const token = await getToken();
      if (!token) {
        console.log('No token available, cannot get user info');
        throw new Error('No authentication token available');
      }
      
      // If we have a token but no user info yet, the user might be authenticated
      // but the user object hasn't been populated yet in Auth0 context
      console.log('Have token but no user info, waiting for Auth0 context to update...');
      
      // Wait briefly to see if Auth0 context updates with user info
      return new Promise((resolve, reject) => {
        let retryCount = 0;
        const checkForUser = setInterval(() => {
          if (user) {
            clearInterval(checkForUser);
            setCachedUser(user);
            sessionStorage.setItem('auth_user', JSON.stringify(user));
            resolve(user);
          } else if (retryCount > 5) { // Give up after 5 retries
            clearInterval(checkForUser);
            reject(new Error('User information not available despite having valid token'));
          }
          retryCount++;
        }, 500); // Check every 500ms
      });
    } catch (error: any) {
      console.error('Failed to get user information:', error);
      throw error;
    }
  }, [user, cachedUser, getToken]);

  return { getToken, getUserInfo };
};

export default useProtectedFetch;
