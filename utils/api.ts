// If this file doesn't exist, create it with the following content:

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get authentication token from session storage or Auth0
 */
const getAuthToken = async (): Promise<string | null> => {
  // Try to get token from session storage first
  const sessionToken = sessionStorage.getItem('auth_token');
  if (sessionToken) {
    return sessionToken;
  }
  
  // If in browser and window.auth0 is available, try to get token from Auth0
  if (typeof window !== 'undefined' && (window as any).auth0Client) {
    try {
      const token = await (window as any).auth0Client.getTokenSilently({
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
      });
      
      if (token) {
        // Cache token in session storage
        sessionStorage.setItem('auth_token', token);
        return token;
      }
    } catch (error) {
      console.error('Failed to get Auth0 token:', error);
    }
  }
  
  return null;
};

/**
 * Helper function to make API requests with authorization
 */
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const endpoint = url.startsWith('http') ? url : `${API_BASE_URL}/api${url}`;
  
  // Try to get auth token
  const token = await getAuthToken();
  
  // Add headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      // Handle 401 by clearing token
      if (response.status === 401) {
        sessionStorage.removeItem('auth_token');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  } catch (error) {
    console.error(`API request error (${endpoint}):`, error);
    throw error;
  }
};

// API method helpers
export const get = (url: string, options: RequestInit = {}) => 
  apiRequest(url, { ...options, method: 'GET' });

export const post = (url: string, data: any, options: RequestInit = {}) => 
  apiRequest(url, { ...options, method: 'POST', body: JSON.stringify(data) });

export const put = (url: string, data: any, options: RequestInit = {}) => 
  apiRequest(url, { ...options, method: 'PUT', body: JSON.stringify(data) });

export const del = (url: string, options: RequestInit = {}) => 
  apiRequest(url, { ...options, method: 'DELETE' });
