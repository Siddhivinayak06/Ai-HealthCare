import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminRoute from '../../../components/auth/AdminRoute';

const UserDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUser(data.data.user);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <AdminRoute>
        <Container maxW="container.xl" py={8}>
          <Center py={10}>
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Center>
        </Container>
      </AdminRoute>
    );
  }

  if (error) {
    return (
      <AdminRoute>
        <Container maxW="container.xl" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </AdminRoute>
    );
  }

  if (!user) {
    return (
      <AdminRoute>
        <Container maxW="container.xl" py={8}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            User not found
          </Alert>
        </Container>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading>User Details</Heading>
            <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
          </HStack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Name</Text>
                    <Text>{user.name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Email</Text>
                    <Text>{user.email}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Role</Text>
                    <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                      {user.role}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Status</Text>
                    <Badge colorScheme={user.active ? 'green' : 'red'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Box>
                </VStack>
              </GridItem>

              <GridItem>
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Created At</Text>
                    <Text>{new Date(user.createdAt).toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Last Updated</Text>
                    <Text>{new Date(user.updatedAt).toLocaleString()}</Text>
                  </Box>
                  {user.specialization && (
                    <Box>
                      <Text fontWeight="bold" color="gray.600">Specialization</Text>
                      <Text>{user.specialization}</Text>
                    </Box>
                  )}
                  {user.medicalLicenseNumber && (
                    <Box>
                      <Text fontWeight="bold" color="gray.600">Medical License Number</Text>
                      <Text>{user.medicalLicenseNumber}</Text>
                    </Box>
                  )}
                </VStack>
              </GridItem>
            </Grid>

            <Divider my={6} />

            <VStack align="start" spacing={4}>
              <Text fontWeight="bold" color="gray.600">Contact Information</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={6} width="100%">
                {user.contactNumber && (
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Phone Number</Text>
                    <Text>{user.contactNumber}</Text>
                  </Box>
                )}
                {user.address && (
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Address</Text>
                    <Text>
                      {user.address.street && `${user.address.street}, `}
                      {user.address.city && `${user.address.city}, `}
                      {user.address.state && `${user.address.state}, `}
                      {user.address.zipCode && `${user.address.zipCode}, `}
                      {user.address.country}
                    </Text>
                  </Box>
                )}
                {user.dateOfBirth && (
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Date of Birth</Text>
                    <Text>{new Date(user.dateOfBirth).toLocaleDateString()}</Text>
                  </Box>
                )}
                {user.gender && (
                  <Box>
                    <Text fontWeight="bold" color="gray.600">Gender</Text>
                    <Text>{user.gender}</Text>
                  </Box>
                )}
              </Grid>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </AdminRoute>
  );
};

export default UserDetails; 