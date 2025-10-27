import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import theme from './theme';
import {ChakraProvider} from '@chakra-ui/react';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ChakraProvider theme={theme}>
    <App />
  </ChakraProvider>
);
