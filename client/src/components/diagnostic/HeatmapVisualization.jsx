import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Text,
  useToast,
  Progress,
  SimpleGrid,
  Radio,
  RadioGroup,
  Stack,
  Image as ChakraImage,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { loadModel, generateHeatmap, drawHeatmapOnCanvas } from '../../utils/tfModelUtils';

// Updated component with more robust image handling
const HeatmapVisualization = ({ diagnosis, imageUrl }) => {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [selectedClass, setSelectedClass] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [classLabels, setClassLabels] = useState([]);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const hiddenImageRef = useRef(null);
  const toast = useToast();

  // Load the model on component mount
  useEffect(() => {
    const loadTfModel = async () => {
      try {
        setLoading(true);
        
        // Use mock mode for visualization
        const loadedModel = await loadModel();
        setModel(loadedModel);
        
        console.log('Model loaded successfully for visualization');

        // Set initial class index based on diagnosis if available
        if (diagnosis?.condition) {
          // Extract labels from diagnosis data if available
          const possibleLabels = diagnosis.allPredictions?.map(pred => pred.label) || 
                               [diagnosis.condition];
          
          setClassLabels(possibleLabels);
          
          // Find the index of the diagnosed condition
          const diagnosisIndex = possibleLabels.findIndex(
            label => label.toLowerCase() === diagnosis.condition.toLowerCase()
          );
          
          if (diagnosisIndex >= 0) {
            setSelectedClass(diagnosisIndex);
          }
        }
      } catch (error) {
        console.error('Failed to load visualization model:', error);
        toast({
          title: 'Visualization Failed',
          description: 'Could not load the model for visualization.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

      loadTfModel();
  }, [diagnosis, toast]);

  // Handle image loading
  useEffect(() => {
    if (!imageUrl) {
      setImageError(true);
      setImageLoaded(false);
      return;
    }

    setImageError(false);
    setImageLoaded(false);
    
    // Create a new hidden image for initial loading
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      console.log('Image loaded successfully for heatmap');
      setImageLoaded(true);
    setImageError(false);
    
      // Assign to the hiddenImageRef
      if (hiddenImageRef.current) {
        hiddenImageRef.current.src = img.src;
      }
      
      // Also set the visible image
      if (imageRef.current) {
        imageRef.current.src = img.src;
      }
      
      // Try to generate visualization after image is loaded
      generateVisualization();
    };
    
    img.onerror = (e) => {
      console.error('Failed to load image for heatmap:', e);
      setImageLoaded(false);
      setImageError(true);
      
      // Try with a different URL format
      const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
      const apiBaseUrl = baseUrl.replace('/api', '');
      
      let retryUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        retryUrl = `${apiBaseUrl}${imageUrl}`;
      } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        retryUrl = `${apiBaseUrl}/${imageUrl}`;
      }
      
      if (retryUrl !== img.src) {
        console.log('Retrying with URL:', retryUrl);
        img.src = retryUrl;
      }
    };
    
    // Start loading the image
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      img.src = imageUrl;
    } else {
      // Handle server URLs
      const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
      const apiBaseUrl = baseUrl.replace('/api', '');
      
      if (imageUrl.startsWith('/')) {
        img.src = `${apiBaseUrl}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        img.src = `${apiBaseUrl}/${imageUrl}`;
      } else {
        img.src = imageUrl;
      }
    }
      
      return () => {
        img.onload = null;
        img.onerror = null;
      };
  }, [imageUrl]);

  // Generate visualization when class changes or image loads
  const generateVisualization = async () => {
    if (!model || !canvasRef.current || !imageLoaded) {
        return;
      }

      try {
        setLoading(true);
        
      // Use the hidden image for visualization processing
      const sourceImage = hiddenImageRef.current || imageRef.current;
      
      // Make sure the canvas has the same dimensions as the image
        const canvas = canvasRef.current;
      canvas.width = sourceImage.naturalWidth || 400;
      canvas.height = sourceImage.naturalHeight || 300;
      
      // Generate the heatmap
      const heatmapTensor = await generateHeatmap(
            model, 
        sourceImage,
            {
              width: 224,
              height: 224,
              channels: 3,
            },
            selectedClass
          );
          
      // Draw the heatmap on the canvas
      await drawHeatmapOnCanvas(canvas, sourceImage, heatmapTensor);
      
      console.log('Heatmap visualization generated');
    } catch (error) {
      console.error('Error generating visualization:', error);
      
      // Draw a fallback visualization
      try {
        const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
        
        // Draw a simple gray background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a message
        ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
        ctx.fillText('Visualization unavailable', canvas.width / 2, canvas.height / 2);
      } catch (e) {
        console.error('Failed to create fallback visualization:', e);
      }
      } finally {
        setLoading(false);
      }
    };

  // Re-generate visualization when selected class changes
  useEffect(() => {
    if (imageLoaded && model) {
      generateVisualization();
    }
  }, [selectedClass, imageLoaded, model]);

  // Render component
  return (
    <Box>
      {loading && (
        <Flex justify="center" align="center" py={8}>
          <Spinner size="xl" color="teal.500" thickness="4px" />
          <Text ml={4}>Generating visualization...</Text>
        </Flex>
      )}

      {imageError && !loading && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Text>Failed to load image for visualization</Text>
        </Alert>
      )}
      
      <Box position="relative" mb={4}>
        {/* Canvas for visualization */}
        <Box>
          <canvas 
            ref={canvasRef} 
              style={{ 
                width: '100%', 
                maxHeight: '400px', 
                objectFit: 'contain',
              display: imageLoaded && !loading ? 'block' : 'none' 
            }}
          />
        </Box>
        
        {/* Hidden image for processing - not displayed */}
        <Box position="absolute" top="-9999px" left="-9999px">
          <img
            ref={hiddenImageRef}
            alt="Hidden for processing"
              crossOrigin="anonymous"
            style={{ position: 'absolute', opacity: 0 }}
          />
        </Box>
        
        {/* Image display - shown while loading or on error */}
        <Box display={loading || imageError ? 'block' : 'none'}>
          <ChakraImage
            ref={imageRef}
            src={imageUrl}
            alt="Medical scan"
            maxH="400px"
            mx="auto"
            onError={(e) => {
              console.error('Image load error in visible component:', e);
            }}
            fallback={
              <Box 
                height="300px" 
                bg="gray.100" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                borderRadius="md"
              >
                <Text color="gray.500">Image not available</Text>
              </Box>
            }
          />
        </Box>
        </Box>
        
      {classLabels.length > 1 && (
        <Box mt={4}>
          <Text fontWeight="bold" mb={2}>
            View condition areas:
          </Text>
          <RadioGroup onChange={(val) => setSelectedClass(parseInt(val, 10))} value={selectedClass.toString()}>
            <Stack direction="column">
              {classLabels.map((label, index) => (
                <Radio key={index} value={index.toString()}>
                  {label}
              </Radio>
            ))}
          </Stack>
        </RadioGroup>
      </Box>
      )}
    </Box>
  );
};

export default HeatmapVisualization; 