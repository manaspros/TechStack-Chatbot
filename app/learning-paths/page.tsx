"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningProgress } from '@/models/LearningProgress';
import { learningService } from '@/utils/learningService';
import { getSessionId } from '@/utils/sessionUtils';
import ProgressBar from '../components/ProgressBar';
import LearningPathProgress from '../components/LearningPathProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Clock, Grid, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  // Format learning path title to remove redundancy
  const formatPathTitle = (title: string) => {
    // Remove redundant "Learning Path: " prefix if present
    return title.replace(/^Learning Path: /i, '');
  };

  // Format learning path description to clean it up
  const formatPathDescription = (description: string) => {
    if (!description) return '';
    // Remove "Learning path generated for: " prefix if present
    return description.replace(/^Learning path generated for: /i, '');
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
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading learning paths...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <div className="text-destructive font-medium text-lg mb-4">{error}</div>
            <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
              
              {error.includes('authentication') || error.includes('log in') ? (
                <Button onClick={handleLoginRedirect} variant="secondary">
                  Go to Login
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active path view
  if (activePathId) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            onClick={handleBackToList}
            variant="ghost"
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to All Learning Paths
          </Button>
        </div>
        
        {/* Pass only the progressId, without requiring a userID */}
        <LearningPathProgress progressId={activePathId} />
      </div>
    );
  }

  // List view of learning paths
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">My Learning Paths</h1>
      
      {learningPaths.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-medium mb-4">No learning paths found</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any active learning paths. Chat with the AI assistant and ask for a
              learning path to get started.
            </p>
            <Button
              onClick={() => router.push('/chatbot')}
              className="px-6"
            >
              Start a New Learning Path
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {learningPaths.map((path) => (
            <Card
              key={path._id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => handlePathSelect(path._id)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle>{formatPathTitle(path.title)}</CardTitle>
                  {path.isCompleted ? (
                    <Badge variant="success">Completed</Badge>
                  ) : (
                    <Badge>In Progress</Badge>
                  )}
                </div>
                {path.description && (
                  <CardDescription>{formatPathDescription(path.description)}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="mb-3">
                  <ProgressBar
                    progress={path.completedSteps}
                    total={path.totalSteps}
                    height={6}
                    progressColor="bg-primary"
                  />
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  {path.difficulty && (
                    <div className="capitalize">{path.difficulty}</div>
                  )}
                  {path.estimatedTimeToComplete && (
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {path.estimatedTimeToComplete}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Grid className="w-3.5 h-3.5 mr-1" />
                    {path.totalSteps} Steps
                  </div>
                </div>
                <div>
                  Last accessed {formatDate(path.lastAccessedAt)}
                </div>
              </CardFooter>
              
              {/* Display API error message if present in path data */}
              {path.apiError && (
                <div className="px-6 pb-4">
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Content may be incomplete due to an API issue.
                      <Button 
                        variant="link"
                        className="h-auto p-0 text-destructive-foreground underline ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchLearningPaths();
                        }}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Display global API error message if applicable */}
      {error && error.includes('Gemini API') && (
        <Alert variant="warning" className="mt-6">
          <AlertTitle>API Connection Issue</AlertTitle>
          <AlertDescription>
            We're experiencing issues connecting to our AI service. Some learning path content may be limited.
            Our team has been notified and is working to resolve this issue.
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLearningPaths()}
              className="ml-2"
            >
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LearningPathsPage;