import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  Alert,
  AlertIcon,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login for:', email);
      const response = await login(email, password);
      
      if (response.success) {
        console.log('Login successful, user data:', response.user);
        console.log('User role after login:', response.user.role);
        console.log('Role type:', typeof response.user.role);
        
        // Use the normalized role check for more reliable admin detection
        const normalizedRole = typeof response.user.role === 'string' 
          ? response.user.role.toLowerCase() 
          : (response.user.role?.name?.toLowerCase() || '');
          
        console.log('Normalized role:', normalizedRole);
        const isAdminUser = normalizedRole === 'admin';
        console.log('Is user admin:', isAdminUser);
        
        // Redirect based on normalized role
        if (isAdminUser) {
          console.log('Redirecting to admin dashboard');
          router.push('/admin/dashboard');
        } else {
          console.log('Redirecting to user dashboard');
          router.push('/dashboard');
        }
      } else {
        setError(response.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>AI Healthcare Diagnostics</Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            Sign in to access your account
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
          w={{ base: 'full', md: '400px' }}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              <Stack spacing={5}>
                <Stack
                  direction={{ base: 'column', sm: 'row' }}
                  align={'start'}
                  justify={'space-between'}
                >
                  <NextLink href="/register" passHref legacyBehavior>
                    <Link color={'blue.400'}>Don&apos;t have an account?</Link>
                  </NextLink>
                </Stack>
                <Button
                  type="submit"
                  bg={'teal.400'}
                  color={'white'}
                  _hover={{
                    bg: 'teal.500',
                  }}
                  isLoading={isLoading}
                >
                  Sign in
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Login; 