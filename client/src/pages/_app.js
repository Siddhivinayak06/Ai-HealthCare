import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import MainLayout from '../components/layout/MainLayout';
import theme from '../utils/theme';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <SettingsProvider>
          <MainLayout>
            <Component {...pageProps} />
          </MainLayout>
        </SettingsProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default MyApp; 