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
  Progress,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminRoute from '@/components/auth/AdminRoute';

const ModelDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const fetchModelDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.API_URL}/admin/models/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch model details');
      }

      const data = await response.json();
      setModel(data.data.model);
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

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(
        `${process.env.API_URL}/admin/models/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update model status');
      }

      toast({
        title: 'Success',
        description: 'Model status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh model details
      fetchModelDetails();
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

  useEffect(() => {
    if (id) {
      fetchModelDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!model) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Model not found
        </Alert>
      </Container>
    );
  }

  return (
    <AdminRoute>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Heading size="lg">{model.name}</Heading>
            <HStack spacing={4}>
              <Button
                colorScheme="blue"
                onClick={() => router.push(`/admin/models/${id}/edit`)}
              >
                Edit Model
              </Button>
              <Button
                colorScheme="red"
                onClick={() => handleStatusChange('archived')}
              >
                Archive Model
              </Button>
            </HStack>
          </HStack>

          {/* Basic Info */}
          <Grid templateColumns="repeat(4, 1fr)" gap={6}>
            <GridItem>
              <Stat>
                <StatLabel>Status</StatLabel>
                <StatNumber>
                  <Badge
                    colorScheme={
                      model.status === 'active'
                        ? 'green'
                        : model.status === 'testing'
                        ? 'yellow'
                        : model.status === 'archived'
                        ? 'gray'
                        : 'red'
                    }
                  >
                    {model.status}
                  </Badge>
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Version</StatLabel>
                <StatNumber>{model.version}</StatNumber>
                <StatHelpText>Latest release</StatHelpText>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Accuracy</StatLabel>
                <StatNumber>{model.performance.accuracy}%</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {model.performance.improvement}% from previous version
                </StatHelpText>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Usage Count</StatLabel>
                <StatNumber>{model.usageCount}</StatNumber>
                <StatHelpText>Total predictions made</StatHelpText>
              </Stat>
            </GridItem>
          </Grid>

          <Divider />

          {/* Detailed Information */}
          <Tabs onChange={(index) => setActiveTab(index)}>
            <TabList>
              <Tab>Overview</Tab>
              <Tab>Performance</Tab>
              <Tab>Training History</Tab>
              <Tab>Usage Statistics</Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Description
                    </Text>
                    <Text>{model.description}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Model Type
                    </Text>
                    <Badge colorScheme="blue">{model.modelType}</Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Architecture
                    </Text>
                    <Text>{model.architecture}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.600">
                      Dependencies
                    </Text>
                    <Text>{model.dependencies?.join(', ') || 'No dependencies specified'}</Text>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Performance Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Overall Performance
                    </Text>
                    <Progress
                      value={model.performance.accuracy}
                      colorScheme="green"
                      size="lg"
                    />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Performance Metrics
                    </Text>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Metric</Th>
                          <Th>Value</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>Accuracy</Td>
                          <Td>{model.performance.accuracy}%</Td>
                        </Tr>
                        <Tr>
                          <Td>Precision</Td>
                          <Td>{model.performance.precision}%</Td>
                        </Tr>
                        <Tr>
                          <Td>Recall</Td>
                          <Td>{model.performance.recall}%</Td>
                        </Tr>
                        <Tr>
                          <Td>F1 Score</Td>
                          <Td>{model.performance.f1Score}%</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Training History Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Version</Th>
                        <Th>Date</Th>
                        <Th>Accuracy</Th>
                        <Th>Duration</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {model.trainingHistory?.length > 0 ? (
                        model.trainingHistory.map((training) => (
                          <Tr key={training.version}>
                            <Td>{training.version}</Td>
                            <Td>
                              {new Date(training.date).toLocaleDateString()}
                            </Td>
                            <Td>{training.accuracy}%</Td>
                            <Td>{training.duration}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  training.status === 'completed'
                                    ? 'green'
                                    : training.status === 'failed'
                                    ? 'red'
                                    : 'yellow'
                                }
                              >
                                {training.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={5} textAlign="center">
                            No training history available
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>

              {/* Usage Statistics Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Daily Usage
                    </Text>
                    <Progress
                      value={(model.usageCount / model.maxDailyUsage) * 100}
                      colorScheme="blue"
                      size="lg"
                    />
                  </Box>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Time Period</Th>
                        <Th>Usage Count</Th>
                        <Th>Success Rate</Th>
                        <Th>Average Response Time</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {model.usageStats?.length > 0 ? (
                        model.usageStats.map((stat) => (
                          <Tr key={stat.period}>
                            <Td>{stat.period}</Td>
                            <Td>{stat.count}</Td>
                            <Td>{stat.successRate}%</Td>
                            <Td>{stat.avgResponseTime}ms</Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={4} textAlign="center">
                            No usage statistics available
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </AdminRoute>
  );
};

export default ModelDetails; 