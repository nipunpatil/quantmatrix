import React, { useState } from 'react';
import { Box, Button, Input, VStack, Heading, useToast } from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/apiClient';

function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignup = async () => {
    try {
      await registerUser(username, password);
      toast({ title: 'Registration successful!', status: 'success', duration: 3000 });
      navigate('/login');
    } catch (error) {
      toast({ title: 'Registration failed', description: error.response?.data?.username?.[0], status: 'error', duration: 3000 });
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.100">
      <Box bg="white" p={8} rounded="md" shadow="md" w="400px">
        <VStack spacing={4}>
          <Heading>Sign Up</Heading>
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button colorScheme="blue" w="full" onClick={handleSignup}>Sign Up</Button>
          <Link to="/login">Already have an account? Login</Link>
        </VStack>
      </Box>
    </Box>
  );
}

export default SignUp;
