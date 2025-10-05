import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Link,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminRegister } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.adminCode) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting admin registration with:', { ...formData, password: '[REDACTED]' });
      const { success, error: apiError, user } = await adminRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        adminCode: formData.adminCode,
      });

      if (success) {
        console.log('Admin registration successful:', user);
        toast({
          title: 'Success',
          description: 'Admin account created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push('/dashboard');
      } else {
        setError(apiError || 'Failed to create admin account');
        toast({
          title: 'Error',
          description: apiError || 'Failed to create admin account',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box
        p={8}
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="white"
      >
        <VStack spacing={6} as="form" onSubmit={handleSubmit}>
          <Heading>Admin Registration</Heading>
          <Text color="gray.600">
            Register as an admin using the special admin code
          </Text>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Admin Code</FormLabel>
            <Input
              name="adminCode"
              type="password"
              value={formData.adminCode}
              onChange={handleChange}
              placeholder="Enter the admin code"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Default code: admin-secret-code-123 (for development only)
            </Text>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            isLoading={loading}
          >
            Register as Admin
          </Button>

          <Text>
            Already have an account?{' '}
            <NextLink href="/login" passHref legacyBehavior>
              <Link color="blue.500" _hover={{ textDecoration: 'underline' }}>
                Login here
              </Link>
            </NextLink>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default AdminRegister; 