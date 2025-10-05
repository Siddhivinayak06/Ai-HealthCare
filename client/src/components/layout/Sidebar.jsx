import React from 'react';
import {
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  Badge,
  Spinner,
  Center,
} from '@chakra-ui/react';
import {
  FiHome,
  FiTrendingUp,
  FiCompass,
  FiStar,
  FiSettings,
  FiMenu,
  FiUser,
  FiFileText,
  FiUpload,
  FiDatabase,
  FiUsers,
  FiBarChart2,
} from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import ClientOnly from '../ClientOnly';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isAdmin, loading } = useAuth();
  
  // Debug user data and loading state
  console.log('Sidebar - Loading state:', loading);
  console.log('Sidebar - User data from DB:', user);
  
  // More detailed role debugging
  const userRole = user?.role || 'no role';
  console.log('Sidebar - User role:', userRole);
  console.log('Sidebar - Role type:', typeof userRole);
  console.log('Sidebar - isAdmin result:', isAdmin());
  
  // In-component admin check for comparison
  let localAdminCheck = false;
  if (user && user.role) {
    if (typeof user.role === 'string') {
      localAdminCheck = user.role.toLowerCase() === 'admin';
    } else if (typeof user.role === 'object' && user.role !== null) {
      localAdminCheck = (user.role.name && user.role.name.toLowerCase() === 'admin') || 
                        (user.role.value && user.role.value.toLowerCase() === 'admin');
    }
  }
  console.log('Sidebar - Local admin check:', localAdminCheck);

  return (
    <Box>
      <ClientOnly>
        {loading ? (
          <Center h="100vh">
            <Spinner size="xl" color="teal.500" thickness="4px" speed="0.65s" />
            <Text ml={4} fontWeight="medium">Loading user data from database...</Text>
          </Center>
        ) : (
          <>
            <SidebarContent
              isAdmin={isAdmin()}
              onClose={() => onClose}
              display={{ base: 'none', md: 'block' }}
            />
            <Drawer
              autoFocus={false}
              isOpen={isOpen}
              placement="left"
              onClose={onClose}
              returnFocusOnClose={false}
              onOverlayClick={onClose}
              size="full"
            >
              <DrawerContent>
                <SidebarContent isAdmin={isAdmin()} onClose={onClose} />
              </DrawerContent>
            </Drawer>
            <MobileNav onOpen={onOpen} />
          </>
        )}
      </ClientOnly>
    </Box>
  );
};

const SidebarContent = ({ isAdmin, onClose, ...rest }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Debug admin status
  console.log('SidebarContent - Received isAdmin prop:', isAdmin);
  
  // Double-check the user role directly
  let directRoleCheck = false;
  if (user && user.role) {
    if (typeof user.role === 'string') {
      directRoleCheck = user.role.toLowerCase() === 'admin';
    } else if (typeof user.role === 'object' && user.role !== null) {
      directRoleCheck = 
        (user.role.name && user.role.name.toLowerCase() === 'admin') || 
        (user.role.value && user.role.value.toLowerCase() === 'admin') ||
        (user.role.type && user.role.type.toLowerCase() === 'admin');
    }
  }
  console.log('SidebarContent - Direct role check:', directRoleCheck);

  // Use EITHER the prop OR direct check to show admin items (to ensure we catch the admin role)
  const showAdminItems = isAdmin || directRoleCheck;
  console.log('SidebarContent - Will show admin items:', showAdminItems);

  // Define navigation items based on user role
  let navItems = [
    { name: 'Dashboard', icon: MdDashboard, path: '/dashboard' },
    { name: 'Upload Images', icon: FiUpload, path: '/diagnostics/upload' },
    { name: 'All Records', icon: FiFileText, path: '/diagnostics/records' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  // Add admin-only items - using our combined check
  if (showAdminItems) {
    console.log('Adding admin items to navigation');
    navItems = [
      ...navItems,
      { name: 'Admin Dashboard', icon: FiBarChart2, path: '/admin/dashboard' },
      { name: 'User Management', icon: FiUsers, path: '/admin/users' },
      { name: 'ML Models', icon: FiDatabase, path: '/admin/models' },
    ];
  } else {
    console.log('Not adding admin items, showAdminItems is:', showAdminItems);
  }

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      pt="60px"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {navItems.map((navItem) => (
        <NavItem
          key={navItem.name}
          icon={navItem.icon}
          path={navItem.path}
          isActive={router.pathname === navItem.path}
        >
          {navItem.name}
          {navItem.badge && (
            <Badge ml="1" colorScheme="green">
              {navItem.badge}
            </Badge>
          )}
        </NavItem>
      ))}
    </Box>
  );
};

const NavItem = ({ icon, children, path, isActive, ...rest }) => {
  return (
    <NextLink href={path} passHref legacyBehavior>
      <Link
        as="span"
        style={{ textDecoration: 'none' }}
        _focus={{ boxShadow: 'none' }}
      >
        <Flex
          align="center"
          p="4"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          bg={isActive ? 'teal.400' : 'transparent'}
          color={isActive ? 'white' : 'inherit'}
          _hover={{
            bg: 'teal.400',
            color: 'white',
          }}
          {...rest}
        >
          {icon && (
            <Icon
              mr="4"
              fontSize="16"
              _groupHover={{
                color: 'white',
              }}
              as={icon}
            />
          )}
          {children}
        </Flex>
      </Link>
    </NextLink>
  );
};

const MobileNav = ({ onOpen, ...rest }) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      display={{ base: 'flex', md: 'none' }}
      {...rest}
    >
      <Icon
        as={FiMenu}
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        fontSize="20px"
        m={2}
      />
      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        AI Healthcare
      </Text>
    </Flex>
  );
};

export default Sidebar; 