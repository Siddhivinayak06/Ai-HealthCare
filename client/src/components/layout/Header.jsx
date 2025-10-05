import React from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorMode,
  Tooltip,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
} from '@chakra-ui/icons';
import { FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ClientOnly from '../ClientOnly';

const Header = () => {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  // User data from context (fallback to default values if not available)
  const userData = user || {
    name: 'Guest',
    role: 'user',
    profilePicture: '',
  };

  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      color={useColorModeValue('gray.600', 'white')}
      borderBottom={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.900')}
      position="fixed"
      width="100%"
      zIndex={10}
    >
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        align={'center'}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>

        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Text
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            color={useColorModeValue('teal.600', 'white')}
            fontWeight="bold"
            fontSize="xl"
          >
            AI Healthcare Diagnostics
          </Text>

          
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
        >
          <ClientOnly>
            <Flex >
            <Tooltip label={colorMode === 'light' ? 'Dark mode' : 'Light mode'}>
              <IconButton
                aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                colorScheme="teal"
                onClick={toggleColorMode}
                size="md"
                mr={2}
              />
            </Tooltip>
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <Flex align="center">
                  <Avatar
                    size={'sm'}
                    src={userData.profilePicture || 'https://bit.ly/broken-link'}
                    name={userData.name}
                    mr={2}
                  />
                  <Text display={{ base: 'none', md: 'block' }}>{userData.name}</Text>
                </Flex>
              </MenuButton>
              <MenuList>
                <NextLink href="/profile" passHref legacyBehavior>
                  <MenuItem as="span" icon={<FiUser />}>Profile</MenuItem>
                </NextLink>
                <NextLink href="/settings" passHref legacyBehavior>
                  <MenuItem as="span" icon={<FiSettings />}>Settings</MenuItem>
                </NextLink>
                <MenuDivider />
                <MenuItem icon={<FiLogOut />} onClick={logout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
            </Flex>
          </ClientOnly>
        </Stack>
      </Flex>

      <ClientOnly>
        <Collapse in={isOpen} animateOpacity>
          <MobileNav />
        </Collapse>
      </ClientOnly>
    </Box>
  );
};

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('teal.600', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <NextLink href={navItem.href ?? '#'} passHref legacyBehavior>
                <Link
                  p={2}
                  fontSize={'sm'}
                  fontWeight={500}
                  color={linkColor}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}
                >
                  {navItem.label}
                </Link>
              </NextLink>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }) => {
  return (
    <NextLink href={href} passHref legacyBehavior>
      <Link
        role={'group'}
        display={'block'}
        p={2}
        rounded={'md'}
        _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}
      >
        <Stack direction={'row'} align={'center'}>
          <Box>
            <Text
              transition={'all .3s ease'}
              _groupHover={{ color: 'blue.400' }}
              fontWeight={500}
            >
              {label}
            </Text>
            <Text fontSize={'sm'}>{subLabel}</Text>
          </Box>
          <Flex
            transition={'all .3s ease'}
            transform={'translateX(-10px)'}
            opacity={0}
            _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
            justify={'flex-end'}
            align={'center'}
            flex={1}
          >
            <Icon color={'blue.400'} w={5} h={5} as={ChevronRightIcon} />
          </Flex>
        </Stack>
      </Link>
    </NextLink>
  );
};

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <NextLink href={href ?? '#'} passHref legacyBehavior>
        <Link
          py={2}
          justify={'space-between'}
          align={'center'}
          _hover={{
            textDecoration: 'none',
          }}
          onClick={children && onToggle}
        >
          <Text
            fontWeight={600}
            color={useColorModeValue('gray.600', 'gray.200')}
          >
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          )}
        </Link>
      </NextLink>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}
        >
          {children &&
            children.map((child) => (
              <NextLink key={child.label} href={child.href} passHref legacyBehavior>
                <Link
                  py={2}
                  pl={4}
                  display="block"
                  color={useColorModeValue('gray.600', 'gray.200')}
                >
                  {child.label}
                </Link>
              </NextLink>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Diagnostics',
    href: '#',
    children: [
      {
        label: 'Upload New',
        subLabel: 'Upload medical images for analysis',
        href: '/diagnostics/upload',
      },
      {
        label: 'My Records',
        subLabel: 'View your medical records',
        href: '/diagnostics/records',
      },
    ],
  },
];

export default Header; 