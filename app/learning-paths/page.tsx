"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningProgress } from '@/models/LearningProgress';
import { learningService } from '@/utils/learningService';
import { getSessionId } from '@/utils/sessionUtils';
import ProgressBar from '../components/ProgressBar';
import LearningPathProgress from '../components/LearningPathProgress';

const LearningPathsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [learningPaths, setLearningPaths] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePathId, setActivePathId] = useState<string | null>(searchParams.get('pathId'));
  const [sessionId, setSessionId] = useState<string>('');

  // Fetch learning paths using session ID instead of user authentication
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use session ID for tracking progress
        const currentSessionId = getSessionId();
        setSessionId(currentSessionId);
        
        // Fetch learning paths using session
        fetchLearningPaths();
      } catch (err: any) {
        console.error('Error initializing session:', err);
        setError(err.message || 'Failed to initialize session');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch learning paths for the current session
  const fetchLearningPaths = async () => {
    setLoading(true);
    try {
      // Don't rely on user ID, use session ID internally
      const result = await learningService.getUserLearningPaths();
      setLearningPaths(result.learningPaths || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching learning paths:', err);
      setError(err.message || 'Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle selecting a learning path
  const handlePathSelect = (pathId: string) => {
    setActivePathId(pathId);
    
    // Update URL to include the path ID
    const url = new URL(window.location.href);
    url.searchParams.set('pathId', pathId);
    window.history.pushState({}, '', url.toString());
  };

  // Back to list view
  const handleBackToList = () => {
    setActivePathId(null);
    
    // Remove path ID from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('pathId');
    window.history.pushState({}, '', url.toString());
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    // Save current path to return after login
    localStorage.setItem('returnPath', '/learning-paths');
    router.push('/login');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700">Loading learning paths...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-red-500 font-medium text-lg mb-4">{error}</div>
            <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
              
              {error.includes('authentication') || error.includes('log in') ? (
                <button
                  onClick={handleLoginRedirect}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Go to Login
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active path view
  if (activePathId) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to All Learning Paths
            </button>
          </div>
          
          {/* Pass only the progressId, without requiring a userID */}
          <LearningPathProgress progressId={activePathId} />
        </div>
      </div>
    );
  }

  // List view of learning paths
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Learning Paths</h1>

        {learningPaths.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-xl text-gray-700 mb-4">No learning paths found</h3>
            <p className="text-gray-600 mb-6">
              You don't have any active learning paths. Chat with the AI assistant and ask for a
              learning path to get started.
            </p>
            <button
              onClick={() => router.push('/chatbot')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start a New Learning Path
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {learningPaths.map((path) => (
              <div
                key={path._id}
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePathSelect(path._id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {path.title}
                    </h3>
                    <div className="flex items-center">
                      {path.isCompleted ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {path.description && (
                    <p className="text-gray-600 mb-4 text-sm">{path.description}</p>
                  )}

                  <div className="mb-3">
                    <ProgressBar
                      progress={path.completedSteps}
                      total={path.totalSteps}
                      height={6}
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      <span>
                        {path.difficulty && (
                          <span className="mr-2 capitalize">{path.difficulty}</span>
                        )}
                        {path.estimatedTimeToComplete && (
                          <span className="mr-4">• {path.estimatedTimeToComplete}</span>
                        )}
                      </span>
                      <span>{path.totalSteps} Steps</span>
                    </div>
                    <div>
                      Last accessed {formatDate(path.lastAccessedAt)}
                    </div>
                  </div>
                  
                  {/* Display API error message if present in path data */}
                  {path.apiError && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-600">
                        <span className="font-medium">API Error:</span> Content may be incomplete due to an API issue. 
                        <button 
                          className="ml-2 underline text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchLearningPaths();
                          }}
                        >
                          Retry
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Display global API error message if applicable */}
        {error && error.includes('Gemini API') && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-lg font-medium text-yellow-800">API Connection Issue</h3>
            <p className="text-sm text-yellow-700 mt-1">
              We're experiencing issues connecting to our AI service. Some learning path content may be limited.
              Our team has been notified and is working to resolve this issue.
            </p>
            <button
              onClick={() => fetchLearningPaths()}
              className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathsPage;