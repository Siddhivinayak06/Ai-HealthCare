import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  Stack,
  Text,
  useToast,
  VStack,
  HStack,
  Image,
  Flex,
  Card,
  CardBody,
  Icon,
  IconButton,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX } from 'react-icons/fi';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import RealTimeAnalysis from '../../components/diagnostic/RealTimeAnalysis';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [recordType, setRecordType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [patientHistory, setPatientHistory] = useState({
    age: '',
    weight: '',
    height: '',
    symptoms: '',
    allergies: '',
    medications: '',
    familyHistory: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const toast = useToast();
  const router = useRouter();
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    // Limit to 5 files
    const newFiles = [...files, ...acceptedFiles].slice(0, 5);
    setFiles(newFiles);
  }, [files]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'application/dicom': [],
    },
    maxSize: 10485760, // 10MB
  });
  
  // Remove file
  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  // Handle patient history changes
  const handleHistoryChange = (e) => {
    const { name, value } = e.target;
    setPatientHistory({ ...patientHistory, [name]: value });
  };
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    if (!recordType || !bodyPart) {
      setError('Record type and body part are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create form data
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      formData.append('recordType', recordType);
      formData.append('bodyPart', bodyPart);
      formData.append('patientHistory', JSON.stringify(patientHistory));
      
      // Upload files
      const response = await axios.post(`${process.env.API_URL}/diagnostics/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast({
        title: 'Upload Successful',
        description: 'Your medical images have been uploaded successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to the record page
      router.push(`/diagnostics/records/${response.data.data.record._id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Heading as="h1" size="xl" mb={6}>
          Upload Medical Images
        </Heading>
        
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Box>
              <Heading as="h2" size="md" mb={4}>
                Upload Images
              </Heading>
              
              <Box
                {...getRootProps()}
                p={6}
                border="2px dashed"
                borderColor={isDragActive ? 'teal.400' : 'gray.300'}
                borderRadius="md"
                bg={isDragActive ? 'teal.50' : 'transparent'}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: 'teal.400' }}
                mb={4}
              >
                <input {...getInputProps()} />
                <VStack spacing={2} align="center">
                  <Icon as={FiUpload} w={10} h={10} color="gray.400" />
                  <Text textAlign="center">
                    {isDragActive
                      ? 'Drop the files here...'
                      : 'Drag & drop images here, or click to select files'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Maximum 5 files (10MB each)
                  </Text>
                </VStack>
              </Box>
              
              {files.length > 0 && (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={6}>
                  {files.map((file, index) => (
                    <Card key={index} overflow="hidden" variant="outline">
                      <CardBody p={2}>
                        <Box position="relative">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            borderRadius="md"
                            height="100px"
                            width="100%"
                            objectFit="cover"
                          />
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            position="absolute"
                            top={1}
                            right={1}
                            colorScheme="red"
                            opacity={0.8}
                            onClick={() => removeFile(index)}
                            aria-label="Remove image"
                          />
                        </Box>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
              
              {/* Real-time AI analysis */}
              {files.length > 0 && recordType && bodyPart && (
                <Box mt={6}>
                  <RealTimeAnalysis 
                    imageFiles={files} 
                    recordType={recordType} 
                    bodyPart={bodyPart}
                  />
                </Box>
              )}
            </Box>
            
            <Box>
              <Heading as="h2" size="md" mb={4}>
                Medical Record Information
              </Heading>
              
              <VStack spacing={4} align="start">
                <FormControl isRequired>
                  <FormLabel>Record Type</FormLabel>
                  <Select
                    placeholder="Select record type"
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                  >
                    <option value="xray">X-Ray</option>
                    <option value="mri">MRI</option>
                    <option value="ct">CT Scan</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Body Part</FormLabel>
                  <Select
                    placeholder="Select body part"
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value)}
                  >
                    <option value="chest">Chest</option>
                    <option value="head">Head</option>
                    <option value="spine">Spine</option>
                    <option value="abdomen">Abdomen</option>
                    <option value="knee">Knee</option>
                    <option value="shoulder">Shoulder</option>
                    <option value="elbow">Elbow</option>
                    <option value="wrist">Wrist</option>
                    <option value="hand">Hand</option>
                    <option value="hip">Hip</option>
                    <option value="ankle">Ankle</option>
                    <option value="foot">Foot</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                
                <Divider my={2} />
                
                <Heading as="h3" size="sm" mb={2}>
                  Patient History (Optional)
                </Heading>
                
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} width="100%">
                  <FormControl>
                    <FormLabel>Age</FormLabel>
                    <Input
                      type="number"
                      name="age"
                      value={patientHistory.age}
                      onChange={handleHistoryChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Weight (kg)</FormLabel>
                    <Input
                      type="number"
                      name="weight"
                      value={patientHistory.weight}
                      onChange={handleHistoryChange}
                    />
                  </FormControl>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel>Height (cm)</FormLabel>
                  <Input
                    type="number"
                    name="height"
                    value={patientHistory.height}
                    onChange={handleHistoryChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Symptoms</FormLabel>
                  <Textarea
                    name="symptoms"
                    value={patientHistory.symptoms}
                    onChange={handleHistoryChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Allergies</FormLabel>
                  <Textarea
                    name="allergies"
                    value={patientHistory.allergies}
                    onChange={handleHistoryChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Medications</FormLabel>
                  <Textarea
                    name="medications"
                    value={patientHistory.medications}
                    onChange={handleHistoryChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Family History</FormLabel>
                  <Textarea
                    name="familyHistory"
                    value={patientHistory.familyHistory}
                    onChange={handleHistoryChange}
                  />
                </FormControl>
                
                <Button
                  mt={6}
                  colorScheme="teal"
                  isLoading={isLoading}
                  loadingText="Uploading"
                  type="submit"
                  size="lg"
                  width="full"
                  isDisabled={files.length === 0 || !recordType || !bodyPart}
                >
                  Upload Images
                </Button>
              </VStack>
            </Box>
          </SimpleGrid>
        </form>
      </Box>
    </ProtectedRoute>
  );
};

export default Upload; 