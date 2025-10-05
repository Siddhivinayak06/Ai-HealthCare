import { extendTheme } from '@chakra-ui/react';

// This theme override ensures Links don't render as <a> tags by default,
// which helps prevent hydration errors when using with Next.js
const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
        transition: 'background-color 0.3s, color 0.3s',
      },
    }),
  },
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#B3E0FF',
      200: '#80CBFF',
      300: '#4DB5FF',
      400: '#1A9FFF',
      500: '#0080E6',
      600: '#0066B3',
      700: '#004D80',
      800: '#00334D',
      900: '#001A26',
    },
    darkMode: {
      card: 'gray.800',
      hover: 'gray.700',
      border: 'gray.600',
      highlight: 'teal.300',
    },
    lightMode: {
      card: 'white',
      hover: 'gray.50',
      border: 'gray.200',
      highlight: 'teal.500',
    },
  },
  components: {
    Link: {
      baseStyle: {
        // Override to make all Chakra Links render as spans by default
        // This prevents nested <a> tags when used with Next.js's Link
      },
      defaultProps: {
        as: 'span', // Default all Links to render as spans
      },
    },
    MenuItem: {
      defaultProps: {
        as: 'span', // Default all MenuItems to render as spans when used with Next.js
      },
    },
    Button: {
      variants: {
        solid: (props) => ({
          bg: props.colorMode === 'dark' ? 'teal.500' : 'teal.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'teal.400' : 'teal.600',
          },
        }),
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          transition: 'background-color 0.3s, border-color 0.3s',
        },
      }),
    },
    Heading: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      }),
    },
  },
});

export default theme; 