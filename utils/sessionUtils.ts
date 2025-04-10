/**
 * Session management utility to maintain consistent access
 * without relying on user authentication
 */

// Generate a persistent session ID that survives page reloads
export const getSessionId = (): string => {
  // Check if we already have a session ID in localStorage
  let sessionId = localStorage.getItem('learning_session_id');
  
  // If not, create a new one and store it
  if (!sessionId) {
    sessionId = generateUniqueId();
    localStorage.setItem('learning_session_id', sessionId);
  }
  
  return sessionId;
};

// Generate a unique ID for anonymous sessions
const generateUniqueId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 12);
  return `anon_${timestamp}_${randomStr}`;
};

// Get path access token for a specific learning path
export const getPathAccessToken = (pathId: string): string | null => {
  return localStorage.getItem(`path_token_${pathId}`);
};

// Set path access token for a specific learning path
export const setPathAccessToken = (pathId: string, token: string): void => {
  localStorage.setItem(`path_token_${pathId}`, token);
};

// Clear session data
export const clearSession = (): void => {
  localStorage.removeItem('learning_session_id');
  
  // Also clear any path tokens
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('path_token_')) {
      localStorage.removeItem(key);
    }
  });
};
