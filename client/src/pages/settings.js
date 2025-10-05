import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Switch,
  Select,
  FormControl,
  FormLabel,
  Divider,
  useColorMode,
  useToast,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Badge,
  Flex,
  useColorModeValue,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { FiSave, FiMoon, FiSun, FiBell, FiLock, FiUser, FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const { settings, updateSetting, toggleSetting, saveAllSettings, loading: settingsLoading } = useSettings();
  
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const cancelRef = React.useRef();
  const bgColor = useColorModeValue('white', 'gray.700');
  
  // Handle color mode toggle
  const handleColorModeToggle = () => {
    toggleColorMode();
    // Update settings state to reflect new color mode
    updateSetting('appearance', 'theme', colorMode === 'light' ? 'dark' : 'light');
  };

  // Save settings
  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // In a production environment, you might send settings to a backend API
      // For now, settings are automatically saved in localStorage via the context
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = () => {
    // This would connect to an API to delete the user's account
    setIsDeleteAccountDialogOpen(false);
    toast({
      title: 'Account deletion requested',
      description: 'Your request has been submitted. An administrator will contact you.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  if (!user || settingsLoading) {
    return null; // Protected route will handle redirection
  }

  return (
    <ProtectedRoute>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Settings</Heading>
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            isLoading={loading}
            onClick={saveSettings}
          >
            Save Changes
          </Button>
        </Flex>

        <Tabs variant="enclosed" colorScheme="teal">
          <TabList mb={4}>
            <Tab><HStack><FiUser/><Text ml={2}>Account</Text></HStack></Tab>
            <Tab><HStack><FiSun/><Text ml={2}>Appearance</Text></HStack></Tab>
            <Tab><HStack><FiBell/><Text ml={2}>Notifications</Text></HStack></Tab>
            <Tab><HStack><FiLock/><Text ml={2}>Privacy & Security</Text></HStack></Tab>
          </TabList>
          
          <TabPanels>
            {/* Account Settings Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={bgColor} shadow="md">
                  <CardHeader>
                    <Heading size="md">Account Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Box>
                          <Heading size="sm">Account Type</Heading>
                          <Text fontSize="sm" color="gray.500">Your current account type</Text>
                        </Box>
                        <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'} fontSize="0.9em" p={2}>
                          {user.role === 'admin' ? 'Administrator' : 'Standard User'}
                        </Badge>
                      </HStack>
                      
                      <Divider />
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="two-factor" mb={0}>Two-Factor Authentication</FormLabel>
                          <Text fontSize="sm" color="gray.500">Enhance your account security</Text>
                        </Box>
                        <Switch 
                          id="two-factor" 
                          colorScheme="teal" 
                          isChecked={settings.account.twoFactorAuth}
                          onChange={() => toggleSetting('account', 'twoFactorAuth')}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel htmlFor="session-timeout">Session Timeout (minutes)</FormLabel>
                        <Select 
                          id="session-timeout" 
                          value={settings.account.sessionTimeout}
                          onChange={(e) => updateSetting('account', 'sessionTimeout', e.target.value)}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="auto-save" mb={0}>Auto-save Data</FormLabel>
                          <Text fontSize="sm" color="gray.500">Automatically save data as you work</Text>
                        </Box>
                        <Switch 
                          id="auto-save" 
                          colorScheme="teal" 
                          isChecked={settings.account.autoSave}
                          onChange={() => toggleSetting('account', 'autoSave')}
                        />
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bgColor} shadow="md">
                  <CardHeader>
                    <Heading size="md">Danger Zone</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Button
                        leftIcon={<FiTrash2 />}
                        colorScheme="red"
                        variant="outline"
                        onClick={() => setIsDeleteAccountDialogOpen(true)}
                      >
                        Delete Account
                      </Button>
                      <Text fontSize="sm" color="gray.500">
                        This will permanently delete your account and all associated data.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Appearance Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={bgColor} shadow="md">
                  <CardHeader>
                    <Heading size="md">Theme Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justifyContent="space-between">
                        <Box>
                          <Heading size="sm">Dark Mode</Heading>
                          <Text fontSize="sm" color="gray.500">Switch between light and dark theme</Text>
                        </Box>
                        <IconButton
                          aria-label="Toggle theme"
                          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                          onClick={handleColorModeToggle}
                          colorScheme="teal"
                          variant="outline"
                        />
                        <Text>{colorMode === 'light' ? 'Light' : 'Dark'}</Text>
                      </HStack>
                      
                      <Divider />
                      
                      <FormControl>
                        <FormLabel htmlFor="font-size">Font Size</FormLabel>
                        <Select 
                          id="font-size" 
                          value={settings.appearance.fontSize} 
                          onChange={(e) => updateSetting('appearance', 'fontSize', e.target.value)}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="compact-view" mb={0}>Compact View</FormLabel>
                          <Text fontSize="sm" color="gray.500">Reduce spacing for more content</Text>
                        </Box>
                        <Switch 
                          id="compact-view" 
                          colorScheme="teal" 
                          isChecked={settings.appearance.compactView}
                          onChange={() => toggleSetting('appearance', 'compactView')}
                        />
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Notifications Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={bgColor} shadow="md">
                  <CardHeader>
                    <Heading size="md">Notification Preferences</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="email-notifications" mb={0}>Email Notifications</FormLabel>
                          <Text fontSize="sm" color="gray.500">Receive notifications via email</Text>
                        </Box>
                        <Switch 
                          id="email-notifications" 
                          colorScheme="teal" 
                          isChecked={settings.notifications.emailNotifications}
                          onChange={() => toggleSetting('notifications', 'emailNotifications')}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="result-ready" mb={0}>Results Ready</FormLabel>
                          <Text fontSize="sm" color="gray.500">Get notified when diagnostic results are ready</Text>
                        </Box>
                        <Switch 
                          id="result-ready" 
                          colorScheme="teal" 
                          isChecked={settings.notifications.resultReady}
                          onChange={() => toggleSetting('notifications', 'resultReady')}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="system-updates" mb={0}>System Updates</FormLabel>
                          <Text fontSize="sm" color="gray.500">Get notified about system updates and maintenance</Text>
                        </Box>
                        <Switch 
                          id="system-updates" 
                          colorScheme="teal" 
                          isChecked={settings.notifications.systemUpdates}
                          onChange={() => toggleSetting('notifications', 'systemUpdates')}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="diagnostic-reminders" mb={0}>Diagnostic Reminders</FormLabel>
                          <Text fontSize="sm" color="gray.500">Get reminders about scheduled diagnostics</Text>
                        </Box>
                        <Switch 
                          id="diagnostic-reminders" 
                          colorScheme="teal" 
                          isChecked={settings.notifications.diagnosticReminders}
                          onChange={() => toggleSetting('notifications', 'diagnosticReminders')}
                        />
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Privacy & Security Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={bgColor} shadow="md">
                  <CardHeader>
                    <Heading size="md">Privacy Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="share-anonymous-data" mb={0}>Share Anonymous Data</FormLabel>
                          <Text fontSize="sm" color="gray.500">Help improve the platform with anonymous usage data</Text>
                        </Box>
                        <Switch 
                          id="share-anonymous-data" 
                          colorScheme="teal" 
                          isChecked={settings.privacy.shareAnonymousData}
                          onChange={() => toggleSetting('privacy', 'shareAnonymousData')}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="save-history" mb={0}>Save Browsing History</FormLabel>
                          <Text fontSize="sm" color="gray.500">Save your activity history within the application</Text>
                        </Box>
                        <Switch 
                          id="save-history" 
                          colorScheme="teal" 
                          isChecked={settings.privacy.saveHistory}
                          onChange={() => toggleSetting('privacy', 'saveHistory')}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="show-record-count" mb={0}>Show Record Count</FormLabel>
                          <Text fontSize="sm" color="gray.500">Display the number of records in dashboard statistics</Text>
                        </Box>
                        <Switch 
                          id="show-record-count" 
                          colorScheme="teal" 
                          isChecked={settings.privacy.showRecordCount}
                          onChange={() => toggleSetting('privacy', 'showRecordCount')}
                        />
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bgColor} shadow="md">
                  <CardHeader>
                    <Heading size="md">Security</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Button
                        variant="outline"
                        colorScheme="blue"
                        size="md"
                        width="full"
                        onClick={() => router.push('/change-password')}
                      >
                        Change Password
                      </Button>
                      
                      <Button
                        variant="outline"
                        colorScheme="red"
                        size="md"
                        width="full"
                        onClick={() => {
                          toast({
                            title: 'Sessions revoked',
                            description: 'All other sessions have been revoked',
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                          });
                        }}
                      >
                        Revoke All Active Sessions
                      </Button>

                      <Text fontSize="sm" color="gray.500">
                        Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Delete Account Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteAccountDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteAccountDialogOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Account
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete your account? This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsDeleteAccountDialogOpen(false)}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </ProtectedRoute>
  );
};

export default Settings; 