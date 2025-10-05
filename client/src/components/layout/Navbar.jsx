import { Button, Menu, MenuButton, MenuList, MenuItem, MenuDivider, HStack, Text, Icon } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/router';

const Navbar = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Implement logout functionality
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="ghost"
      >
        {user?.name || 'Account'}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => router.push('/profile')}>
          <HStack>
            <Icon as={FiUser} />
            <Text>Profile</Text>
          </HStack>
        </MenuItem>
        {user?.role === 'admin' && (
          <MenuItem onClick={() => router.push('/admin')}>
            <HStack>
              <Icon as={FiSettings} />
              <Text>Admin Dashboard</Text>
            </HStack>
          </MenuItem>
        )}
        <MenuDivider />
        <MenuItem onClick={handleLogout}>
          <HStack>
            <Icon as={FiLogOut} />
            <Text>Logout</Text>
          </HStack>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default Navbar; 