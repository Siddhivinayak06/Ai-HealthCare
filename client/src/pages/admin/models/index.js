import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
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
  Progress,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Grid,
  GridItem,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiInfo, FiDownload, FiRefreshCw, FiPlus } from 'react-icons/fi';
import AdminRoute from '@/components/auth/AdminRoute';
import AIResultAnalysis from '@/components/diagnostic/AIResultAnalysis';

// Client-side model cache
const clientModelCache = new Map();

const MLModels = () => {
  const router = useRouter();
  const toast = useToast();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
  });
  
  // Modal state for model analysis test
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [testImage, setTestImage] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Client-side AI state
  const [useClientModel, setUseClientModel] = useState(false);
  const [clientModel, setClientModel] = useState(null);
  const [clientModelLoading, setClientModelLoading] = useState(false);
  const [clientModelError, setClientModelError] = useState('');
  const canvasRef = useRef(null);
  
  // Functions related to testing model analysis
  const handleOpenTestModal = (model) => {
    setSelectedModel(model);
    setTestImage(null);
    setTestResult(null);
    setIsTestModalOpen(true);
    
    // If client-side inference is enabled, load the model
    if (useClientModel) {
      loadClientModel(model);
    }
  };
  
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTestImage(e.target.files[0]);
      setTestResult(null); // Clear previous results
    }
  };
  
  const handleTestAnalysis = async () => {
    if (!testImage || !selectedModel) {
      toast({
        title: 'Missing Requirements',
        description: 'Please upload an image and select a model first',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      if (useClientModel) {
        // Client-side inference
        if (!clientModel) {
          throw new Error('Model not loaded. Please try again.');
        }
        
        const result = await runClientInference(testImage, clientModel, selectedModel);
        setTestResult(result);
      } else {
        // Server-side inference
        // Create form data for image upload
        const formData = new FormData();
        formData.append('image', testImage);
        formData.append('modelId', selectedModel._id);
        
        // Log what we're sending
        console.log('Sending test analysis request with model ID:', selectedModel._id);
        console.log('Test image type:', testImage.type, 'size:', testImage.size);
        
        try {
          // Make API call to test endpoint
          const response = await fetch(`${process.env.API_URL}/admin/models/test-analysis`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            throw new Error(responseData.message || 'Failed to analyze test image');
          }
          
          // Check if we got a valid response
          if (!responseData.data || !responseData.data.result) {
            throw new Error('Invalid response from server');
          }
          
          // Set test result for display
          const aiDiagnosis = {
            condition: responseData.data.result.condition,
            confidence: responseData.data.result.confidence,
            explanation: responseData.data.result.explanation,
            timestamp: new Date(),
            isMock: responseData.data.isMock
          };
          
          setTestResult(aiDiagnosis);
          
          // Show a toast if this was a mock result
          if (responseData.data.isMock) {
            toast({
              title: 'Using Simulated Results',
              description: 'The server is providing test results in simulation mode',
              status: 'info',
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (fetchError) {
          console.error('Fetch error during test analysis:', fetchError);
          
          // Try to extract more detailed error message
          let errorMessage = fetchError.message;
          if (fetchError.response) {
            try {
              const errorData = await fetchError.response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If we can't parse the error response, just use the original message
            }
          }
          
          throw new Error(`Analysis failed: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Test analysis error:', error);
      toast({
        title: 'Analysis Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchModels = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(search && { search }),
      });

      const response = await fetch(
        `${process.env.API_URL}/admin/models?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.data.models);
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
    fetchModels(1, search);
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

  // Handle model status change
  const handleStatusChange = async (modelId, newStatus) => {
    try {
      const response = await fetch(
        `${process.env.API_URL}/admin/models/${modelId}/status`,
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

      // Refresh models list
      fetchModels(pagination.page, filters.search);
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
    fetchModels(pagination.page, filters.search);
  }, [pagination.page, filters.type, filters.status]);

  // Load model on client side
  const loadClientModel = async (model) => {
    try {
      if (!model || !model.modelPath) {
        throw new Error('Invalid model data');
      }
      
      setClientModelLoading(true);
      setClientModelError('');
      
      // Check if model is already in cache
      if (clientModelCache.has(model._id)) {
        setClientModel(clientModelCache.get(model._id));
        setClientModelLoading(false);
        toast({
          title: 'Model Loaded',
          description: `${model.name} loaded from cache`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Construct model URL
      const modelUrl = `${process.env.API_URL.replace('/api', '')}/ml-models/${model.modelPath}/model.json`;
      
      // Load the model
      const loadedModel = await tf.loadLayersModel(modelUrl);
      
      // Cache and set the model
      clientModelCache.set(model._id, loadedModel);
      setClientModel(loadedModel);
      
      toast({
        title: 'Model Loaded',
        description: `${model.name} loaded successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error loading model:', error);
      setClientModelError(`Failed to load model: ${error.message}`);
      setClientModel(null);
      
      toast({
        title: 'Model Loading Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setClientModelLoading(false);
    }
  };
  
  // Preprocess image for inference
  const preprocessImage = async (image, inputShape) => {
    return new Promise((resolve) => {
      const { width, height, channels } = inputShape;
      
      // Create a canvas to resize the image
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Create an image object from the file
      const img = new Image();
      img.onload = () => {
        // Draw and resize the image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Create a tensor from the image data
        let tensor;
        if (channels === 1) {
          // Convert to grayscale if needed
          const grayscaleData = new Float32Array(width * height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            // Standard grayscale conversion
            grayscaleData[i / 4] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          }
          tensor = tf.tensor3d(grayscaleData, [height, width, 1]);
        } else {
          // RGB image
          const rgbData = new Float32Array(width * height * 3);
          for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
            rgbData[j] = imageData.data[i] / 255;     // R
            rgbData[j + 1] = imageData.data[i + 1] / 255; // G
            rgbData[j + 2] = imageData.data[i + 2] / 255; // B
          }
          tensor = tf.tensor3d(rgbData, [height, width, 3]);
        }
        
        // Add batch dimension [1, height, width, channels]
        const batchedTensor = tensor.expandDims(0);
        resolve(batchedTensor);
      };
      
      img.src = URL.createObjectURL(image);
    });
  };
  
  // Run client-side inference
  const runClientInference = async (image, model, modelDetails) => {
    // Preprocess the image
    const inputTensor = await preprocessImage(image, modelDetails.inputShape);
    
    // Run inference
    const outputTensor = tf.tidy(() => {
      return model.predict(inputTensor);
    });
    
    // Get predictions array
    const predictions = await outputTensor.data();
    
    // Find the index with the highest confidence
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    
    // Get the corresponding label and confidence
    const condition = modelDetails.conditions[maxIndex] || 'Unknown';
    const confidence = predictions[maxIndex] * 100;
    
    // Generate explanation
    const explanation = {
      summary: `AI model detected ${condition} with ${confidence.toFixed(1)}% confidence.`,
      confidenceLevel: getConfidenceLevel(confidence),
      details: [
        getConfidenceLevelDescription(condition, confidence),
        `This analysis was performed using a ${modelDetails.name} (v${modelDetails.version}) ${modelDetails.modelType} model with client-side inference.`,
        getConditionDescription(condition)
      ],
      recommendations: getConditionRecommendations(condition)
    };
    
    // Clean up tensors
    tf.dispose([inputTensor, outputTensor]);
    
    return {
      condition,
      confidence,
      explanation,
      timestamp: new Date()
    };
  };
  
  // Helper functions for generating explanations
  const getConfidenceLevel = (confidence) => {
    if (confidence > 90) return 'very high';
    if (confidence > 75) return 'high';
    if (confidence > 50) return 'moderate';
    return 'low';
  };
  
  const getConfidenceLevelDescription = (condition, confidence) => {
    if (confidence > 90) {
      return `The AI is very confident in this diagnosis (${confidence.toFixed(1)}% confidence).`;
    } else if (confidence > 75) {
      return `The AI is confident in this diagnosis (${confidence.toFixed(1)}% confidence).`;
    } else if (confidence > 50) {
      return `The AI has moderate confidence in this diagnosis (${confidence.toFixed(1)}% confidence).`;
    } else {
      return `The AI has low confidence in this diagnosis (${confidence.toFixed(1)}% confidence). Consider additional testing.`;
    }
  };
  
  const getConditionDescription = (condition) => {
    const conditionData = {
      'pneumonia': 'Pneumonia is an infection that inflames the air sacs in one or both lungs, which may fill with fluid.',
      'covid': 'COVID-19 is a respiratory disease caused by the SARS-CoV-2 virus, which can cause various levels of respiratory distress.',
      'normal': 'No abnormalities detected in the image.',
      'fracture': 'A fracture is a break in the continuity of the bone, which can vary in severity.',
    };
    
    return conditionData[condition.toLowerCase()] || '';
  };
  
  const getConditionRecommendations = (condition) => {
    const recommendationsData = {
      'pneumonia': [
        'Consult with a physician for proper evaluation',
        'Additional tests may include blood tests, sputum tests, or chest CT scan',
        'Follow-up imaging recommended after treatment'
      ],
      'covid': [
        'Immediate isolation to prevent spread',
        'Follow-up with PCR testing to confirm diagnosis',
        'Monitor oxygen levels and symptoms',
        'Consult with a healthcare provider for treatment options'
      ],
      'normal': [
        'Regular check-ups as recommended by your healthcare provider',
        'Maintain preventive healthcare practices'
      ],
      'fracture': [
        'Immobilize the affected area',
        'Consult with an orthopedic specialist',
        'Follow-up imaging to monitor healing',
        'Physical therapy may be recommended after initial healing'
      ]
    };
    
    return recommendationsData[condition.toLowerCase()] || [];
  };
  
  // Toggle between client and server inference
  const handleToggleClientInference = (e) => {
    const useClient = e.target.checked;
    setUseClientModel(useClient);
    
    if (useClient && selectedModel) {
      loadClientModel(selectedModel);
    }
  };

  // Add the sync models function
  const handleSyncModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.API_URL}/admin/models/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync models');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: data.message || 'Models synchronized successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh models list
      fetchModels(1);
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

  return (
    <AdminRoute>
      <Box py={8}>
        <Container maxW="container.xl">
          <HStack mb={6} justifyContent="space-between">
            <Heading as="h1" size="xl">
              AI Models
            </Heading>
            <HStack spacing={4}>
              <Button 
                leftIcon={<FiRefreshCw />} 
                colorScheme="purple" 
                onClick={handleSyncModels}
                isLoading={loading}
                loadingText="Syncing"
              >
                Sync Models
              </Button>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={() => router.push('/admin/models/new')}
              >
                Add Model
              </Button>
            </HStack>
          </HStack>
          
          {/* Add hidden canvas for image processing */}
          <canvas 
            ref={canvasRef} 
            style={{ display: 'none' }} 
          />
          
          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {/* Filters with client-side toggle */}
          <Flex justifyContent="space-between" flexWrap="wrap" mb={6}>
            <HStack spacing={4} flex="1" minW="300px">
              <Select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                placeholder="Filter by Type"
                width="200px"
              >
                <option value="classification">Classification</option>
                <option value="detection">Detection</option>
                <option value="segmentation">Segmentation</option>
                <option value="prediction">Prediction</option>
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
                <option value="testing">Testing</option>
                <option value="archived">Archived</option>
              </Select>

              <Input
                placeholder="Search models..."
                value={filters.search}
                onChange={handleSearchChange}
                width="300px"
              />
            </HStack>
            
            <HStack spacing={2} mt={{ base: 4, md: 0 }}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="client-inference" mb="0" fontSize="sm">
                  Client-side inference
                </FormLabel>
                <Switch 
                  id="client-inference" 
                  colorScheme="teal" 
                  isChecked={useClientModel}
                  onChange={handleToggleClientInference}
                />
                <Tooltip 
                  label="Run models directly in browser for faster analysis with no server round-trip" 
                  placement="top"
                >
                  <IconButton
                    aria-label="Info about client-side inference"
                    icon={<FiInfo />}
                    size="sm"
                    variant="ghost"
                    ml={1}
                  />
                </Tooltip>
              </FormControl>
            </HStack>
          </Flex>
          
          {loading ? (
            <Center py={10}>
              <Spinner size="xl" color="teal.500" thickness="4px" />
            </Center>
          ) : models.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text fontSize="lg">No models found</Text>
            </Box>
          ) : (
            <>
              {/* Models Table */}
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Version</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Accuracy</Th>
                      <Th>Usage Count</Th>
                      <Th>Last Used</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {models.map((model) => (
                      <Tr key={model._id}>
                        <Td>{model.name}</Td>
                        <Td>{model.version}</Td>
                        <Td>
                          <Badge colorScheme="blue">{model.modelType}</Badge>
                        </Td>
                        <Td>
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
                        </Td>
                        <Td>
                          <HStack>
                            <Text>{model.performance?.accuracy?.toFixed(1)}%</Text>
                            <Progress
                              value={model.performance?.accuracy}
                              size="sm"
                              colorScheme="green"
                              width="100px"
                            />
                          </HStack>
                        </Td>
                        <Td>{model.usageCount || 0}</Td>
                        <Td>{model.lastUsed ? new Date(model.lastUsed).toLocaleDateString() : 'Never'}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme="teal"
                              onClick={() => handleOpenTestModal(model)}
                            >
                              Test Analysis
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => router.push(`/admin/models/${model._id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              colorScheme={model.status === 'active' ? 'red' : 'green'}
                              onClick={() => handleStatusChange(model._id, model.status === 'active' ? 'inactive' : 'active')}
                            >
                              {model.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              
              {/* Pagination */}
              <Flex justifyContent="center" mt={6}>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    isDisabled={pagination.page === 1}
                  >
                    First
                  </Button>
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
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(pagination.pages)}
                    isDisabled={pagination.page === pagination.pages}
                  >
                    Last
                  </Button>
                </HStack>
              </Flex>
            </>
          )}
          
          {/* Test Analysis Modal with client-side info */}
          <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                Test Model Analysis
                {selectedModel && (
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="normal">
                      {selectedModel.name} v{selectedModel.version}
                    </Text>
                    {useClientModel && (
                      <Badge colorScheme="purple" mt={1}>
                        {clientModelLoading 
                          ? "Loading model..." 
                          : clientModel 
                            ? "Client-side inference ready" 
                            : "Client-side inference not available"}
                      </Badge>
                    )}
                  </VStack>
                )}
              </ModalHeader>
              <ModalCloseButton />
              
              <ModalBody>
                {clientModelError && (
                  <Alert status="error" mb={4}>
                    <AlertIcon />
                    {clientModelError}
                  </Alert>
                )}
                
                <Tabs variant="enclosed">
                  <TabList>
                    <Tab>Upload Test Image</Tab>
                    {testResult && <Tab>Analysis Results</Tab>}
                  </TabList>
                  
                  <TabPanels>
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        {useClientModel && (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <Text fontWeight="bold">Client-Side Inference {clientModel ? 'Active' : 'Inactive'}</Text>
                              <Text fontSize="sm">
                                {clientModel 
                                  ? "Using browser-based TensorFlow.js for real-time analysis"
                                  : "Loading model in browser..."}
                              </Text>
                            </Box>
                          </Alert>
                        )}
                        
                        <Box>
                          <Text mb={2}>Upload an image to test this model:</Text>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            style={{ marginBottom: '12px' }}
                          />
                          
                          {testImage && (
                            <Box mt={4}>
                              <Text fontWeight="bold" mb={2}>Preview:</Text>
                              <Box 
                                border="1px solid" 
                                borderColor="gray.200" 
                                borderRadius="md" 
                                p={2}
                                maxW="300px"
                              >
                                <img 
                                  src={URL.createObjectURL(testImage)} 
                                  alt="Test" 
                                  style={{ maxWidth: '100%' }} 
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                        
                        <Button 
                          colorScheme="teal" 
                          isDisabled={!testImage || (useClientModel && !clientModel)}
                          onClick={handleTestAnalysis}
                          isLoading={isAnalyzing}
                          loadingText={useClientModel ? "Analyzing in browser" : "Analyzing"}
                        >
                          {useClientModel ? "Analyze in Browser" : "Analyze with Server"}
                        </Button>
                      </VStack>
                    </TabPanel>
                    
                    {testResult && (
                      <TabPanel>
                        <AIResultAnalysis aiDiagnosis={testResult} />
                      </TabPanel>
                    )}
                  </TabPanels>
                </Tabs>
              </ModalBody>
              
              <ModalFooter>
                <Button onClick={() => setIsTestModalOpen(false)}>Close</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Container>
      </Box>
    </AdminRoute>
  );
};

export default MLModels; 