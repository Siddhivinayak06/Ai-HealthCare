import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  IconButton,
  HStack,
  VStack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Stack,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiPlay,
  FiPause,
  FiCheck,
  FiX,
  FiLoader,
} from 'react-icons/fi';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

const TrainingJobs = () => {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [datasets, setDatasets] = useState([]);
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
  });
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    datasetId: '',
    modelType: '',
    modelName: '',
    modelVersion: '1.0.0',
    modelDescription: '',
    modelArchitecture: 'default',
    inputShape: {
      width: 224,
      height: 224,
      channels: 3,
    },
    applicableBodyParts: '',
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2,
  });

  // Fetch jobs and datasets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch training jobs
        const jobsParams = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        };
        const jobsResponse = await axios.get(`${process.env.API_URL}/training/jobs`, {
          params: jobsParams,
        });
        setTrainingJobs(jobsResponse.data.data.jobs);
        setPagination({
          page: jobsResponse.data.pagination.page,
          limit: jobsResponse.data.pagination.limit,
          total: jobsResponse.data.pagination.total,
          pages: jobsResponse.data.pagination.pages,
        });
        
        // Fetch datasets
        const datasetsResponse = await axios.get(`${process.env.API_URL}/datasets`, {
          params: { limit: 100 },
        });
        setDatasets(datasetsResponse.data.data.datasets);
      } catch (error) {
        setError('Failed to load training jobs');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Poll for updates to active jobs
    const pollInterval = setInterval(async () => {
      try {
        const activeJobIds = trainingJobs
          .filter(job => ['pending', 'preparing', 'training'].includes(job.status))
          .map(job => job._id);
          
        if (activeJobIds.length > 0) {
          const activeJobsResponse = await axios.get(`${process.env.API_URL}/training/jobs`, {
            params: {
              ids: activeJobIds.join(','),
            },
          });
          
          // Update jobs with new data
          setTrainingJobs(prevJobs => {
            const newJobs = [...prevJobs];
            activeJobsResponse.data.data.jobs.forEach(updatedJob => {
              const index = newJobs.findIndex(job => job._id === updatedJob._id);
              if (index !== -1) {
                newJobs[index] = updatedJob;
              }
            });
            return newJobs;
          });
        }
      } catch (error) {
        console.error('Error polling job updates:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, [pagination.page, pagination.limit, filters]);

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  // Handle new job form change
  const handleNewJobChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'datasetId') {
      // Set model type based on the selected dataset
      const dataset = datasets.find(ds => ds._id === value);
      if (dataset) {
        setNewJob({
          ...newJob,
          datasetId: value,
          modelType: dataset.type,
        });
      } else {
        setNewJob({
          ...newJob,
          datasetId: value,
        });
      }
    } else if (name.startsWith('inputShape.')) {
      // Handle nested inputShape object
      const key = name.split('.')[1];
      setNewJob({
        ...newJob,
        inputShape: {
          ...newJob.inputShape,
          [key]: parseInt(value),
        },
      });
    } else if (['epochs', 'batchSize'].includes(name)) {
      // Convert to integer
      setNewJob({
        ...newJob,
        [name]: parseInt(value),
      });
    } else if (name === 'validationSplit') {
      // Convert to float
      setNewJob({
        ...newJob,
        [name]: parseFloat(value),
      });
    } else {
      // Handle all other fields
      setNewJob({
        ...newJob,
        [name]: value,
      });
    }
  };

  // Handle create job
  const handleCreateJob = async () => {
    try {
      // Validate input
      if (
        !newJob.name ||
        !newJob.datasetId ||
        !newJob.modelType ||
        !newJob.modelName ||
        !newJob.modelVersion
      ) {
        toast({
          title: 'Error',
          description: 'Please fill all required fields',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Submit job
      const response = await axios.post(`${process.env.API_URL}/training/jobs`, newJob);
      
      // Reset form and close modal
      setNewJob({
        name: '',
        description: '',
        datasetId: '',
        modelType: '',
        modelName: '',
        modelVersion: '1.0.0',
        modelDescription: '',
        modelArchitecture: 'default',
        inputShape: {
          width: 224,
          height: 224,
          channels: 3,
        },
        applicableBodyParts: '',
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
      });
      onClose();
      
      // Add new job to list
      setTrainingJobs([response.data.data.job, ...trainingJobs]);
      
      toast({
        title: 'Success',
        description: 'Training job created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create training job',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle cancel job
  const handleCancelJob = async (id) => {
    if (!confirm('Are you sure you want to cancel this training job?')) {
      return;
    }
    
    try {
      const response = await axios.patch(`${process.env.API_URL}/training/jobs/${id}/cancel`);
      
      // Update job in list
      setTrainingJobs(
        trainingJobs.map(job => (job._id === id ? response.data.data.job : job))
      );
      
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

  // Handle delete job
  const handleDeleteJob = async (id) => {
    if (!confirm('Are you sure you want to delete this training job? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${process.env.API_URL}/training/jobs/${id}`);
      
      // Remove job from list
      setTrainingJobs(trainingJobs.filter(job => job._id !== id));
      
      toast({
        title: 'Success',
        description: 'Training job deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete training job',
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

  return (
    <ProtectedRoute adminOnly>
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Training Jobs</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onOpen}>
            Create Training Job
          </Button>
        </Flex>

        {/* Filters */}
        <Flex mb={4} wrap={{ base: 'wrap', md: 'nowrap' }} gap={4}>
          <FormControl maxW={{ base: 'full', md: '200px' }}>
            <FormLabel>Status</FormLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              placeholder="All Statuses"
            >
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="training">Training</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </Select>
          </FormControl>
        </Flex>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py={10}>
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Center>
        ) : trainingJobs.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" mb={4}>
              No training jobs found
            </Text>
            <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onOpen}>
              Create Your First Training Job
            </Button>
          </Box>
        ) : (
          <>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Dataset</Th>
                    <Th>Model</Th>
                    <Th>Status</Th>
                    <Th>Progress</Th>
                    <Th>Duration</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {trainingJobs.map((job) => (
                    <Tr key={job._id}>
                      <Td fontWeight="medium">{job.name}</Td>
                      <Td>{job.datasetName}</Td>
                      <Td>
                        {job.modelId ? (
                          <Text>
                            {job.modelId.name} v{job.modelId.version}
                          </Text>
                        ) : (
                          <Text>{job.modelType}</Text>
                        )}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(job.status)}>
                          <Flex align="center" gap={1}>
                            {getStatusIcon(job.status)}
                            <Text>{job.status}</Text>
                          </Flex>
                        </Badge>
                      </Td>
                      <Td>
                        {job.status === 'training' ? (
                          <Progress
                            value={(job.progress?.current / job.progress?.total) * 100}
                            size="sm"
                            colorScheme="teal"
                            borderRadius="md"
                            w="100px"
                          />
                        ) : job.status === 'completed' ? (
                          <Text>100%</Text>
                        ) : job.status === 'failed' ? (
                          <Text color="red.500">Failed</Text>
                        ) : (
                          <Text>{job.progress?.current || 0}/{job.progress?.total || 0}</Text>
                        )}
                      </Td>
                      <Td>
                        {job.completedAt ? formatDuration((new Date(job.completedAt) - new Date(job.startedAt)) / 1000) : 'In progress'}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<FiEye />}
                            size="sm"
                            aria-label="View job"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => router.push(`/admin/training/jobs/${job._id}`)}
                          />
                          {['pending', 'preparing', 'training'].includes(job.status) && (
                            <IconButton
                              icon={<FiPause />}
                              size="sm"
                              aria-label="Cancel job"
                              colorScheme="yellow"
                              variant="ghost"
                              onClick={() => handleCancelJob(job._id)}
                            />
                          )}
                          <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            aria-label="Delete job"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteJob(job._id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Flex justify="center" mt={6}>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    isDisabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Text>
                    Page {pagination.page} of {pagination.pages}
                  </Text>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    isDisabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            )}
          </>
        )}

        {/* Create Training Job Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Training Job</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      name="name"
                      value={newJob.name}
                      onChange={handleNewJobChange}
                      placeholder="Training job name"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Dataset</FormLabel>
                    <Select
                      name="datasetId"
                      value={newJob.datasetId}
                      onChange={handleNewJobChange}
                      placeholder="Select dataset"
                    >
                      {datasets
                        .filter(dataset => dataset.status === 'ready' && dataset.totalSamples > 0)
                        .map(dataset => (
                          <option key={dataset._id} value={dataset._id}>
                            {dataset.name} ({dataset.totalSamples} samples)
                          </option>
                        ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={newJob.description}
                    onChange={handleNewJobChange}
                    placeholder="Job description"
                  />
                </FormControl>
                
                <Divider />
                <Heading size="sm">Model Details</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Model Name</FormLabel>
                    <Input
                      name="modelName"
                      value={newJob.modelName}
                      onChange={handleNewJobChange}
                      placeholder="Model name"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Version</FormLabel>
                    <Input
                      name="modelVersion"
                      value={newJob.modelVersion}
                      onChange={handleNewJobChange}
                      placeholder="1.0.0"
                    />
                  </FormControl>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel>Model Description</FormLabel>
                  <Textarea
                    name="modelDescription"
                    value={newJob.modelDescription}
                    onChange={handleNewJobChange}
                    placeholder="Model description"
                  />
                </FormControl>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Model Architecture</FormLabel>
                    <Select
                      name="modelArchitecture"
                      value={newJob.modelArchitecture}
                      onChange={handleNewJobChange}
                    >
                      <option value="default">Default (VGG-style CNN)</option>
                      <option value="mobilenet">MobileNet (Lightweight)</option>
                      <option value="simple">Simple MLP (For testing)</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Applicable Body Parts</FormLabel>
                    <Input
                      name="applicableBodyParts"
                      value={newJob.applicableBodyParts}
                      onChange={handleNewJobChange}
                      placeholder="E.g., chest, lungs (comma separated)"
                    />
                  </FormControl>
                </SimpleGrid>
                
                <Box>
                  <FormLabel>Input Shape</FormLabel>
                  <SimpleGrid columns={3} spacing={2}>
                    <FormControl>
                      <FormLabel fontSize="sm">Width</FormLabel>
                      <Input
                        name="inputShape.width"
                        type="number"
                        value={newJob.inputShape.width}
                        onChange={handleNewJobChange}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Height</FormLabel>
                      <Input
                        name="inputShape.height"
                        type="number"
                        value={newJob.inputShape.height}
                        onChange={handleNewJobChange}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Channels</FormLabel>
                      <Select
                        name="inputShape.channels"
                        value={newJob.inputShape.channels}
                        onChange={handleNewJobChange}
                      >
                        <option value={1}>1 (Grayscale)</option>
                        <option value={3}>3 (RGB)</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>
                
                <Divider />
                <Heading size="sm">Training Parameters</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Epochs</FormLabel>
                    <Input
                      name="epochs"
                      type="number"
                      value={newJob.epochs}
                      onChange={handleNewJobChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Batch Size</FormLabel>
                    <Input
                      name="batchSize"
                      type="number"
                      value={newJob.batchSize}
                      onChange={handleNewJobChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Validation Split</FormLabel>
                    <Input
                      name="validationSplit"
                      type="number"
                      step="0.1"
                      value={newJob.validationSplit}
                      onChange={handleNewJobChange}
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="teal" onClick={handleCreateJob}>
                Create Training Job
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ProtectedRoute>
  );
};

export default TrainingJobs; 