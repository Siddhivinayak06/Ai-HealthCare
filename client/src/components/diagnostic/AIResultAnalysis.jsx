import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Divider,
  Button,
  useColorModeValue,
  VStack,
  HStack,
  Grid,
  GridItem,
  Flex,
  Tooltip,
  Icon,
  Progress,
} from '@chakra-ui/react';
import { FiInfo, FiAlertCircle, FiCheckCircle, FiHelpCircle, FiBarChart2 } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend);

/**
 * Component to display detailed AI result analysis
 * @param {Object} props - Component props
 * @param {Object} props.aiDiagnosis - AI diagnosis results
 * @param {Function} props.onRequestSecondOpinion - Optional callback for requesting second opinion
 */
const AIResultAnalysis = ({ aiDiagnosis, onRequestSecondOpinion }) => {
  const [showAllDetails, setShowAllDetails] = useState(false);
  
  // Return placeholder if no diagnosis data
  if (!aiDiagnosis || !aiDiagnosis.condition) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">AI Analysis Results</Heading>
        </CardHeader>
        <CardBody>
          <Text>No AI analysis has been performed yet.</Text>
        </CardBody>
      </Card>
    );
  }
  
  // Destructure the AI diagnosis data
  const { 
    condition, 
    confidence, 
    explanation = {}, 
    perImageResults = [], 
    timestamp 
  } = aiDiagnosis;
  
  // Extract explanation details or use defaults
  const {
    summary = `AI detected ${condition} with ${confidence.toFixed(1)}% confidence.`,
    confidenceLevel = getConfidenceLevelFromValue(confidence),
    details = [],
    recommendations = []
  } = explanation;
  
  // Colors based on confidence level
  const confidenceColors = {
    'very high': 'green.500',
    'high': 'green.400',
    'moderate': 'yellow.400',
    'low': 'red.400'
  };
  
  // Generate confidence badge color
  const confidenceBadgeColor = confidenceColors[confidenceLevel] || 'gray.400';
  
  // Generate chart data
  const chartData = {
    labels: ['Confidence', 'Uncertainty'],
    datasets: [
      {
        data: [confidence, 100 - confidence],
        backgroundColor: [
          useColorModeValue('teal.500', 'teal.300'),
          useColorModeValue('gray.200', 'gray.600')
        ],
        borderColor: ['transparent', 'transparent'],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true
      }
    }
  };
  
  // Format timestamp
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
  
  return (
    <Card shadow="md" borderRadius="lg">
      <CardHeader bg={useColorModeValue('gray.50', 'gray.700')} borderTopRadius="lg">
        <Flex justify="space-between" align="center">
          <Heading size="md">AI Analysis Results</Heading>
          <Badge 
            colorScheme={getConfidenceColorScheme(confidenceLevel)}
            fontSize="sm" 
            py={1} 
            px={2} 
            borderRadius="full"
          >
            {confidenceLevel.toUpperCase()} CONFIDENCE
          </Badge>
        </Flex>
      </CardHeader>
      
      <CardBody>
        <Grid templateColumns="repeat(12, 1fr)" gap={4}>
          {/* Top summary section */}
          <GridItem colSpan={{ base: 12, md: 8 }}>
            <VStack align="start" spacing={4}>
              <Heading size="lg" color={useColorModeValue('gray.700', 'white')}>
                {condition}
              </Heading>
              
              <Text fontSize="lg" fontWeight="medium">
                {summary}
              </Text>
              
              <HStack>
                <Icon as={FiBarChart2} color="gray.500" />
                <Text fontSize="sm" color="gray.500">
                  Analyzed on {formattedDate}
                </Text>
              </HStack>
            </VStack>
          </GridItem>
          
          {/* Confidence chart */}
          <GridItem colSpan={{ base: 12, md: 4 }}>
            <Box position="relative" h="150px" w="150px" mx="auto">
              <Doughnut data={chartData} options={chartOptions} />
              <Text
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                fontSize="xl"
                fontWeight="bold"
              >
                {confidence.toFixed(1)}%
              </Text>
            </Box>
          </GridItem>
          
          <GridItem colSpan={12}>
            <Divider my={4} />
          </GridItem>
          
          {/* Detailed analysis section */}
          <GridItem colSpan={12}>
            <Accordion allowToggle defaultIndex={[0]}>
              <AccordionItem border="none">
                <AccordionButton px={0}>
                  <Box flex="1" textAlign="left">
                    <Heading size="sm">Detailed Analysis</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack align="start" spacing={3}>
                    {details.length > 0 ? (
                      details.slice(0, showAllDetails ? details.length : 3).map((detail, index) => (
                        <HStack key={index} align="flex-start" spacing={3}>
                          <Icon as={FiInfo} mt={1} color="blue.500" />
                          <Text>{detail}</Text>
                        </HStack>
                      ))
                    ) : (
                      <Text>No detailed analysis available.</Text>
                    )}
                    
                    {details.length > 3 && (
                      <Button 
                        variant="link" 
                        colorScheme="blue" 
                        onClick={() => setShowAllDetails(!showAllDetails)}
                        size="sm"
                      >
                        {showAllDetails ? 'Show Less' : `Show All (${details.length})`}
                      </Button>
                    )}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem border="none">
                <AccordionButton px={0}>
                  <Box flex="1" textAlign="left">
                    <Heading size="sm">Recommendations</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  {recommendations.length > 0 ? (
                    <List spacing={2}>
                      {recommendations.map((recommendation, index) => (
                        <ListItem key={index}>
                          <HStack align="flex-start" spacing={3}>
                            <ListIcon as={FiCheckCircle} color="green.500" mt={1} />
                            <Text>{recommendation}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text>No recommendations available.</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>
              
              {perImageResults.length > 0 && (
                <AccordionItem border="none">
                  <AccordionButton px={0}>
                    <Box flex="1" textAlign="left">
                      <Heading size="sm">Individual Image Results</Heading>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={4} align="stretch">
                      {perImageResults.map((result, index) => (
                        <Card key={index} variant="outline" size="sm">
                          <CardBody>
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="bold">Image {index + 1}: {result.imagePath}</Text>
                              <Badge colorScheme={getConfidenceColorScheme(result.explanation?.confidenceLevel || 'moderate')}>
                                {result.confidence.toFixed(1)}%
                              </Badge>
                            </HStack>
                            <Text>{result.condition}</Text>
                            <Progress 
                              value={result.confidence} 
                              mt={2} 
                              colorScheme={getConfidenceColorScheme(result.explanation?.confidenceLevel || 'moderate')}
                              size="sm"
                              borderRadius="full"
                            />
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          </GridItem>
          
          {/* Second opinion button */}
          {onRequestSecondOpinion && (
            <GridItem colSpan={12} mt={4}>
              <Button
                leftIcon={<FiHelpCircle />}
                colorScheme="blue"
                variant="outline"
                onClick={onRequestSecondOpinion}
                size="md"
                width="full"
              >
                Request Second Opinion
              </Button>
            </GridItem>
          )}
        </Grid>
      </CardBody>
    </Card>
  );
};

/**
 * Helper function to determine confidence level from percentage value
 * @param {number} confidence - Confidence percentage
 * @returns {string} - Confidence level
 */
function getConfidenceLevelFromValue(confidence) {
  if (confidence > 90) return 'very high';
  if (confidence > 75) return 'high';
  if (confidence > 50) return 'moderate';
  return 'low';
}

/**
 * Get Chakra UI color scheme based on confidence level
 * @param {string} level - Confidence level
 * @returns {string} - Chakra UI color scheme
 */
function getConfidenceColorScheme(level) {
  switch (level) {
    case 'very high': return 'green';
    case 'high': return 'teal';
    case 'moderate': return 'yellow';
    case 'low': return 'red';
    default: return 'gray';
  }
}

export default AIResultAnalysis; 