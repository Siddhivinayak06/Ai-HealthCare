import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

// Create context
const AuthContext = createContext();

// Helper function to get API base URL
const getApiBaseUrl = () => {
  let apiBaseUrl;
  if (process.env.NEXT_PUBLIC_API_URL) {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  } else if (process.env.API_URL) {
    apiBaseUrl = process.env.API_URL;
  } else {
    apiBaseUrl = 'http://localhost:5000/api';
  }
  return apiBaseUrl;
};

// Helper function to standardize role handling
const normalizeRole = (role) => {
  if (!role) return null;
  
  // If role is a string
  if (typeof role === 'string') {
    return role.toLowerCase();
  }
  
  // If role is an object with common properties
  if (typeof role === 'object' && role !== null) {
    if (role.name) return role.name.toLowerCase();
    if (role.value) return role.value.toLowerCase();
    if (role.type) return role.type.toLowerCase();
    if (role.role) return role.role.toLowerCase();
    if (role.toString) return role.toString().toLowerCase();
  }
  
  // If we can't determine the role, return null
  console.log('Unable to normalize role:', role);
  return null;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found in localStorage');
          setLoading(false);
          return;
        }
        
        // Set token in axios defaults for all future requests
        console.log('Setting default Authorization header for axios');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
        
        // Get API base URL
        const apiBaseUrl = getApiBaseUrl();
        console.log('Fetching user data on init from:', `${apiBaseUrl}/auth/me`);
        
        // Fetch user data from API with explicit Authorization header
        const response = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.success) {
          console.log('User data retrieved on init:', response.data.data.user);
          setUser(response.data.data.user);
        } else {
          console.error('Failed to retrieve user data:', response.data);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get API base URL
      const apiBaseUrl = getApiBaseUrl();
      console.log('Attempting login with:', { email, apiUrl: `${apiBaseUrl}/auth/login` });
      
      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        email,
        password,
      });

      console.log('Login response:', response.data);
      
      // Check if the response has a success status
      if (response.data.status === 'success') {
        const { token, user } = response.data;
        console.log('Login successful:', { user: { ...user, password: '[REDACTED]' } });
        
        // Save token to localStorage
        localStorage.setItem('token', token);
        
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        setToken(token);
        
        return { success: true, user };
      } else {
        console.error('Login failed:', response.data);
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get API base URL
      const apiBaseUrl = getApiBaseUrl();
      console.log('Registering user with database:', `${apiBaseUrl}/auth/register`);
      
      const response = await axios.post(`${apiBaseUrl}/auth/register`, userData);
      
      const { token, user } = response.data;
      console.log('Successfully registered user in database:', user);
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register admin user (with admin code)
  const adminRegister = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get API base URL
      const apiBaseUrl = getApiBaseUrl();
      console.log('Registering admin user with database:', `${apiBaseUrl}/auth/admin-register`);
      console.log('Admin registration data:', { ...userData, password: '[REDACTED]' });
      
      // Make sure we're sending to the correct endpoint
      const adminRegisterUrl = `${apiBaseUrl}/auth/admin-register`;
      console.log('Admin registration URL:', adminRegisterUrl);
      
      const response = await axios.post(adminRegisterUrl, userData);
      
      console.log('Admin registration API response:', response.data);
      const { token, user } = response.data;
      console.log('Successfully registered admin user in database:', user);
      console.log('Admin role from registration:', user.role);
      console.log('Role type:', typeof user.role);
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
      
      return { success: true, user };
    } catch (error) {
      console.error('Admin registration error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Admin registration failed');
      return { success: false, error: error.response?.data?.message || 'Admin registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove token from axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    setToken(null);
    
    // Redirect to login page
    router.push('/login');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('AuthContext.updateProfile called with:', userData);
      
      // Get API base URL
      const apiBaseUrl = getApiBaseUrl();
      console.log('Updating user profile using API URL:', `${apiBaseUrl}/users/profile`);
      
      // If userData is already a complete user object, we'll use it directly
      // Otherwise, we'll create a new object with just the fields we need to update
      const dataToSend = typeof userData === 'object' ? { ...userData } : { name: userData };
      console.log('Data being sent to API:', dataToSend);
      
      const response = await axios.patch(`${apiBaseUrl}/users/profile`, dataToSend);
      console.log('Profile update response:', response.data);
      
      if (response.data && response.data.success) {
        // Determine the user data structure from the response
        let updatedUser;
        if (response.data.data && response.data.data.user) {
          updatedUser = response.data.data.user;
        } else if (response.data.user) {
          updatedUser = response.data.user;
        } else {
          updatedUser = response.data;
        }
        
        console.log('Setting user state with:', updatedUser);
        setUser(updatedUser);
        
        return { success: true, user: updatedUser };
      } else {
        console.error('API returned success: false or unexpected structure:', response.data);
        return { success: false, error: 'Unexpected response structure' };
      }
    } catch (error) {
      console.error('Profile update error in AuthContext:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Profile update failed');
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token;
  };

  // Check if user is admin - using normalized role handling
  const isAdmin = () => {
    console.log('isAdmin check - user:', user);
    
    if (!user) {
      console.log('isAdmin returning false - user is null or undefined');
      return false;
    }
    
    // Print exact role data for debugging
    console.log('Raw role value:', user.role);
    console.log('Role type:', typeof user.role);
    
    // Normalize the role for consistent comparison
    const normalizedRole = normalizeRole(user.role);
    console.log('Normalized role:', normalizedRole);
    
    // Simple check against normalized role
    const isUserAdmin = normalizedRole === 'admin';
    
    console.log('isAdmin result:', isUserAdmin);
    return isUserAdmin;
  };

  // Value to be provided to consumers
  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    adminRegister,
    logout,
    updateProfile,
    isAuthenticated,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 