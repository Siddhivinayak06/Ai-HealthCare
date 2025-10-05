import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Button,
  Progress,
  Alert,
  AlertIcon,
  Spinner,
  HStack,
  VStack,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  IconButton,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiInfo, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import {
  loadModel,
  runInference,
  clearModelCache,
  getMemoryInfo
} from '../../utils/clientModelManager';
import AIResultAnalysis from './AIResultAnalysis';

const RealTimeAnalysis = ({ imageFiles, recordType, bodyPart }) => {
  const [useClientInference, setUseClientInference] = useState(true);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [clientModel, setClientModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [error, setError] = useState('');
  
  const toast = useToast();
  
  // Fetch available models when recordType and bodyPart change
  useEffect(() => {
    if (recordType && bodyPart) {
      fetchAvailableModels();
    }
  }, [recordType, bodyPart]);
  
  // Load model when selected
  useEffect(() => {
    if (selectedModel && useClientInference) {
      loadClientModel();
    }
  }, [selectedModel, useClientInference]);
  
  // Analyze images when files change and we have a model
  useEffect(() => {
    if (imageFiles.length > 0 && selectedModel) {
      if (useClientInference && clientModel) {
        analyzeImagesWithClientModel();
      } else if (!useClientInference) {
        analyzeImagesWithServer();
      }
    }
  }, [imageFiles, selectedModel, clientModel]);
  
  // Clean up model cache when component unmounts
  useEffect(() => {
    return () => {
      clearModelCache();
    };
  }, []);
  
  // Fetch available models for the current record type and body part
  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/diagnostics/models`, {
        params: { recordType, bodyPart },
      });
      
      setAvailableModels(response.data.data.models);
      
      // Auto-select the first model if available
      if (response.data.data.models.length > 0) {
        setSelectedModel(response.data.data.models[0]);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to fetch compatible AI models. Please try again.');
    }
  };
  
  // Load client model
  const loadClientModel = async () => {
    if (!selectedModel || !selectedModel.modelPath) {
      setError('Invalid model selected');
      return;
    }
    
    try {
      setIsModelLoading(true);
      setError('');
      
      // Construct model URL
      const modelUrl = `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/ml-models/${selectedModel.modelPath}/model.json`;
      
      // Load the model
      const model = await loadModel(selectedModel._id, modelUrl);
      setClientModel(model);
      
      toast({
        title: 'Model Loaded',
        description: `${selectedModel.name} loaded for real-time analysis`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (err) {
      console.error('Error loading model:', err);
      setError(`Failed to load model: ${err.message}`);
      setClientModel(null);
    } finally {
      setIsModelLoading(false);
    }
  };
  
  // Analyze images with client-side model
  const analyzeImagesWithClientModel = async () => {
    if (!clientModel || imageFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setError('');
    const newResults = [];
    
    try {
      for (const file of imageFiles) {
        // Run inference on the file
        const result = await runInference(clientModel, file, {
          inputShape: selectedModel.inputShape,
          labels: selectedModel.conditions,
          modelDetails: {
            name: selectedModel.name,
            version: selectedModel.version,
            modelType: selectedModel.modelType
          }
        });
        
        newResults.push({
          file,
          result
        });
      }
      
      setAnalysisResults(newResults);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Analyze images with server
  const analyzeImagesWithServer = async () => {
    if (!selectedModel || imageFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setError('');
    const newResults = [];
    
    try {
      for (const file of imageFiles) {
        // Create form data for image upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('modelId', selectedModel._id);
        
        // Make API call to test endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/diagnostics/analyze-image`,
          formData
        );
        
        newResults.push({
          file,
          result: response.data.data.result
        });
      }
      
      setAnalysisResults(newResults);
    } catch (err) {
      console.error('Server analysis error:', err);
      setError(`Server analysis failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Toggle between client and server inference
  const handleToggleClientInference = () => {
    setUseClientInference(!useClientInference);
    setAnalysisResults([]);
  };
  
  // Manually refresh analysis
  const handleRefreshAnalysis = () => {
    if (useClientInference && clientModel) {
      analyzeImagesWithClientModel();
    } else if (!useClientInference) {
      analyzeImagesWithServer();
    }
  };
  
  // If no record type or body part, show nothing
  if (!recordType || !bodyPart) {
    return null;
  }
  
  return (
    <Card variant="outline">
      <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
        <HStack justify="space-between">
          <Heading size="md">Real-Time AI Analysis</Heading>
          <FormControl display="flex" alignItems="center" width="auto">
            <FormLabel htmlFor="client-inference" mb="0" fontSize="sm">
              Browser-based
            </FormLabel>
            <Switch 
              id="client-inference" 
              colorScheme="teal" 
              isChecked={useClientInference}
              onChange={handleToggleClientInference}
              isDisabled={isAnalyzing || isModelLoading}
            />
            <Tooltip 
              label="Run AI directly in your browser instead of sending images to the server" 
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
      </CardHeader>
      
      <CardBody>
        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* Model status */}
        <Box mb={4}>
          {isModelLoading ? (
            <HStack spacing={2}>
              <Spinner size="sm" />
              <Text>Loading AI model...</Text>
            </HStack>
          ) : selectedModel ? (
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{selectedModel.name}</Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue">{selectedModel.modelType}</Badge>
                  <Badge colorScheme="green">{selectedModel.performance?.accuracy.toFixed(1)}% accuracy</Badge>
                  {useClientInference && (
                    <Badge colorScheme={clientModel ? "purple" : "red"}>
                      {clientModel ? "Browser Model Ready" : "Model Not Loaded"}
                    </Badge>
                  )}
                </HStack>
              </VStack>
              <Button 
                leftIcon={<FiRefreshCw />}
                size="sm"
                onClick={handleRefreshAnalysis}
                isLoading={isAnalyzing}
                loadingText="Analyzing"
                isDisabled={
                  (useClientInference && !clientModel) || 
                  imageFiles.length === 0 || 
                  isModelLoading
                }
              >
                Refresh
              </Button>
            </HStack>
          ) : (
            <Text>No compatible AI models found for {recordType} images.</Text>
          )}
        </Box>
        
        {/* Analysis progress */}
        {isAnalyzing && (
          <Box mb={4}>
            <Text mb={2}>Analyzing {imageFiles.length} images...</Text>
            <Progress size="sm" isIndeterminate colorScheme="teal" />
          </Box>
        )}
        
        {/* Analysis results */}
        {!isAnalyzing && analysisResults.length > 0 && (
          <VStack spacing={6} align="stretch">
            {analysisResults.map((item, index) => (
              <Box key={index}>
                <Text fontWeight="bold" mb={2}>
                  Image {index + 1}: {item.file.name}
                </Text>
                <AIResultAnalysis aiDiagnosis={item.result} />
              </Box>
            ))}
          </VStack>
        )}
        
        {/* Empty state */}
        {!isAnalyzing && analysisResults.length === 0 && imageFiles.length > 0 && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            {useClientInference && !clientModel ? (
              <Text>Waiting for AI model to load...</Text>
            ) : (
              <Text>Images ready for analysis.</Text>
            )}
          </Alert>
        )}
        
        {/* No images state */}
        {!isAnalyzing && imageFiles.length === 0 && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Upload images to see real-time AI analysis.</Text>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
};

export default RealTimeAnalysis; 