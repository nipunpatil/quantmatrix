import React, { useContext } from 'react';
import { Box, Flex, Heading, Button, HStack, Avatar, IconButton, Menu, MenuButton, MenuList, MenuItem, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HamburgerIcon, BellIcon  } from '@chakra-ui/icons';

function AppLayout({ children }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* nav bar */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        px={8}
        py={4}
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        position="sticky"
        top={0}
        zIndex={10}
        shadow="sm"
      >
        {/* lgo and menu  */}
        <HStack spacing={6}>
          <IconButton
            icon={<HamburgerIcon />}
            variant="ghost"
            aria-label="Menu"
          />
          <HStack spacing={2}>
            <Box
              bg="black"
              color="white"
              px={2}
              py={1}
              borderRadius="md"
              fontWeight="bold"
              fontSize="sm"
            >
            
            </Box>
            <Box>
              <Text fontWeight="bold" fontSize="md">QUANT</Text>
              <Text fontSize="xs" color="gray.600" mt={-1}>MATRIX AI</Text>
            </Box>
          </HStack>
        </HStack>

        {/* Project Name & Icons */}
        <HStack spacing={6}>
          <HStack spacing={2}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg="blue.500"
            />
            <Text fontSize="sm" fontWeight="medium">Project Name</Text>
          </HStack>
          
          <IconButton
            icon={<BellIcon />}
            variant="ghost"
            aria-label="Notifications"
          />
          
          <Menu>
            <MenuButton>
              <Avatar
                size="sm"
                name="User"
                bg="orange.400"
                cursor="pointer"
              />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/projects')}>My Projects</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      =
      <Box>
        {children}
      </Box>
    </Box>
  );
}

export default AppLayout;
