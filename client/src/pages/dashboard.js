import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
  Progress,
  Card,
  CardHeader,
  CardBody,
  Button,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { FiFileText, FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const statBorderColor = useColorModeValue('gray.200', 'gray.500');
  const cardBgColor = useColorModeValue('white', 'gray.700');

  const refreshData = () => {
    console.log('Manually refreshing dashboard data');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (router.query.unauthorized) {
      setUnauthorized(true);
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        setLoading(true);
        setError(''); // Clear any previous errors
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          router.push('/login');
          return;
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        console.log('Using API URL:', apiUrl);
        
        // Try to fetch with proper authentication
        const statsResponse = await axios.get(`${apiUrl}/users/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Dashboard data received:', statsResponse.data);
        
        if (!statsResponse.data || !statsResponse.data.success) {
          throw new Error(statsResponse.data?.message || 'Failed to fetch dashboard data');
        }
        
        // Verify that we have the required data structure
        if (!statsResponse.data.data || !statsResponse.data.data.records) {
          console.error('Invalid data structure received:', statsResponse.data);
          throw new Error('Invalid data structure received from server');
        }
        
        setStats(statsResponse.data.data);
        setRecentRecords(statsResponse.data.data.recentRecords || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        
        // Handle different error cases
        if (err.response) {
          // Server responded with an error
          console.error('Server error response:', err.response.data);
          
          if (err.response.status === 401) {
            console.log('Authentication failed - redirecting to login');
            localStorage.removeItem('token');
            router.push('/login');
          } else {
            setError(`Server error: ${err.response.data?.message || err.message}`);
          }
        } else if (err.request) {
          // Request was made but no response
          console.error('No response received from server');
          setError('Could not connect to the server. Please check your connection and try again.');
        } else {
          // Something else happened
          setError(err.message || 'Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
    
    const intervalId = setInterval(() => {
      if (user) {
        console.log('Auto-refreshing dashboard data');
        fetchDashboardData();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
    
  }, [user, refreshTrigger, router]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'processing':
        return 'blue';
      case 'diagnosed':
        return 'green';
      case 'reviewed':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <ProtectedRoute>
      <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="lg">
            Welcome, {user?.name}
          </Heading>
          <Button 
            leftIcon={<Icon as={FiRefreshCw} />} 
            colorScheme="teal" 
            variant="outline"
            onClick={refreshData}
          >
            Refresh
          </Button>
        </Flex>

        {unauthorized && (
          <Alert status="warning" mb={6} borderRadius="md">
            <AlertIcon />
            You don't have permission to access the admin area. Please contact an administrator if you believe this is an error.
          </Alert>
        )}

        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {stats && (
          <>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={{ base: 5, lg: 8 }}>
              <StatsCard
                title="Total Records"
                stat={stats.records.total}
                icon={<Icon as={FiFileText} w={8} h={8} />}
                bg="teal.400"
                borderColor={statBorderColor}
              />
              <StatsCard
                title="Pending"
                stat={stats.records.pending}
                icon={<Icon as={FiClock} w={8} h={8} />}
                bg="orange.400"
                borderColor={statBorderColor}
              />
              <StatsCard
                title="Diagnosed"
                stat={stats.records.diagnosed}
                icon={<Icon as={FiAlertCircle} w={8} h={8} />}
                bg="blue.400"
                borderColor={statBorderColor}
              />
              <StatsCard
                title="Reviewed"
                stat={stats.records.reviewed}
                icon={<Icon as={FiCheckCircle} w={8} h={8} />}
                bg="green.400"
                borderColor={statBorderColor}
              />
            </SimpleGrid>

            <Box mt={10}>
              <Card shadow="md" bg={cardBgColor}>
                <CardHeader>
                  <Heading size="md">Recent Medical Records</Heading>
                </CardHeader>
                <CardBody>
                  {recentRecords.length === 0 ? (
                    <Text>No records found. Upload your first medical image to get started.</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Record Type</Th>
                            <Th>Body Part</Th>
                            <Th>Status</Th>
                            <Th>Created At</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {recentRecords.map((record) => (
                            <Tr key={record._id}>
                              <Td>
                                {record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1)}
                              </Td>
                              <Td>{record.bodyPart}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(record.status)}>
                                  {record.status}
                                </Badge>
                              </Td>
                              <Td>{formatDate(record.createdAt)}</Td>
                              <Td>
                                <Button
                                  size="sm"
                                  colorScheme="teal"
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
                  )}
                </CardBody>
              </Card>
            </Box>

            <Flex mt={10} justifyContent="center">
              <Button
                colorScheme="teal"
                size="lg"
                onClick={() => router.push('/diagnostics/upload')}
                mr={4}
              >
                Upload New Image
              </Button>
              <Button
                variant="outline"
                colorScheme="teal"
                size="lg"
                onClick={() => router.push('/diagnostics/records')}
              >
                View All Records
              </Button>
            </Flex>
          </>
        )}
      </Box>
    </ProtectedRoute>
  );
};

const StatsCard = ({ title, stat, icon, bg, borderColor }) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'md'}
      border={'1px solid'}
      borderColor={borderColor}
      rounded={'lg'}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        width="30%"
        bg={bg}
        opacity={0.8}
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="white"
      >
        {icon}
      </Box>
      <StatLabel fontWeight={'medium'} isTruncated>
        {title}
      </StatLabel>
      <StatNumber fontSize={'2xl'} fontWeight={'bold'}>
        {stat}
      </StatNumber>
    </Stat>
  );
};

export default Dashboard; 