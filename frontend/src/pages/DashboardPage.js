import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Container, Heading, Spinner, Alert, AlertIcon, SimpleGrid,
  Select, HStack, VStack, Text, Button, Tabs, TabList, Tab, Flex
} from '@chakra-ui/react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import AppLayout from '../components/AppLayout';
import { getDatasetDetails, getFilters, getAnalytics } from '../api/apiClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function DashboardPage() {
  const { datasetId } = useParams();
  
  const [dataset, setDataset] = useState(null);
  const [filters, setFilters] = useState({
    brand: [],
    channel: [],
    packtype: [],
    ppg: [],
    year: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    channel: '',
    brand: '',
    packtype: '',
    ppg: '',
    year: ''
  });
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInitialData = useCallback(async () => {
    try {
      const datasetRes = await getDatasetDetails(datasetId);
      setDataset(datasetRes.data);

      if (datasetRes.data.status === 'completed') {
        const filtersRes = await getFilters(datasetId);
        setFilters(filtersRes.data);
      } else if (datasetRes.data.status === 'processing') {
        setTimeout(() => fetchInitialData(), 3000);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load data');
      setIsLoading(false);
    }
  }, [datasetId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const analyticsRes = await getAnalytics(datasetId, selectedFilters);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Analytics error:', err);
    }
  }, [datasetId, selectedFilters]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (dataset?.status === 'completed') {
      fetchAnalytics();
    }
  }, [fetchAnalytics, dataset]);

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleReset = () => {
    setSelectedFilters({
      channel: '',
      brand: '',
      packtype: '',
      ppg: '',
      year: ''
    });
  };

  // ✅ HORIZONTAL STACKED BAR CHART - Sales Value
  const getHorizontalSalesData = () => {
    if (!analytics?.sales_by_brand_year) return null;

    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];

    const colors = ['#FFA500', '#4299E1', '#48BB78', '#9F7AEA'];

    const datasets = brands.map((brand, idx) => ({
      label: `Brand ${idx + 1}`,
      data: years.map(year => {
        const item = analytics.sales_by_brand_year.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0; // Convert to millions
      }),
      backgroundColor: colors[idx % colors.length],
      borderRadius: 4,
    }));

    return {
      labels: years.map(y => y.toString()),
      datasets
    };
  };

  // ✅ HORIZONTAL STACKED BAR CHART - Volume
  const getHorizontalVolumeData = () => {
    if (!analytics?.volume_by_brand_year) return null;

    const years = [...new Set(analytics.volume_by_brand_year.map(d => d.year))].sort();
    const brands = [...new Set(analytics.volume_by_brand_year.map(d => d.brand))];

    const colors = ['#FFA500', '#4299E1', '#48BB78', '#9F7AEA'];

    const datasets = brands.map((brand, idx) => ({
      label: `Brand ${idx + 1}`,
      data: years.map(year => {
        const item = analytics.volume_by_brand_year.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_volume) / 1000000 : 0; // Convert to millions
      }),
      backgroundColor: colors[idx % colors.length],
      borderRadius: 4,
    }));

    return {
      labels: years.map(y => y.toString()),
      datasets
    };
  };

  const horizontalBarOptions = {
    indexAxis: 'y', // ✅ This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.x.toFixed(1)}M`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          callback: function(value) {
            return value + 'M';
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        stacked: true,
        grid: {
          display: false
        }
      }
    }
  };

  // Grouped bar chart data
  const getBrandComparisonData = () => {
    if (!analytics?.yearly_comparison) return null;

    const years = [...new Set(analytics.yearly_comparison.map(d => d.year))].sort();
    const brands = [...new Set(analytics.yearly_comparison.map(d => d.brand))];

    const colors = ['#4299E1', '#48BB78', '#FFA500'];

    const datasets = years.map((year, idx) => ({
      label: year.toString(),
      data: brands.map(brand => {
        const item = analytics.yearly_comparison.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0;
      }),
      backgroundColor: colors[idx % colors.length],
      borderRadius: 4,
    }));

    return {
      labels: brands.map((b, i) => `Brand ${i + 1}`),
      datasets
    };
  };

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return value + 'M';
          }
        }
      }
    }
  };

  // Line chart for trends
  const getMonthlyTrendData = () => {
    if (!analytics?.monthly_trend || analytics.monthly_trend.length === 0) return null;

    return {
      labels: analytics.monthly_trend.map(d => d.date),
      datasets: [{
        label: 'Sales Value',
        data: analytics.monthly_trend.map(d => parseFloat(d.total_sales) / 1000000),
        borderColor: '#4FD1C5',
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      }]
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return value + 'M';
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text mt={4} color="gray.600">Loading dashboard...</Text>
        </Box>
      </AppLayout>
    );
  }

  if (error || dataset?.status !== 'completed') {
    return (
      <AppLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status={dataset?.status === 'failed' ? 'error' : 'info'} borderRadius="lg">
            <AlertIcon />
            {error || `Dataset status: ${dataset?.status}`}
          </Alert>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <Heading size="lg" mb={6}>Consumer Surplus Factor (CSF)</Heading>

        {/* Tabs */}
        <Tabs colorScheme="blue" mb={6} variant="soft-rounded">
          <TabList bg="white" p={2} borderRadius="lg" shadow="sm">
            <Tab _selected={{ bg: 'white', shadow: 'sm' }}>Trends</Tab>
            <Tab _selected={{ bg: 'white', shadow: 'sm' }}>CSF Results</Tab>
            <Tab _selected={{ bg: 'white', shadow: 'sm' }}>Scenario Planning</Tab>
          </TabList>
        </Tabs>

        {/* Sub Navigation */}
        <HStack spacing={4} mb={6} pb={2} borderBottom="2px" borderColor="gray.200">
          <Text fontWeight="semibold" borderBottom="2px" borderColor="black" pb={2}>Brand</Text>
          <Text color="gray.500" cursor="pointer">Pack Type</Text>
          <Text color="gray.500" cursor="pointer">PPG</Text>
          <Text color="gray.500" cursor="pointer">Brand X Pack Type X PPC</Text>
          <Text color="gray.500" cursor="pointer">Correlation and Trends</Text>
        </HStack>

        {/* Filters */}
        <Box bg="white" p={6} borderRadius="xl" shadow="sm" mb={6}>
          <Flex gap={4} wrap="wrap" align="end">
            <VStack align="start" flex="1" minW="150px">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">Channel</Text>
              <Select
                value={selectedFilters.channel}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                borderRadius="lg"
                size="md"
              >
                <option value="">All</option>
                {filters.channel?.map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </Select>
            </VStack>

            <VStack align="start" flex="1" minW="150px">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">Brand</Text>
              <Select
                value={selectedFilters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                borderRadius="lg"
                size="md"
              >
                <option value="">All</option>
                {filters.brand?.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </VStack>

            <VStack align="start" flex="1" minW="150px">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">Pack Type</Text>
              <Select
                value={selectedFilters.packtype}
                onChange={(e) => handleFilterChange('packtype', e.target.value)}
                borderRadius="lg"
                size="md"
              >
                <option value="">All</option>
                {filters.packtype?.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </Select>
            </VStack>

            <VStack align="start" flex="1" minW="150px">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">PPG</Text>
              <Select
                value={selectedFilters.ppg}
                onChange={(e) => handleFilterChange('ppg', e.target.value)}
                borderRadius="lg"
                size="md"
              >
                <option value="">All</option>
                {filters.ppg?.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </VStack>

            <VStack align="start" flex="1" minW="150px">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">Year</Text>
              <Select
                value={selectedFilters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                borderRadius="lg"
                size="md"
              >
                <option value="">All</option>
                {filters.year?.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </VStack>

            <Button onClick={handleReset} variant="ghost" leftIcon={<Text>🔄</Text>}>
              Reset
            </Button>
          </Flex>
        </Box>

        {/* Charts Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* ✅ Sales Value - HORIZONTAL BARS */}
          <Box bg="white" p={6} borderRadius="xl" shadow="sm">
            <Heading size="md" mb={6}>Sales Value (EURO)</Heading>
            <Box h="300px">
              {getHorizontalSalesData() && (
                <Bar data={getHorizontalSalesData()} options={horizontalBarOptions} />
              )}
            </Box>
          </Box>

          {/* ✅ Volume Contribution - HORIZONTAL BARS */}
          <Box bg="white" p={6} borderRadius="xl" shadow="sm">
            <Heading size="md" mb={6}>Volume Contribution (KG)</Heading>
            <Box h="300px">
              {getHorizontalVolumeData() && (
                <Bar data={getHorizontalVolumeData()} options={horizontalBarOptions} />
              )}
            </Box>
          </Box>

          {/* Brand Comparison */}
          <Box bg="white" p={6} borderRadius="xl" shadow="sm">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Value</Heading>
              <Select w="auto" size="sm" borderRadius="md">
                <option>Value</option>
              </Select>
            </Flex>
            <Box h="300px">
              {getBrandComparisonData() && (
                <Bar data={getBrandComparisonData()} options={groupedBarOptions} />
              )}
            </Box>
          </Box>

          {/* Monthly Trend */}
          <Box bg="white" p={6} borderRadius="xl" shadow="sm">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Value</Heading>
              <Select w="auto" size="sm" borderRadius="md">
                <option>Value</option>
              </Select>
            </Flex>
            <Box h="300px">
              {getMonthlyTrendData() && (
                <Line data={getMonthlyTrendData()} options={lineChartOptions} />
              )}
            </Box>
          </Box>
        </SimpleGrid>
      </Container>
    </AppLayout>
  );
}

export default DashboardPage;
