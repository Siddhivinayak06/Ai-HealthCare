import React, { useState } from 'react';
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
  Grid,
  GridItem,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminRoute from '@/components/auth/AdminRoute';

const NewModel = () => {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0.0',
    description: '',
    modelType: '',
    architecture: '',
    dependencies: '',
    status: 'testing',
    maxDailyUsage: 1000,
    isPublic: false,
    performance: {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
    },
  });

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
      const response = await fetch(`${process.env.API_URL}/admin/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create model');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'Model created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push(`/admin/models/${data.data.model._id}`);
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

  return (
    <AdminRoute>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Create New Model</Heading>

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
                      <option value="">Select model type</option>
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
                      <option value="testing">Testing</option>
                      <option value="inactive">Inactive</option>
                      <option value="active">Active</option>
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
                  onClick={() => router.push('/admin/models')}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={saving}
                  loadingText="Creating..."
                >
                  Create Model
                </Button>
              </HStack>
            </VStack>
          </form>
        </VStack>
      </Container>
    </AdminRoute>
  );
};

export default NewModel; 