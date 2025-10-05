import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AdminRoute - Component to protect admin routes
 * Redirects to dashboard if user is not an admin
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return children;
};

export default AdminRoute; 