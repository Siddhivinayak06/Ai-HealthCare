import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  VStack,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Divider,
  Progress,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Grid,
  GridItem,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiPlay,
  FiPause,
  FiCheck,
  FiX,
  FiLoader,
  FiArrowLeft,
  FiBarChart2,
  FiSettings,
  FiInfo,
  FiDatabase,
  FiCode,
} from 'react-icons/fi';
import axios from 'axios';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TrainingJobDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [metricsHistory, setMetricsHistory] = useState([]);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.API_URL}/training/jobs/${id}`);
        setJob(response.data.data.job);
        
        // If job has metrics history, fetch it
        if (response.data.data.job.status === 'completed' || 
            response.data.data.job.status === 'training') {
          try {
            const metricsResponse = await axios.get(`${process.env.API_URL}/training/jobs/${id}/metrics`);
            if (metricsResponse.data.data.metrics) {
              setMetricsHistory(metricsResponse.data.data.metrics);
            }
          } catch (error) {
            console.error('Failed to fetch metrics history:', error);
          }
        }
      } catch (error) {
        setError('Failed to load training job details');
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();

    // Poll for updates if job is active
    const pollInterval = setInterval(async () => {
      if (!job || !['pending', 'preparing', 'training'].includes(job.status)) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await axios.get(`${process.env.API_URL}/training/jobs/${id}`);
        setJob(response.data.data.job);
        
        // Also update metrics if available
        if (response.data.data.job.status === 'training') {
          try {
            const metricsResponse = await axios.get(`${process.env.API_URL}/training/jobs/${id}/metrics`);
            if (metricsResponse.data.data.metrics) {
              setMetricsHistory(metricsResponse.data.data.metrics);
            }
          } catch (error) {
            console.error('Failed to fetch metrics history:', error);
          }
        }
      } catch (error) {
        console.error('Error polling job updates:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [id, job?.status]);

  // Handle cancel job
  const handleCancelJob = async () => {
    if (!confirm('Are you sure you want to cancel this training job?')) {
      return;
    }
    
    try {
      const response = await axios.patch(`${process.env.API_URL}/training/jobs/${id}/cancel`);
      setJob(response.data.data.job);
      
      toast({
        title: 'Success',
        description: 'Training job cancelled successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel training job',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? `${hours}h` : '',
      minutes > 0 ? `${minutes}m` : '',
      `${secs}s`,
    ].filter(Boolean).join(' ');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'training':
        return 'blue';
      case 'pending':
        return 'yellow';
      case 'preparing':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck />;
      case 'failed':
        return <FiX />;
      case 'training':
        return <FiPlay />;
      case 'pending':
        return <FiLoader />;
      case 'preparing':
        return <FiLoader />;
      default:
        return null;
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!metricsHistory || metricsHistory.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const epochs = metricsHistory.map((_, index) => `Epoch ${index + 1}`);
    
    return {
      labels: epochs,
      datasets: [
        {
          label: 'Training Accuracy',
          data: metricsHistory.map(m => m.trainAccuracy),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: 'Validation Accuracy',
          data: metricsHistory.map(m => m.validationAccuracy),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: 'Training Loss',
          data: metricsHistory.map(m => m.trainLoss),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'loss',
        },
        {
          label: 'Validation Loss',
          data: metricsHistory.map(m => m.validationLoss),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'loss',
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Accuracy',
        },
        max: 1,
      },
      loss: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Loss',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Training Metrics',
      },
    },
  };

  if (loading) {
    return (
      <ProtectedRoute adminOnly>
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Flex>
        </Box>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute adminOnly>
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
          <Button mt={4} leftIcon={<FiArrowLeft />} onClick={() => router.push('/admin/training')}>
            Back to Training Jobs
          </Button>
        </Box>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute adminOnly>
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
          <Alert status="warning">
            <AlertIcon />
            Training job not found
          </Alert>
          <Button mt={4} leftIcon={<FiArrowLeft />} onClick={() => router.push('/admin/training')}>
            Back to Training Jobs
          </Button>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Button 
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => router.push('/admin/training')}
          >
            Back to Training Jobs
          </Button>
          {['pending', 'preparing', 'training'].includes(job.status) && (
            <Button 
              colorScheme="yellow"
              leftIcon={<FiPause />}
              onClick={handleCancelJob}
            >
              Cancel Training
            </Button>
          )}
        </Flex>

        {/* Header */}
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={6}
          gap={4}
        >
          <Box>
            <Heading as="h1" size="xl">{job.name}</Heading>
            <Text color="gray.600" mt={1}>{job.description}</Text>
          </Box>
          <Badge 
            colorScheme={getStatusColor(job.status)}
            fontSize="md"
            p={2}
            borderRadius="md"
            display="flex"
            alignItems="center"
            gap={2}
          >
            {getStatusIcon(job.status)}
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </Flex>

        {/* Status message */}
        {job.statusMessage && (
          <Alert status="info" mb={6}>
            <AlertIcon />
            {job.statusMessage}
          </Alert>
        )}

        {/* Failure reason */}
        {job.status === 'failed' && job.failureReason && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {job.failureReason}
          </Alert>
        )}

        {/* Progress */}
        {['preparing', 'training'].includes(job.status) && (
          <Box mb={8}>
            <Flex justify="space-between" mb={2}>
              <Text fontWeight="medium">Progress</Text>
              <Text>{job.progress?.current || 0}/{job.progress?.total || 0}</Text>
            </Flex>
            <Progress 
              value={(job.progress?.current / job.progress?.total) * 100 || 0}
              size="md"
              colorScheme="teal"
              borderRadius="md"
              hasStripe
              isAnimated
            />
          </Box>
        )}

        <Tabs isFitted variant="enclosed" colorScheme="teal" mt={6}>
          <TabList mb="1em">
            <Tab><HStack><FiInfo /><Text>Overview</Text></HStack></Tab>
            <Tab><HStack><FiBarChart2 /><Text>Metrics</Text></HStack></Tab>
            <Tab><HStack><FiSettings /><Text>Configuration</Text></HStack></Tab>
            <Tab><HStack><FiDatabase /><Text>Model</Text></HStack></Tab>
          </TabList>
          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Job Details</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Name:</Text>
                        <Text>{job.name}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Created:</Text>
                        <Text>{formatDate(job.createdAt)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Started:</Text>
                        <Text>{formatDate(job.startedAt)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Completed:</Text>
                        <Text>{formatDate(job.completedAt)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Duration:</Text>
                        <Text>
                          {job.completedAt 
                            ? formatDuration((new Date(job.completedAt) - new Date(job.startedAt)) / 1000) 
                            : 'In progress'}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Status:</Text>
                        <Badge colorScheme={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>

                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Dataset</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Name:</Text>
                        <Text>{job.datasetName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Type:</Text>
                        <Text>{job.modelType}</Text>
                      </Flex>
                      {job.trainingMetrics && (
                        <>
                          <Flex justify="space-between">
                            <Text fontWeight="medium">Training Samples:</Text>
                            <Text>{job.trainingMetrics.trainingSamples || 'N/A'}</Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontWeight="medium">Validation Samples:</Text>
                            <Text>{job.trainingMetrics.validationSamples || 'N/A'}</Text>
                          </Flex>
                        </>
                      )}
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Input Shape:</Text>
                        <Text>
                          {job.inputShape.width}x{job.inputShape.height}x{job.inputShape.channels}
                        </Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {job.status === 'completed' && job.trainingMetrics && (
                <Card variant="outline" mt={8}>
                  <CardHeader>
                    <Heading size="md">Results Summary</Heading>
                  </CardHeader>
                  <CardBody>
                    <StatGroup>
                      <Stat>
                        <StatLabel>Final Train Accuracy</StatLabel>
                        <StatNumber>
                          {(job.trainingMetrics.finalTrainAccuracy * 100).toFixed(2)}%
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Final Validation Accuracy</StatLabel>
                        <StatNumber>
                          {(job.trainingMetrics.finalValidationAccuracy * 100).toFixed(2)}%
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Evaluation Accuracy</StatLabel>
                        <StatNumber>
                          {(job.trainingMetrics.evaluationAccuracy * 100).toFixed(2)}%
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Training Time</StatLabel>
                        <StatNumber>
                          {formatDuration(job.trainingMetrics.trainingTime)}
                        </StatNumber>
                      </Stat>
                    </StatGroup>
                  </CardBody>
                </Card>
              )}
            </TabPanel>

            {/* Metrics Tab */}
            <TabPanel>
              <Box mb={8}>
                <Heading size="md" mb={4}>Training Metrics</Heading>
                {(metricsHistory.length > 0) ? (
                  <Box h="400px">
                    <Line data={getChartData()} options={chartOptions} />
                  </Box>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    No metrics data available yet
                  </Alert>
                )}
              </Box>

              {job.status === 'completed' && job.trainingMetrics && (
                <Box mt={8}>
                  <Heading size="md" mb={4}>Final Metrics</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Metric</Th>
                        <Th isNumeric>Training</Th>
                        <Th isNumeric>Validation</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Accuracy</Td>
                        <Td isNumeric>
                          {(job.trainingMetrics.finalTrainAccuracy * 100).toFixed(2)}%
                        </Td>
                        <Td isNumeric>
                          {(job.trainingMetrics.finalValidationAccuracy * 100).toFixed(2)}%
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Loss</Td>
                        <Td isNumeric>
                          {job.trainingMetrics.finalTrainLoss?.toFixed(4)}
                        </Td>
                        <Td isNumeric>
                          {job.trainingMetrics.finalValidationLoss?.toFixed(4)}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Evaluation</Td>
                        <Td isNumeric colSpan={2}>
                          Accuracy: {(job.trainingMetrics.evaluationAccuracy * 100).toFixed(2)}%,
                          Loss: {job.trainingMetrics.evaluationLoss?.toFixed(4)}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>

            {/* Configuration Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Model Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Model Name:</Text>
                        <Text>{job.modelName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Version:</Text>
                        <Text>{job.modelVersion}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Architecture:</Text>
                        <Text>{job.modelArchitecture}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Model Type:</Text>
                        <Text>{job.modelType}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Input Shape:</Text>
                        <Text>
                          {job.inputShape.width}x{job.inputShape.height}x{job.inputShape.channels}
                        </Text>
                      </Flex>
                      {job.applicableBodyParts && (
                        <Flex justify="space-between">
                          <Text fontWeight="medium">Applicable Body Parts:</Text>
                          <Text>{job.applicableBodyParts}</Text>
                        </Flex>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Training Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Epochs:</Text>
                        <Text>{job.epochs}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Batch Size:</Text>
                        <Text>{job.batchSize}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="medium">Validation Split:</Text>
                        <Text>{job.validationSplit}</Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Model Tab */}
            <TabPanel>
              {job.status === 'completed' && job.modelId ? (
                <Box>
                  <Card variant="outline" mb={8}>
                    <CardHeader>
                      <Heading size="md">Model Details</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Flex justify="space-between">
                          <Text fontWeight="medium">Name:</Text>
                          <Text>{job.modelName} v{job.modelVersion}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="medium">ID:</Text>
                          <Text>{job.modelId._id || job.modelId}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="medium">Status:</Text>
                          <Badge colorScheme={job.modelId.status === 'active' ? 'green' : 'blue'}>
                            {job.modelId.status || 'testing'}
                          </Badge>
                        </Flex>
                        {job.modelId.description && (
                          <Box>
                            <Text fontWeight="medium">Description:</Text>
                            <Text mt={1}>{job.modelId.description}</Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                    <CardFooter>
                      <Button 
                        colorScheme="teal" 
                        leftIcon={<FiDownload />}
                        onClick={() => router.push(`/admin/models/${job.modelId._id || job.modelId}`)}
                      >
                        View Model Details
                      </Button>
                    </CardFooter>
                  </Card>

                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Next Steps</Text>
                      <Text mt={1}>
                        You can test this model on new images or deploy it for production use
                        from the model details page.
                      </Text>
                    </Box>
                  </Alert>
                </Box>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Model information will be available after training is complete
                </Alert>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ProtectedRoute>
  );
};

export default TrainingJobDetail; 