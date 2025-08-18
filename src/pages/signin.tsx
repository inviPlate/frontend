import { SignIn, useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const SignInPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // Handle manual navigation to /sign-in when already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check if there's a specific page they were trying to access
      const from = location.state?.from?.pathname;
      
      if (from && from !== '/sign-in') {
        // Redirect to the page they were trying to access
        window.location.href = from;
      } else {
        // Default to home page
        window.location.href = '/';
      }
    }
  }, [isLoaded, isSignedIn, location.state?.from?.pathname]);

  // If user is already signed in, redirect them
  if (isSignedIn) {
    // Check if there's a specific page they were trying to access
    const from = location.state?.from?.pathname;
    
    if (from && from !== '/sign-in') {
      // Redirect to the page they were trying to access
      return <Navigate to={from} replace />;
    } else {
      // Default to home page
      return <Navigate to="/" replace />;
    }
  }

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <SignIn />;
};

export default SignInPage;