import React, { useContext, useEffect, useState } from 'react';
import { Box, Flex, HStack, Avatar, IconButton, Menu, MenuButton, MenuList, MenuItem, Text, Image, Icon } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HamburgerIcon } from '@chakra-ui/icons';
import Logo from '../assests/logo.svg';
import { getDatasetDetails } from '../api/apiClient';

function AppLayout({ children }) {
  const { logout, username } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [projectName, setProjectName] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // when on a dashboard route like /dashboard/:datasetId fetch dataset to derive project name
    const match = location.pathname.match(/^\/dashboard\/([^\/]+)/);
    if (match) {
      const datasetId = match[1];
      getDatasetDetails(datasetId)
        .then(res => {
          const data = res.data || {};
          const pName = data.project?.name || data.project_name || data.name || '';
          setProjectName(pName);
        })
        .catch(() => setProjectName(''));
    } else {
      setProjectName('');
    }
  }, [location.pathname]);

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
          <HStack spacing={2} align="center">
            <Box as="button" onClick={() => navigate('/projects')} aria-label="Go to my projects" cursor="pointer">
              <Image src={Logo} alt="QuantMatrix logo" height="32px" width="auto" maxH="32px" objectFit="contain" />
            </Box>
          </HStack>
        </HStack>

        {/* Project Name & Icons */}
        <HStack spacing={6}>
          {projectName && (
            <HStack spacing={3} align="center">
              <Box w={3} h={3} borderRadius="full" bg="blue.500" />
              <Text fontSize="sm" fontWeight="medium">{projectName}</Text>
            </HStack>
          )}

          {/* modern bell icon */}
          <IconButton
            aria-label="Notifications"
            variant="ghost"
            size="md"
            ml={2}
            icon={
              <Icon viewBox="0 0 24 24" boxSize={6}>
                <path fill="currentColor" d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" />
              </Icon>
            }
          />

          {/* cleaner envelope (mail) icon */}
          <IconButton
            aria-label="Messages"
            variant="ghost"
            size="md"
            ml={1}
            icon={
              <Icon viewBox="0 0 24 24" boxSize={6}>
                <path fill="currentColor" d="M2.25 6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75zm3.03-.53L12 11.25l6.72-4.03a.75.75 0 10-.78-1.26L12 9.75 4.56 4.96a.75.75 0 10-.78 1.26z" />
              </Icon>
            }
          />
          
          <Menu>
            <MenuButton>
              <Avatar
                size="sm"
                name={username || 'User'}
                bg="orange.400"
                cursor="pointer"
                boxSize={9}
                fontSize="md"
              />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/projects')}>My Projects</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      
      <Box>
        {children}
      </Box>
    </Box>
  );
}

export default AppLayout;
