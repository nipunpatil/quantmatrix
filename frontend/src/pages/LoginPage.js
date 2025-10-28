import React, { useState, useContext } from 'react';
import { Box, Button, Input, VStack, Heading, useToast } from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/apiClient';
import { AuthContext } from '../context/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async () => {
    try {
      const response = await loginUser(username, password);
      // save username in auth context as well
      login(response.data.access, username);
      toast({ title: 'Login successful!', status: 'success', duration: 3000 });
      navigate('/projects');
    } catch (error) {
      toast({ title: 'Login failed', description: error.response?.data?.detail, status: 'error', duration: 3000 });
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.100">
      <Box bg="white" p={8} rounded="md" shadow="md" w="400px">
        <VStack spacing={4}>
          <Heading>Login</Heading>
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button colorScheme="blue" w="full" onClick={handleLogin}>Login</Button>
          <Link to="/signup">Don't have an account? Sign up</Link>
        </VStack>
      </Box>
    </Box>
  );
}

export default LoginPage;
