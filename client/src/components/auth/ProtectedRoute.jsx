import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if authentication is still loading
    if (!loading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated()) {
        router.push('/login');
      }
      // If admin-only route but user is not admin, redirect to dashboard
      else if (adminOnly && !isAdmin()) {
        router.push('/dashboard');
      }
    }
  }, [loading, isAuthenticated, isAdmin, adminOnly, router]);

  // Show loading spinner while checking authentication
  if (loading || !isAuthenticated() || (adminOnly && !isAdmin())) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="teal.500" thickness="4px" />
          <Text>Loading...</Text>
        </VStack>
      </Center>
    );
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute; 