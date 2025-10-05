import React, { useEffect } from 'react';
import { Box, Container, Flex, useColorModeValue, useColorMode } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ClientOnly from '../ClientOnly';

const MainLayout = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { colorMode } = useColorMode();
  
  // Check if the current route is a public route (login/register/admin-register)
  const isPublicRoute = router.pathname === '/login' || 
                       router.pathname === '/register' || 
                       router.pathname === '/admin-register';
  
  useEffect(() => {
    // Only redirect to login if not authenticated AND not on a public route
    if (!isPublicRoute && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isPublicRoute, router, isAuthenticated]);
  
  if (isPublicRoute) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} transition="background-color 0.3s ease" className={`app-container ${colorMode}-mode`}>
        <Container maxW="container.xl" py={10}>
          {children}
        </Container>
      </Box>
    );
  }

  return (
    <Box 
      minHeight="100vh"
      bg={useColorModeValue('gray.50', 'gray.900')}
      transition="background-color 0.3s ease"
      className={`app-container ${colorMode}-mode`}
    >
      <Header />
      <ClientOnly>
        <Flex>
          <Sidebar />
          <Box 
            as="main" 
            pt="60px" 
            ml={{ base: 0, md: '240px' }} 
            p={10}
            transition="all 0.3s ease"
          >
            {children}
          </Box>
        </Flex>
      </ClientOnly>
    </Box>
  );
};

export default MainLayout; 