import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Flex,
  Icon,
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
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
} from '@chakra-ui/react';
import { FiUsers, FiDatabase, FiFileText, FiActivity } from 'react-icons/fi';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import AdminRoute from '../../components/auth/AdminRoute';

const AdminDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        // Get admin statistics
        // Use a fallback API URL if process.env.API_URL is not defined
        const apiBaseUrl = process.env.API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiBaseUrl}/admin/stats`);
        
        console.log('Admin stats response:', response.data);
        
        // Check if the response has the expected structure
        if (response.data && response.data.data) {
          setStats(response.data.data);
        } else {
          // Handle unexpected response format
          console.error('Unexpected API response format:', response.data);
          setError('Received an invalid response format from the server.');
          
          // Set fallback data for development/testing
          setStats({
            users: { total: 0, recentUsers: [] },
            records: { 
              total: 0, 
              pending: 0, 
              diagnosed: 0, 
              reviewed: 0,
              recordTypes: [] 
            },
            models: { total: 0, active: 0, topModels: [] },
            conditions: []
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
        setError(`Failed to load admin dashboard data: ${err.message || 'Unknown error'}`);
        
        // Set fallback data for development/testing
        setStats({
          users: { total: 0, recentUsers: [] },
          records: { 
            total: 0, 
            pending: 0, 
            diagnosed: 0, 
            reviewed: 0,
            recordTypes: [] 
          },
          models: { total: 0, active: 0, topModels: [] },
          conditions: []
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchAdminStats();
    }
  }, [user]);

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading as="h1" size="lg" mb={6}>
        Admin Dashboard
      </Heading>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {stats && (
        <>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={{ base: 5, lg: 8 }} mb={8}>
            <StatsCard
              title="Total Users"
              stat={stats.users.total}
              icon={<Icon as={FiUsers} w={8} h={8} />}
              bg="purple.400"
            />
            <StatsCard
              title="Total Records"
              stat={stats.records.total}
              icon={<Icon as={FiFileText} w={8} h={8} />}
              bg="teal.400"
            />
            <StatsCard
              title="Total ML Models"
              stat={stats.models.total}
              icon={<Icon as={FiDatabase} w={8} h={8} />}
              bg="blue.400"
            />
            <StatsCard
              title="Active ML Models"
              stat={stats.models.active}
              icon={<Icon as={FiActivity} w={8} h={8} />}
              bg="green.400"
            />
          </SimpleGrid>

          <Tabs colorScheme="teal" variant="enclosed" mb={8}>
            <TabList>
              <Tab>Users</Tab>
              <Tab>Records</Tab>
              <Tab>Models</Tab>
              <Tab>Conditions</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Card shadow="md" bg={useColorModeValue('white', 'gray.700')}>
                  <CardHeader>
                    <Heading size="md">Recent Users</Heading>
                  </CardHeader>
                  <CardBody>
                    {stats.users.recentUsers.length === 0 ? (
                      <Text>No users found.</Text>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Email</Th>
                              <Th>Role</Th>
                              <Th>Created At</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {stats.users.recentUsers.map((user) => (
                              <Tr key={user._id}>
                                <Td>{user.name}</Td>
                                <Td>{user.email}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={user.role === 'admin' ? 'purple' : 'blue'}
                                  >
                                    {user.role}
                                  </Badge>
                                </Td>
                                <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                                <Td>
                                  <Button
                                    size="sm"
                                    colorScheme="teal"
                                    onClick={() =>
                                      router.push(`/admin/users/${user._id}`)
                                    }
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
                    <Box mt={4}>
                      <Button
                        colorScheme="teal"
                        onClick={() => router.push('/admin/users')}
                      >
                        Manage All Users
                      </Button>
                    </Box>
                  </CardBody>
                </Card>
              </TabPanel>

              <TabPanel>
                <Card shadow="md" bg={useColorModeValue('white', 'gray.700')}>
                  <CardHeader>
                    <Heading size="md">Record Statistics</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <Box>
                        <Heading size="sm" mb={4}>
                          Record Status
                        </Heading>
                        <Flex mb={2} align="center">
                          <Text minW="100px">Pending</Text>
                          <Progress
                            value={(stats.records.pending / stats.records.total) * 100}
                            colorScheme="orange"
                            size="lg"
                            w="full"
                            borderRadius="md"
                          />
                          <Text ml={2}>{stats.records.pending}</Text>
                        </Flex>
                        <Flex mb={2} align="center">
                          <Text minW="100px">Diagnosed</Text>
                          <Progress
                            value={(stats.records.diagnosed / stats.records.total) * 100}
                            colorScheme="blue"
                            size="lg"
                            w="full"
                            borderRadius="md"
                          />
                          <Text ml={2}>{stats.records.diagnosed}</Text>
                        </Flex>
                        <Flex mb={2} align="center">
                          <Text minW="100px">Reviewed</Text>
                          <Progress
                            value={(stats.records.reviewed / stats.records.total) * 100}
                            colorScheme="green"
                            size="lg"
                            w="full"
                            borderRadius="md"
                          />
                          <Text ml={2}>{stats.records.reviewed}</Text>
                        </Flex>
                      </Box>
                      <Box>
                        <Heading size="sm" mb={4}>
                          Record Types
                        </Heading>
                        {stats.records.recordTypes.map((type) => (
                          <Flex key={type._id} mb={2} align="center">
                            <Text minW="100px">{type._id}</Text>
                            <Progress
                              value={(type.count / stats.records.total) * 100}
                              colorScheme="teal"
                              size="lg"
                              w="full"
                              borderRadius="md"
                            />
                            <Text ml={2}>{type.count}</Text>
                          </Flex>
                        ))}
                      </Box>
                    </SimpleGrid>
                    <Box mt={4}>
                      <Button
                        colorScheme="teal"
                        onClick={() => router.push('/diagnostics/records')}
                      >
                        View All Records
                      </Button>
                    </Box>
                  </CardBody>
                </Card>
              </TabPanel>

              <TabPanel>
                <Card shadow="md" bg={useColorModeValue('white', 'gray.700')}>
                  <CardHeader>
                    <Heading size="md">Top ML Models</Heading>
                  </CardHeader>
                  <CardBody>
                    {stats.models.topModels.length === 0 ? (
                      <Text>No models found.</Text>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Version</Th>
                              <Th>Accuracy</Th>
                              <Th>Usage Count</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {stats.models.topModels.map((model) => (
                              <Tr key={model._id}>
                                <Td>{model.name}</Td>
                                <Td>{model.version}</Td>
                                <Td>{model.performance?.accuracy}%</Td>
                                <Td>{model.usageCount}</Td>
                                <Td>
                                  <Button
                                    size="sm"
                                    colorScheme="teal"
                                    onClick={() =>
                                      router.push(`/admin/models/${model._id}`)
                                    }
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
                    <Box mt={4}>
                      <Button
                        colorScheme="teal"
                        onClick={() => router.push('/admin/models')}
                      >
                        Manage All Models
                      </Button>
                    </Box>
                  </CardBody>
                </Card>
              </TabPanel>

              <TabPanel>
                <Card shadow="md" bg={useColorModeValue('white', 'gray.700')}>
                  <CardHeader>
                    <Heading size="md">Diagnosed Conditions</Heading>
                  </CardHeader>
                  <CardBody>
                    {stats.conditions.length === 0 ? (
                      <Text>No conditions found.</Text>
                    ) : (
                      <Box>
                        {stats.conditions.map((condition) => (
                          <Flex key={condition._id} mb={2} align="center">
                            <Text minW="200px" isTruncated>
                              {condition._id}
                            </Text>
                            <Progress
                              value={
                                (condition.count /
                                  Math.max(
                                    ...stats.conditions.map((c) => c.count)
                                  )) *
                                100
                              }
                              colorScheme="purple"
                              size="lg"
                              w="full"
                              borderRadius="md"
                            />
                            <Text ml={2}>{condition.count}</Text>
                          </Flex>
                        ))}
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Flex justifyContent="center" mt={8} wrap="wrap" gap={4}>
            <Button
              leftIcon={<Icon as={FiUsers} />}
              colorScheme="purple"
              size="lg"
              onClick={() => router.push('/admin/users')}
            >
              Manage Users
            </Button>
            <Button
              leftIcon={<Icon as={FiDatabase} />}
              colorScheme="blue"
              size="lg"
              onClick={() => router.push('/admin/models')}
            >
              Manage ML Models
            </Button>
            <Button
              leftIcon={<Icon as={FiFileText} />}
              colorScheme="teal"
              size="lg"
              onClick={() => router.push('/diagnostics/records')}
            >
              View Records
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
};

const StatsCard = ({ title, stat, icon, bg }) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'md'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.200', 'gray.500')}
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

// Wrap the AdminDashboard component with AdminRoute for protection
const ProtectedAdminDashboard = () => {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
};

export default ProtectedAdminDashboard; 