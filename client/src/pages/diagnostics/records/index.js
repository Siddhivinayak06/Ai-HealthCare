import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  SimpleGrid,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useColorModeValue,
  Container,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiPlus, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';
import debounce from 'lodash/debounce';

const MedicalRecords = () => {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    recordType: '',
    search: '',
  });
  
  // Fetch records
  const fetchRecords = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.recordType && { recordType: filters.recordType }),
        ...(search && { search }),
      });

      const response = await fetch(
        `${process.env.API_URL}/diagnostics/records?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }

      const data = await response.json();
      setRecords(data.data.records);
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
  }, [filters.status, filters.recordType, pagination.limit, toast]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((search) => {
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
      fetchRecords(1, search);
    }, 500),
    [fetchRecords]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters((prev) => ({ ...prev, search }));
    debouncedSearch(search);
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

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    if (user) {
      fetchRecords(pagination.page, filters.search);
    }
  }, [user, pagination.page, pagination.limit, filters, fetchRecords]);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      diagnosed: 'green',
      reviewed: 'purple',
    };
    return colors[status] || 'gray';
  };
  
  return (
    <ProtectedRoute>
      <Container maxW="container.xl" py={8}>
        <Heading mb={8}>Medical Records</Heading>
        
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* Filters */}
        <HStack spacing={4} mb={6}>
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            placeholder="Filter by Status"
            width="200px"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="reviewed">Reviewed</option>
          </Select>

          <Select
            name="recordType"
            value={filters.recordType}
            onChange={handleFilterChange}
            placeholder="Filter by Type"
            width="200px"
          >
            <option value="xray">X-Ray</option>
            <option value="mri">MRI</option>
            <option value="ct">CT Scan</option>
            <option value="ultrasound">Ultrasound</option>
            <option value="labTest">Lab Test</option>
            <option value="other">Other</option>
          </Select>

          <Input
            placeholder="Search records..."
            value={filters.search}
            onChange={handleSearchChange}
            width="300px"
          />

          <Button
            colorScheme="blue"
            onClick={() => router.push('/diagnostics/upload')}
          >
            Upload New Record
          </Button>
        </HStack>
        
        {loading ? (
          <Center py={10}>
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Center>
        ) : records.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" mb={4}>
              No medical records found
            </Text>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="teal"
              onClick={() => router.push('/diagnostics/upload')}
            >
              Upload Your First Medical Image
            </Button>
          </Box>
        ) : (
          <>
            {/* Records Table */}
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Body Part</Th>
                    <Th>Status</Th>
                    <Th>AI Diagnosis</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {records.map((record) => (
                    <Tr key={record._id}>
                      <Td>{formatDate(record.createdAt)}</Td>
                      <Td>{record.recordType}</Td>
                      <Td>{record.bodyPart}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </Td>
                      <Td>
                        {record.diagnosisResults?.aiDiagnosis?.condition || 'N/A'}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => router.push(`/diagnostics/records/${record._id}`)}
                        >
                          View
                        </Button>
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
    </ProtectedRoute>
  );
};

export default MedicalRecords; 