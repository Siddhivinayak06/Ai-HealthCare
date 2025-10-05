import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Grid,
  GridItem,
  Image,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Divider,
  VStack,
  HStack,
  Select,
  Textarea,
  Spinner,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  useToast,
  useColorModeValue,
  SimpleGrid,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  FiArrowLeft,
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiEdit,
  FiExternalLink,
} from 'react-icons/fi';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';
import HeatmapVisualization from '../../../components/diagnostic/HeatmapVisualization';
import AIResultAnalysis from '../../../components/diagnostic/AIResultAnalysis';

const RecordDetail = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [preloadedImage, setPreloadedImage] = useState(null);
  
  const toast = useToast();
  
  // Fetch record data
  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Determine API endpoint based on user role
        const endpoint = user?.role === 'admin'
          ? `${process.env.API_URL}/diagnostics/records/${id}`
          : `${process.env.API_URL}/users/records/${id}`;
        
        const response = await axios.get(endpoint);
        setRecord(response.data.data.record);
        
        // If record status is pending or processing, also fetch available ML models
        if (
          response.data.data.record.status === 'pending' ||
          response.data.data.record.status === 'processing'
        ) {
          fetchAvailableModels(response.data.data.record.recordType, response.data.data.record.bodyPart);
        }
        
      } catch (err) {
        console.error('Failed to fetch record:', err);
        setError('Failed to load medical record. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [id, user]);
  
  // Fetch available ML models for analysis
  const fetchAvailableModels = async (recordType, bodyPart) => {
    try {
      const response = await axios.get(`${process.env.API_URL}/diagnostics/models`, {
        params: { recordType, bodyPart },
      });
      
      setAvailableModels(response.data.data.models);
      
      // Auto-select the first model if available
      if (response.data.data.models.length > 0) {
        setSelectedModel(response.data.data.models[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch ML models:', err);
    }
  };
  
  // Handle AI analysis
  const handleAnalyze = async () => {
    if (!selectedModel) {
      toast({
        title: 'Error',
        description: 'Please select an ML model for analysis.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setAnalyzing(true);
      
      const response = await axios.post(`${process.env.API_URL}/diagnostics/analyze/${id}`, {
        modelId: selectedModel,
      });
      
      setRecord(response.data.data.record);
      
      toast({
        title: 'Analysis Complete',
        description: 'The medical image has been successfully analyzed.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Analysis error:', err);
      toast({
        title: 'Analysis Failed',
        description: err.response?.data?.message || 'Failed to analyze the medical image.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Handle doctor's diagnosis
  const handleDoctorDiagnosis = async () => {
    if (!record.diagnosisResults?.aiDiagnosis?.condition) {
      toast({
        title: 'Error',
        description: 'Please perform AI analysis first before adding doctor diagnosis.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const response = await axios.patch(`${process.env.API_URL}/diagnostics/records/${id}/diagnosis`, {
        condition: record.diagnosisResults.aiDiagnosis.condition,
        notes: doctorNotes,
      });
      
      setRecord(response.data.data.record);
      
      toast({
        title: 'Diagnosis Updated',
        description: 'Doctor diagnosis has been added successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Diagnosis update error:', err);
      toast({
        title: 'Update Failed',
        description: err.response?.data?.message || 'Failed to update diagnosis.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle image preview
  const handleImageClick = (imageUrl) => {
    // Ensure the URL uses the full API URL
    const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
    const apiBaseUrl = baseUrl.replace('/api', '');
    
    // Clean up any duplicate slashes in the URL
    let cleanUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      cleanUrl = `${apiBaseUrl}${imageUrl}`;
    } else if (!imageUrl.startsWith('http')) {
      cleanUrl = `${apiBaseUrl}/${imageUrl}`;
    }
    
    console.log('Opening image:', cleanUrl);
    setSelectedImage(cleanUrl);
    setImageModalOpen(true);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get status color
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
  
  // Preload the first image for visualization
  useEffect(() => {
    if (record?.images?.length > 0) {
      // Build correct URL for the image
      const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
      const apiBaseUrl = baseUrl.replace('/api', '');
      
      let imageUrl = record.images[0].url;
      if (imageUrl.startsWith('/')) {
        imageUrl = `${apiBaseUrl}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = `${apiBaseUrl}/${imageUrl}`;
      }
      
      console.log('Loading image from:', imageUrl);
      
      // Create a new image and wait for it to load
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        // Create a canvas to convert the image to a data URL
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          // Try to get image data (will throw if CORS issues)
          ctx.getImageData(0, 0, 1, 1);
          
          // Convert to data URL to avoid CORS issues in the visualization
          const dataUrl = canvas.toDataURL('image/png');
          setPreloadedImage(dataUrl);
          console.log('Image successfully preloaded and converted to data URL');
        } catch (error) {
          console.error('CORS error when accessing image data:', error);
          // Fall back to original URL if we can't create a data URL
          setPreloadedImage(imageUrl);
        }
      };
      
      img.onerror = (error) => {
        console.error('Error preloading image:', error);
        setPreloadedImage(imageUrl);
      };
      
      img.src = imageUrl;
    }
  }, [record]);

  // Function to get the image URL for visualization
  const getVisualizationImageUrl = () => {
    if (preloadedImage) return preloadedImage;
    
    if (record?.images?.length > 0) {
      const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
      const apiBaseUrl = baseUrl.replace('/api', '');
      
      let imageUrl = record.images[0].url;
      if (imageUrl.startsWith('/')) {
        return `${apiBaseUrl}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        return `${apiBaseUrl}/${imageUrl}`;
      }
      return imageUrl;
    }
    
    return null;
  };
  
  // Function to request a second opinion
  const handleRequestSecondOpinion = async () => {
    toast({
      title: 'Second Opinion Requested',
      description: 'Your request for a second opinion has been submitted.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    // In a real implementation, you would:
    // 1. Send a request to the server
    // 2. Notify appropriate healthcare providers
    // 3. Update the record status
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="70vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
        <Button leftIcon={<FiArrowLeft />} mt={4} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }
  
  if (!record) {
    return (
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Record not found</AlertTitle>
        </Alert>
        <Button leftIcon={<FiArrowLeft />} mt={4} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }
  
  return (
    <ProtectedRoute>
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Flex mb={6} justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
          <Button leftIcon={<FiArrowLeft />} onClick={() => router.back()}>
            Back to Records
          </Button>
          
          <HStack>
            <Badge
              fontSize="md"
              colorScheme={getStatusColor(record.status)}
              p={2}
              borderRadius="md"
            >
              Status: {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
            </Badge>
          </HStack>
        </Flex>
        
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Left column: Images and Analysis */}
          <GridItem>
            <Card mb={6} bg={useColorModeValue('white', 'gray.700')} shadow="md">
              <CardHeader pb={0}>
                <Heading size="md">Medical Images</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                  {record.images.map((image, index) => (
                    <Box
                      key={index}
                      position="relative"
                      cursor="pointer"
                      onClick={() => {
                        const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
                        const apiBaseUrl = baseUrl.replace('/api', '');
                        
                        let imageUrl = image.url;
                        if (imageUrl.startsWith('/')) {
                          handleImageClick(`${apiBaseUrl}${imageUrl}`);
                        } else if (!imageUrl.startsWith('http')) {
                          handleImageClick(`${apiBaseUrl}/${imageUrl}`);
                        } else {
                          handleImageClick(imageUrl);
                        }
                      }}
                      borderRadius="md"
                      overflow="hidden"
                      border="1px solid"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                    >
                      <Image
                        src={(() => {
                          const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
                          const apiBaseUrl = baseUrl.replace('/api', '');
                          
                          let imageUrl = image.url;
                          if (imageUrl.startsWith('/')) {
                            return `${apiBaseUrl}${imageUrl}`;
                          } else if (!imageUrl.startsWith('http')) {
                            return `${apiBaseUrl}/${imageUrl}`;
                          }
                          return imageUrl;
                        })()}
                        alt={`Medical image ${index + 1}`}
                        height="150px"
                        width="100%"
                        objectFit="cover"
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          e.target.onerror = null;
                          e.target.src = '/placeholder-medical-image.png'; // Fallback image
                        }}
                      />
                      <IconButton
                        icon={<FiExternalLink />}
                        size="sm"
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="teal"
                        opacity={0.8}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`${process.env.API_URL.replace('/api', '')}${image.url}`, '_blank');
                        }}
                        aria-label="Open full size"
                      />
                      <Text
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        bg="blackAlpha.600"
                        color="white"
                        p={1}
                        fontSize="xs"
                      >
                        Image {index + 1}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
            
            {/* Analysis Section */}
            <Card mb={6} bg={useColorModeValue('white', 'gray.700')} shadow="md">
              <CardHeader>
                <Heading size="md">AI Diagnosis</Heading>
              </CardHeader>
              <CardBody>
                {record.status === 'pending' && (
                  <Box>
                    <Alert status="info" mb={4} borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Ready for Analysis</AlertTitle>
                        <Text>Select an ML model to analyze this medical image.</Text>
                      </Box>
                    </Alert>
                    
                    <HStack mb={4}>
                      <Select
                        placeholder="Select ML model"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        isDisabled={availableModels.length === 0 || analyzing}
                        flex={1}
                      >
                        {availableModels.map((model) => (
                          <option key={model._id} value={model._id}>
                            {model.name} v{model.version} ({model.performance.accuracy}% accuracy)
                          </option>
                        ))}
                      </Select>
                      <Button
                        colorScheme="teal"
                        onClick={handleAnalyze}
                        isLoading={analyzing}
                        loadingText="Analyzing"
                        isDisabled={availableModels.length === 0 || !selectedModel}
                      >
                        Analyze
                      </Button>
                    </HStack>
                  </Box>
                )}
                
                {record.status === 'processing' && (
                  <Box textAlign="center" py={4}>
                    <Spinner size="xl" mb={4} />
                    <Text>Analysis in progress...</Text>
                    <Progress size="sm" isIndeterminate colorScheme="teal" mt={2} />
                  </Box>
                )}
                
                {(record.status === 'diagnosed' || record.status === 'reviewed') && (
                  <Box>
                    {record.diagnosisResults?.aiDiagnosis?.condition ? (
                      <Box>
                        <AIResultAnalysis 
                          aiDiagnosis={record.diagnosisResults.aiDiagnosis}
                          onRequestSecondOpinion={handleRequestSecondOpinion}
                        />
                        
                        <Box mt={6}>
                          <Text fontWeight="bold" mb={2}>
                            Analysis Information:
                          </Text>
                          <Text>Model: {record.modelUsed?.name} v{record.modelUsed?.version}</Text>
                          <Text>Analysis Date: {formatDate(record.updatedAt)}</Text>
                        </Box>
                        
                        {record.status === 'diagnosed' && user?.role === 'admin' && (
                          <Box mt={4}>
                            <Divider mb={4} />
                            <Heading size="sm" mb={2}>
                              Doctor's Review
                            </Heading>
                            <Textarea
                              placeholder="Add your professional diagnosis notes..."
                              value={doctorNotes}
                              onChange={(e) => setDoctorNotes(e.target.value)}
                              mb={2}
                            />
                            <Button
                              colorScheme="purple"
                              onClick={handleDoctorDiagnosis}
                              leftIcon={<FiEdit />}
                            >
                              Submit Diagnosis
                            </Button>
                          </Box>
                        )}
                        
                        {record.status === 'reviewed' && (
                          <Box mt={4} p={4} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="md">
                            <Heading size="sm" mb={2}>
                              Doctor's Diagnosis
                            </Heading>
                            <Text mb={2}>
                              <strong>Condition:</strong>{' '}
                              {record.diagnosisResults.doctorDiagnosis.condition}
                            </Text>
                            <Text mb={2}>
                              <strong>Notes:</strong>{' '}
                              {record.diagnosisResults.doctorDiagnosis.notes || 'No additional notes'}
                            </Text>
                          </Box>
                        )}
                        
                        {/* Add visualization if available */}
                        {getVisualizationImageUrl() && (
                          <Box mt={6}>
                            <Heading size="sm" mb={3}>
                              AI Visualization
                            </Heading>
                            <HeatmapVisualization
                              imageUrl={getVisualizationImageUrl()}
                              diagnosis={record.diagnosisResults.aiDiagnosis}
                            />
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>No Diagnosis Available</AlertTitle>
                          <Text>There was an issue with the AI diagnosis. Please try analyzing again.</Text>
                        </Box>
                      </Alert>
                    )}
                  </Box>
                )}
              </CardBody>
            </Card>
          </GridItem>
          
          {/* Right column: Record Details */}
          <GridItem>
            <Card bg={useColorModeValue('white', 'gray.700')} shadow="md">
              <CardHeader pb={0}>
                <Heading size="md">Record Details</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={4} divider={<Divider />}>
                  <Box width="100%">
                    <Text fontWeight="bold" color="gray.500">
                      Record ID
                    </Text>
                    <Text>{record._id}</Text>
                  </Box>
                  
                  <Box width="100%">
                    <Text fontWeight="bold" color="gray.500">
                      Record Type
                    </Text>
                    <Text>
                      {record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1)}
                    </Text>
                  </Box>
                  
                  <Box width="100%">
                    <Text fontWeight="bold" color="gray.500">
                      Body Part
                    </Text>
                    <Text>{record.bodyPart}</Text>
                  </Box>
                  
                  <Box width="100%">
                    <Text fontWeight="bold" color="gray.500">
                      Uploaded On
                    </Text>
                    <Text>{formatDate(record.createdAt)}</Text>
                  </Box>
                  
                  {user?.role === 'admin' && (
                    <Box width="100%">
                      <Text fontWeight="bold" color="gray.500">
                        Patient
                      </Text>
                      <Text>
                        {record.patient?.name || 'Unknown'} ({record.patient?.email || 'No email'})
                      </Text>
                    </Box>
                  )}
                  
                  {record.patientHistory && Object.keys(record.patientHistory).some(key => record.patientHistory[key]) && (
                    <Box width="100%">
                      <Text fontWeight="bold" color="gray.500" mb={2}>
                        Patient History
                      </Text>
                      <SimpleGrid columns={2} spacing={2}>
                        {record.patientHistory.age && (
                          <>
                            <Text fontWeight="medium">Age:</Text>
                            <Text>{record.patientHistory.age} years</Text>
                          </>
                        )}
                        {record.patientHistory.weight && (
                          <>
                            <Text fontWeight="medium">Weight:</Text>
                            <Text>{record.patientHistory.weight} kg</Text>
                          </>
                        )}
                        {record.patientHistory.height && (
                          <>
                            <Text fontWeight="medium">Height:</Text>
                            <Text>{record.patientHistory.height} cm</Text>
                          </>
                        )}
                      </SimpleGrid>
                      {record.patientHistory.symptoms && (
                        <Box mt={2}>
                          <Text fontWeight="medium">Symptoms:</Text>
                          <Text>{record.patientHistory.symptoms}</Text>
                        </Box>
                      )}
                      {record.patientHistory.allergies && (
                        <Box mt={2}>
                          <Text fontWeight="medium">Allergies:</Text>
                          <Text>{record.patientHistory.allergies}</Text>
                        </Box>
                      )}
                      {record.patientHistory.medications && (
                        <Box mt={2}>
                          <Text fontWeight="medium">Medications:</Text>
                          <Text>{record.patientHistory.medications}</Text>
                        </Box>
                      )}
                      {record.patientHistory.familyHistory && (
                        <Box mt={2}>
                          <Text fontWeight="medium">Family History:</Text>
                          <Text>{record.patientHistory.familyHistory}</Text>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {record.notes && (
                    <Box width="100%">
                      <Text fontWeight="bold" color="gray.500">
                        Notes
                      </Text>
                      <Text>{record.notes}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Box>
      
      {/* Full Image Modal */}
      <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Image Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Full size preview"
                maxH="80vh"
                mx="auto"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </ProtectedRoute>
  );
};

export default RecordDetail; 