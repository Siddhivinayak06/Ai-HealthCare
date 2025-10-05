import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminRoute from '@/components/auth/AdminRoute';

const EditModel = () => {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    modelType: '',
    architecture: '',
    dependencies: '',
    status: '',
    maxDailyUsage: 1000,
    isPublic: false,
    performance: {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
    },
  });

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
      setFormData(data.data.model);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePerformanceChange = (metric, value) => {
    setFormData((prev) => ({
      ...prev,
      performance: {
        ...prev.performance,
        [metric]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.API_URL}/admin/models/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update model');
      }

      toast({
        title: 'Success',
        description: 'Model updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push(`/admin/models/${id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
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

  return (
    <AdminRoute>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Edit Model</Heading>

          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Basic Information */}
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter model name"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Version</FormLabel>
                    <Input
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                      placeholder="Enter version number"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Model Type</FormLabel>
                    <Select
                      name="modelType"
                      value={formData.modelType}
                      onChange={handleInputChange}
                    >
                      <option value="classification">Classification</option>
                      <option value="detection">Detection</option>
                      <option value="segmentation">Segmentation</option>
                      <option value="prediction">Prediction</option>
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Status</FormLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="testing">Testing</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </FormControl>
                </GridItem>
              </Grid>

              {/* Description */}
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter model description"
                  rows={4}
                />
              </FormControl>

              {/* Architecture and Dependencies */}
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Architecture</FormLabel>
                    <Input
                      name="architecture"
                      value={formData.architecture}
                      onChange={handleInputChange}
                      placeholder="Enter model architecture"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Dependencies</FormLabel>
                    <Input
                      name="dependencies"
                      value={formData.dependencies}
                      onChange={handleInputChange}
                      placeholder="Enter dependencies (comma-separated)"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              {/* Performance Metrics */}
              <Heading size="md">Performance Metrics</Heading>
              <Grid templateColumns="repeat(4, 1fr)" gap={6}>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Accuracy (%)</FormLabel>
                    <NumberInput
                      value={formData.performance.accuracy}
                      onChange={(value) => handlePerformanceChange('accuracy', value)}
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Precision (%)</FormLabel>
                    <NumberInput
                      value={formData.performance.precision}
                      onChange={(value) => handlePerformanceChange('precision', value)}
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Recall (%)</FormLabel>
                    <NumberInput
                      value={formData.performance.recall}
                      onChange={(value) => handlePerformanceChange('recall', value)}
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>F1 Score (%)</FormLabel>
                    <NumberInput
                      value={formData.performance.f1Score}
                      onChange={(value) => handlePerformanceChange('f1Score', value)}
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
              </Grid>

              {/* Additional Settings */}
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Max Daily Usage</FormLabel>
                    <NumberInput
                      value={formData.maxDailyUsage}
                      onChange={(value) => setFormData((prev) => ({ ...prev, maxDailyUsage: value }))}
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Public Model</FormLabel>
                    <Switch
                      isChecked={formData.isPublic}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              {/* Action Buttons */}
              <HStack spacing={4} justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/models/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={saving}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </HStack>
            </VStack>
          </form>
        </VStack>
      </Container>
    </AdminRoute>
  );
};

export default EditModel; 