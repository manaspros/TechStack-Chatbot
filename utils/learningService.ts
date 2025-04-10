import { LearningProgress } from '../models/LearningProgress';
import { getSessionId, getPathAccessToken, setPathAccessToken } from './sessionUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Service for interacting with the learning progress API
 */
class LearningService {
  /**
   * Get all learning paths for the current session
   * @param userIdOrIgnored - Optional userId (for backwards compatibility)
   * @param page - Page number for pagination
   * @param limit - Number of results per page
   */
  async getUserLearningPaths(userIdOrIgnored: string = '', page: number = 1, limit: number = 10): Promise<{learningPaths: LearningProgress[], pagination: any}> {
    // Get session ID
    const sessionId = getSessionId();
    
    try {
      // First try with session ID approach
      console.log("Trying to fetch learning paths using session ID:", sessionId);
      
      // IMPORTANT: For backward compatibility, use the original endpoint but add session header
      const response = await fetch(
        `${API_BASE_URL}/learning/${userIdOrIgnored || sessionId}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch learning paths: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Session-based fetch failed, trying public fallback:", error);
      
      // Fallback to public paths if session approach fails
      const publicResponse = await fetch(
        `${API_BASE_URL}/learning/public?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!publicResponse.ok) {
        throw new Error(`Failed to fetch learning paths: ${publicResponse.statusText}`);
      }
      
      return await publicResponse.json();
    }
  }

  /**
   * Get a specific learning path by ID without requiring user ID
   * @param progressId - The learning path ID
   * @param userIdIgnored - Optional userId (for backwards compatibility)
   */
  async getLearningPath(progressId: string, userIdIgnored: string = ''): Promise<{learningPath: LearningProgress}> {
    console.log(`getLearningPath called with progressId: ${progressId}`);
    
    // Multiple approaches to get the learning path
    const sessionId = getSessionId();
    const pathToken = getPathAccessToken(progressId);
    
    // Try these approaches in sequence until one works
    const approaches = [
      this.getLearningPathViaEndpoint.bind(this, progressId, sessionId, pathToken),
      this.getLearningPathByToken.bind(this, progressId, pathToken),
      this.getLearningPathDirectAccess.bind(this, progressId)
    ];
    
    let lastError;
    for (const approach of approaches) {
      try {
        return await approach();
      } catch (error) {
        lastError = error;
        console.log("Approach failed, trying next method...");
      }
    }
    
    // If all approaches fail, throw the last error
    throw lastError || new Error("Failed to access learning path using all available methods");
  }
  
  // Method 1: Try to get learning path via the main API endpoint
  private async getLearningPathViaEndpoint(
    progressId: string, 
    sessionId: string, 
    pathToken: string | null
  ): Promise<{learningPath: LearningProgress}> {
    console.log("Attempting to access learning path via main API endpoint");
    
    // Make request to the most likely endpoint, including userId as a query parameter
    // since it's required by the backend but GET requests don't have bodies
    const response = await fetch(`${API_BASE_URL}/learning/path/${progressId}?userId=${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        ...(pathToken ? { 'X-Path-Token': pathToken } : {})
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If the response contains a path token, store it for future access
    if (data.pathToken) {
      setPathAccessToken(progressId, data.pathToken);
    }
    
    console.log('Learning path response:', data);
    return data;
  }

  /**
   * Method 2: Access path by direct token (no auth required)
   */
  private async getLearningPathByToken(
    progressId: string, 
    accessToken: string | null
  ): Promise<{learningPath: LearningProgress}> {
    if (!accessToken) {
      throw new Error("No access token available for this path");
    }
    
    console.log("Attempting to access learning path using stored token");
    
    const response = await fetch(`${API_BASE_URL}/learning/access/${progressId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }
  
  /**
   * Method 3: Last resort - try direct public access
   */
  private async getLearningPathDirectAccess(
    progressId: string
  ): Promise<{learningPath: LearningProgress}> {
    console.log("Attempting public direct access to learning path");
    
    const response = await fetch(`${API_BASE_URL}/learning/public/${progressId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  /**
   * Update a step's completion status
   */
  async updateStepCompletion(
    progressId: string, 
    stepId: string, 
    completed: boolean,
    userId: string = '' // Keep for backwards compatibility
  ): Promise<{success: boolean, learningPath: LearningProgress}> {
    const sessionId = getSessionId();
    const pathToken = getPathAccessToken(progressId);
    
    // Log the request being sent
    console.log(`Sending update step completion request for step ${stepId} in path ${progressId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/learning/${progressId}/step`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
          ...(pathToken ? { 'X-Path-Token': pathToken } : {})
        },
        body: JSON.stringify({
          stepId,
          completed,
          userId: sessionId // Send sessionId as userId for compatibility with backend
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Step completion update error:', errorData);
      throw new Error(`Failed to update step: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Add notes to a learning step
   */
  async addStepNotes(
    progressId: string, 
    stepId: string, 
    notes: string,
    userId: string = '' // Keep for backwards compatibility
  ): Promise<{success: boolean, learningPath: LearningProgress}> {
    const sessionId = getSessionId();
    const pathToken = getPathAccessToken(progressId);
    
    // Log the request being sent
    console.log(`Sending add notes request for step ${stepId} in path ${progressId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/learning/${progressId}/notes`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
          ...(pathToken ? { 'X-Path-Token': pathToken } : {})
        },
        body: JSON.stringify({
          stepId,
          notes,
          userId: sessionId // Send sessionId as userId for compatibility with backend
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Adding notes error:', errorData);
      throw new Error(`Failed to update notes: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new learning path
   */
  async createLearningPath(pathData: any): Promise<{learningPath: LearningProgress}> {
    const sessionId = getSessionId();
    
    // Add sessionId to pathData for tracking
    const enhancedPathData = {
      ...pathData,
      sessionId
    };
    
    const response = await fetch(
      `${API_BASE_URL}/learning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(enhancedPathData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create learning path: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a learning path
   * @param progressId - The ID of the learning path to delete
   */
  async deleteLearningPath(progressId: string): Promise<{success: boolean, deletedId: string}> {
    const sessionId = getSessionId();
    const pathToken = getPathAccessToken(progressId);
    
    console.log(`Attempting to delete learning path: ${progressId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/learning/${progressId}?userId=${sessionId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
          ...(pathToken ? { 'X-Path-Token': pathToken } : {})
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Delete learning path error:', errorData);
      throw new Error(`Failed to delete learning path: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export const learningService = new LearningService();