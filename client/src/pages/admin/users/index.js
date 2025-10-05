import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  Select,
  HStack,
  Text,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Input,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminRoute from '../../../components/auth/AdminRoute';

const UserManagement = () => {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
  });

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(search && { search }),
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data.users);
      setPagination(data.pagination);
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

  // Handle search input change
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters((prev) => ({ ...prev, search }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
    fetchUsers(1, search);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Handle user status change
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      toast({
        title: 'Success',
        description: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh users list
      fetchUsers(pagination.page, filters.search);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    fetchUsers(pagination.page, filters.search);
  }, [pagination.page, filters.role, filters.status]);

  return (
    <AdminRoute>
      <Container maxW="container.xl" py={8}>
        <Heading mb={8}>User Management</Heading>
        
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* Filters */}
        <HStack spacing={4} mb={6}>
          <Select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            placeholder="Filter by Role"
            width="200px"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>

          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            placeholder="Filter by Status"
            width="200px"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          <Input
            placeholder="Search users..."
            value={filters.search}
            onChange={handleSearchChange}
            width="300px"
          />
        </HStack>
        
        {loading ? (
          <Center py={10}>
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Center>
        ) : users.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg">No users found</Text>
          </Box>
        ) : (
          <>
            {/* Users Table */}
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Created At</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user._id}>
                      <Td>{user.name}</Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                          {user.role}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={user.active ? 'green' : 'red'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme={user.active ? 'red' : 'green'}
                            onClick={() => handleStatusChange(user._id, !user.active)}
                          >
                            {user.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => router.push(`/admin/users/${user._id}`)}
                          >
                            View
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <HStack spacing={2} justify="center" mt={6}>
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  isDisabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Text>
                  Page {pagination.page} of {pagination.pages}
                </Text>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  isDisabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </HStack>
            )}
          </>
        )}
      </Container>
    </AdminRoute>
  );
};

export default UserManagement; 