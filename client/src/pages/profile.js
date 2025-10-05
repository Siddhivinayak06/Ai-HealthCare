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
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Divider,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    medicalLicenseNumber: '',
    contactNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    dateOfBirth: '',
    gender: '',
  });

  useEffect(() => {
    if (user) {
      console.log('Initializing form with user data:', user);
      
      // Create a properly structured form data object
      const initialFormData = {
        name: user.name || '',
        email: user.email || '',
        // Only include professional fields for admin users
        ...(user.role === 'admin' && {
          specialization: user.specialization || '',
          medicalLicenseNumber: user.medicalLicenseNumber || '',
        }),
        contactNumber: user.contactNumber || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || '',
        },
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
      };
      
      console.log('Setting initial form data:', initialFormData);
      setFormData(initialFormData);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value });
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => {
        const updatedForm = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
        console.log('Updated form data (nested):', updatedForm);
        return updatedForm;
      });
    } else {
      setFormData((prev) => {
        const updatedForm = {
          ...prev,
          [name]: value,
        };
        console.log('Updated form data:', updatedForm);
        return updatedForm;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create a copy of the form data
      const dataToSubmit = { ...formData };
      
      // If user is not an admin, remove professional fields
      if (user.role !== 'admin') {
        delete dataToSubmit.specialization;
        delete dataToSubmit.medicalLicenseNumber;
      }
      
      console.log('Submitting profile update with data:', dataToSubmit);
      
      // Use the AuthContext's updateProfile function directly 
      // This avoids making duplicate API calls
      const result = await updateProfile(dataToSubmit);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
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

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center h="100vh">
          <Spinner size="xl" color="teal.500" thickness="4px" />
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Profile</Heading>
          <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
            {user.role}
          </Badge>
        </HStack>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Basic Information */}
              <Box>
                <Heading size="md" mb={4}>Basic Information</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email"
                        isReadOnly
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Professional Information - Only visible to admins */}
              {user.role === 'admin' && (
                <>
                  <Box>
                    <Heading size="md" mb={4}>Professional Information</Heading>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Specialization</FormLabel>
                          <Input
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleInputChange}
                            placeholder="Your specialization"
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Medical License Number</FormLabel>
                          <Input
                            name="medicalLicenseNumber"
                            value={formData.medicalLicenseNumber}
                            onChange={handleInputChange}
                            placeholder="Your license number"
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Contact Information */}
              <Box>
                <Heading size="md" mb={4}>Contact Information</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Phone Number</FormLabel>
                      <Input
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Date of Birth</FormLabel>
                      <Input
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        placeholder="Select gender"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                </Grid>

                <Box mt={4}>
                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <VStack spacing={4}>
                      <Input
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder="Street address"
                      />
                      <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                        <Input
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                        <Input
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          placeholder="State"
                        />
                        <Input
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          placeholder="ZIP code"
                        />
                        <Input
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          placeholder="Country"
                        />
                      </Grid>
                    </VStack>
                  </FormControl>
                </Box>
              </Box>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={loading}
              >
                Save Changes
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default Profile; 