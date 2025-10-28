import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Container, Heading, Spinner, Alert, AlertIcon, SimpleGrid,
  Select, HStack, VStack, Text, Button, Flex, Badge
} from '@chakra-ui/react';
import { Bar, Line, Scatter } from 'react-chartjs-2';
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
  const [activeView, setActiveView] = useState('brand');
  const [activeTab, setActiveTab] = useState(0); // 0: Trends, 1: CSF Results, 2: Scenario Planning

  // Extended color palette
  const colorPalette = [
    '#FFA500', // Orange
    '#4299E1', // Blue
    '#48BB78', // Green
    '#9F7AEA', // Purple
    '#ED64A6', // Pink
    '#F6AD55', // Light Orange
    '#4FD1C5', // Teal
    '#FC8181', // Red
    '#90CDF4', // Light Blue
    '#68D391', // Light Green
    '#B794F4', // Light Purple
    '#F687B3', // Light Pink
  ];

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

  const getCurrentFilterLabel = () => {
    const labels = [];
    if (selectedFilters.brand) labels.push(`Brand: ${selectedFilters.brand}`);
    if (selectedFilters.packtype) labels.push(`Pack Type: ${selectedFilters.packtype}`);
    if (selectedFilters.ppg) labels.push(`PPG: ${selectedFilters.ppg}`);
    if (selectedFilters.channel) labels.push(`Channel: ${selectedFilters.channel}`);
    if (selectedFilters.year) labels.push(`Year: ${selectedFilters.year}`);
    return labels.length > 0 ? labels.join(' | ') : 'All Data';
  };

  // ============ BRAND VIEW CHARTS ============
  const getHorizontalSalesData = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands;
    
    const datasets = filteredBrands.map((brand, idx) => ({
      label: `Brand ${brands.indexOf(brand) + 1}`,
      data: years.map(year => {
        const item = analytics.sales_by_brand_year.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0;
      }),
      backgroundColor: colorPalette[brands.indexOf(brand) % colorPalette.length],
      borderRadius: 4,
    }));
    
    return {
      labels: years.map(y => y.toString()),
      datasets
    };
  };

  const getHorizontalVolumeData = () => {
    if (!analytics?.volume_by_brand_year) return null;
    const years = [...new Set(analytics.volume_by_brand_year.map(d => d.year))].sort();
    const brands = [...new Set(analytics.volume_by_brand_year.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands;
    
    const datasets = filteredBrands.map((brand, idx) => ({
      label: `Brand ${brands.indexOf(brand) + 1}`,
      data: years.map(year => {
        const item = analytics.volume_by_brand_year.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_volume) / 1000000 : 0;
      }),
      backgroundColor: colorPalette[brands.indexOf(brand) % colorPalette.length],
      borderRadius: 4,
    }));
    
    return {
      labels: years.map(y => y.toString()),
      datasets
    };
  };

  const getBrandComparisonData = () => {
    if (!analytics?.yearly_comparison) return null;
    const years = [...new Set(analytics.yearly_comparison.map(d => d.year))].sort();
    const brands = [...new Set(analytics.yearly_comparison.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands;
    
    const datasets = years.map((year, idx) => ({
      label: year.toString(),
      data: filteredBrands.map(brand => {
        const item = analytics.yearly_comparison.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0;
      }),
      backgroundColor: colorPalette[idx % colorPalette.length],
      borderRadius: 4,
    }));
    
    return {
      labels: filteredBrands.map((b, i) => `Brand ${brands.indexOf(b) + 1}`),
      datasets
    };
  };

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

  // ============ PACK TYPE VIEW CHARTS ============
  const getPackTypeSalesData = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    return {
      labels: brands.map((b, i) => `Brand ${i + 1}`),
      datasets: [{
        label: selectedFilters.packtype ? `Pack Type: ${selectedFilters.packtype}` : 'All Pack Types',
        data: brands.map(brand => {
          const brandData = analytics.sales_by_brand_year.filter(d => d.brand === brand);
          const total = brandData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
          return total / 1000000;
        }),
        backgroundColor: brands.map((_, i) => colorPalette[i % colorPalette.length]),
        borderRadius: 4,
      }]
    };
  };

  const getPackTypeVolumeData = () => {
    if (!analytics?.volume_by_brand_year) return null;
    const brands = [...new Set(analytics.volume_by_brand_year.map(d => d.brand))];
    
    return {
      labels: brands.map((b, i) => `Brand ${i + 1}`),
      datasets: [{
        label: selectedFilters.packtype ? `Pack Type: ${selectedFilters.packtype}` : 'All Pack Types',
        data: brands.map(brand => {
          const brandData = analytics.volume_by_brand_year.filter(d => d.brand === brand);
          const total = brandData.reduce((sum, item) => sum + parseFloat(item.total_volume), 0);
          return total / 1000000;
        }),
        backgroundColor: brands.map((_, i) => colorPalette[i % colorPalette.length]),
        borderRadius: 4,
      }]
    };
  };

  const getPackTypeYearlyTrend = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    
    return {
      labels: years.map(y => y.toString()),
      datasets: [{
        label: selectedFilters.packtype ? `Pack Type: ${selectedFilters.packtype}` : 'All Pack Types',
        data: years.map(year => {
          const yearData = analytics.sales_by_brand_year.filter(d => d.year === year);
          const total = yearData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
          return total / 1000000;
        }),
        borderColor: '#9F7AEA',
        backgroundColor: 'rgba(159, 122, 234, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const getPackTypeMarketShare = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    const totalSales = analytics.sales_by_brand_year.reduce(
      (sum, item) => sum + parseFloat(item.total_sales), 0
    );
    
    return {
      labels: brands.map((b, i) => `Brand ${i + 1}`),
      datasets: [{
        label: 'Market Share %',
        data: brands.map(brand => {
          const brandData = analytics.sales_by_brand_year.filter(d => d.brand === brand);
          const brandTotal = brandData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
          return ((brandTotal / totalSales) * 100).toFixed(2);
        }),
        backgroundColor: brands.map((_, i) => colorPalette[i % colorPalette.length]),
        borderRadius: 4,
      }]
    };
  };

  // ============ PPG VIEW CHARTS ============
  const getPPGSalesData = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    
    return {
      labels: years.map(y => y.toString()),
      datasets: [{
        label: selectedFilters.ppg ? `PPG: ${selectedFilters.ppg}` : 'All PPG',
        data: years.map(year => {
          const yearData = analytics.sales_by_brand_year.filter(d => d.year === year);
          const total = yearData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
          return total / 1000000;
        }),
        backgroundColor: '#4299E1',
        borderRadius: 4,
      }]
    };
  };

  const getPPGVolumeData = () => {
    if (!analytics?.volume_by_brand_year) return null;
    const years = [...new Set(analytics.volume_by_brand_year.map(d => d.year))].sort();
    
    return {
      labels: years.map(y => y.toString()),
      datasets: [{
        label: selectedFilters.ppg ? `PPG: ${selectedFilters.ppg}` : 'All PPG',
        data: years.map(year => {
          const yearData = analytics.volume_by_brand_year.filter(d => d.year === year);
          const total = yearData.reduce((sum, item) => sum + parseFloat(item.total_volume), 0);
          return total / 1000000;
        }),
        backgroundColor: '#48BB78',
        borderRadius: 4,
      }]
    };
  };

  const getPPGPerformanceTrend = () => {
    if (!analytics?.monthly_trend) return null;
    return {
      labels: analytics.monthly_trend.map(d => d.date),
      datasets: [{
        label: selectedFilters.ppg ? `PPG: ${selectedFilters.ppg}` : 'All PPG',
        data: analytics.monthly_trend.map(d => parseFloat(d.total_sales) / 1000000),
        borderColor: '#4299E1',
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const getPPGDistribution = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    return {
      labels: brands.map((b, i) => `Brand ${i + 1}`),
      datasets: [{
        label: selectedFilters.ppg ? `PPG: ${selectedFilters.ppg}` : 'All PPG',
        data: brands.map(brand => {
          const brandData = analytics.sales_by_brand_year.filter(d => d.brand === brand);
          return brandData.length;
        }),
        backgroundColor: brands.map((_, i) => colorPalette[i % colorPalette.length]),
        borderRadius: 4,
      }]
    };
  };

  // ============ CROSS-ANALYSIS CHARTS ============
  const getCrossAnalysisData = () => {
    if (!analytics?.yearly_comparison) return null;
    const brands = [...new Set(analytics.yearly_comparison.map(d => d.brand))];
    const years = [...new Set(analytics.yearly_comparison.map(d => d.year))].sort();
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands;
    
    const datasets = years.slice(0, 3).map((year, idx) => ({
      label: year.toString(),
      data: filteredBrands.map(brand => {
        const item = analytics.yearly_comparison.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0;
      }),
      backgroundColor: colorPalette[idx],
      borderRadius: 4,
    }));
    
    return {
      labels: filteredBrands.map((b, i) => `Brand ${brands.indexOf(b) + 1}`),
      datasets
    };
  };

  const getCrossPerformanceData = () => {
    if (!analytics?.sales_by_brand_year && !analytics?.volume_by_brand_year) return null;
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands;
    
    return {
      labels: filteredBrands.map((b, i) => `Brand ${brands.indexOf(b) + 1}`),
      datasets: [
        {
          label: 'Sales',
          data: filteredBrands.map(brand => {
            const brandData = analytics.sales_by_brand_year.filter(d => d.brand === brand);
            const total = brandData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
            return total / 1000000;
          }),
          backgroundColor: '#4299E1',
          borderRadius: 4,
        },
        {
          label: 'Volume',
          data: filteredBrands.map(brand => {
            const brandData = analytics.volume_by_brand_year.filter(d => d.brand === brand);
            const total = brandData.reduce((sum, item) => sum + parseFloat(item.total_volume), 0);
            return total / 1000000;
          }),
          backgroundColor: '#48BB78',
          borderRadius: 4,
        }
      ]
    };
  };

  const getPPCCorrelationData = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands.slice(0, 3);
    
    const datasets = filteredBrands.map((brand, idx) => ({
      label: `Brand ${brands.indexOf(brand) + 1}`,
      data: years.map(year => {
        const item = analytics.sales_by_brand_year.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0;
      }),
      borderColor: colorPalette[brands.indexOf(brand) % colorPalette.length],
      backgroundColor: `${colorPalette[brands.indexOf(brand) % colorPalette.length]}20`,
      fill: true,
      tension: 0.4,
    }));
    
    return {
      labels: years.map(y => y.toString()),
      datasets
    };
  };

  const getMultiDimensionalInsights = () => {
    if (!analytics?.sales_by_brand_year && !analytics?.volume_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    
    return {
      labels: years.map(y => y.toString()),
      datasets: [
        {
          label: 'Total Sales',
          data: years.map(year => {
            const yearData = analytics.sales_by_brand_year.filter(d => d.year === year);
            const total = yearData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
            return total / 1000000;
          }),
          borderColor: '#9F7AEA',
          backgroundColor: 'rgba(159, 122, 234, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Total Volume',
          data: years.map(year => {
            const yearData = analytics.volume_by_brand_year.filter(d => d.year === year);
            const total = yearData.reduce((sum, item) => sum + parseFloat(item.total_volume), 0);
            return total / 1000000;
          }),
          borderColor: '#48BB78',
          backgroundColor: 'rgba(72, 187, 120, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  // ============ CORRELATION VIEW CHARTS ============
  const getSalesVolumeCorrelation = () => {
    if (!analytics?.monthly_trend) return null;
    return {
      labels: analytics.monthly_trend.map(d => d.date),
      datasets: [
        {
          label: 'Sales Trend',
          data: analytics.monthly_trend.map(d => parseFloat(d.total_sales) / 1000000),
          borderColor: '#4299E1',
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        }
      ]
    };
  };

  const getTrendAnalysisData = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    
    return {
      labels: years.map(y => y.toString()),
      datasets: [{
        label: 'Overall Trend',
        data: years.map(year => {
          const yearData = analytics.sales_by_brand_year.filter(d => d.year === year);
          const total = yearData.reduce((sum, item) => sum + parseFloat(item.total_sales), 0);
          return total / 1000000;
        }),
        borderColor: '#48BB78',
        backgroundColor: 'rgba(72, 187, 120, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const getSalesVolumeScatterData = () => {
    if (!analytics?.sales_by_brand_year || !analytics?.volume_by_brand_year) return null;
    
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands;
    
    const datasets = filteredBrands.map((brand, idx) => {
      const salesData = analytics.sales_by_brand_year.filter(d => d.brand === brand);
      const volumeData = analytics.volume_by_brand_year.filter(d => d.brand === brand);
      
      const scatterPoints = salesData.map(saleItem => {
        const volumeItem = volumeData.find(v => v.year === saleItem.year);
        return {
          x: parseFloat(saleItem.total_sales) / 1000000,
          y: volumeItem ? parseFloat(volumeItem.total_volume) / 1000000 : 0
        };
      });
      
      return {
        label: `Brand ${brands.indexOf(brand) + 1}`,
        data: scatterPoints,
        backgroundColor: colorPalette[brands.indexOf(brand) % colorPalette.length],
        borderColor: colorPalette[brands.indexOf(brand) % colorPalette.length],
        pointRadius: 6,
        pointHoverRadius: 8,
      };
    });
    
    return { datasets };
  };

  const getPredictiveTrends = () => {
    if (!analytics?.sales_by_brand_year) return null;
    const years = [...new Set(analytics.sales_by_brand_year.map(d => d.year))].sort();
    const brands = [...new Set(analytics.sales_by_brand_year.map(d => d.brand))];
    
    const filteredBrands = selectedFilters.brand 
      ? brands.filter(b => b === selectedFilters.brand) 
      : brands.slice(0, 2);
    
    const datasets = filteredBrands.map((brand, idx) => ({
      label: `Brand ${brands.indexOf(brand) + 1}`,
      data: years.map(year => {
        const item = analytics.sales_by_brand_year.find(d => d.brand === brand && d.year === year);
        return item ? parseFloat(item.total_sales) / 1000000 : 0;
      }),
      borderColor: colorPalette[brands.indexOf(brand) % colorPalette.length],
      backgroundColor: `${colorPalette[brands.indexOf(brand) % colorPalette.length]}20`,
      fill: true,
      tension: 0.4,
    }));
    
    return {
      labels: years.map(y => y.toString()),
      datasets
    };
  };

  // ============ CHART OPTIONS ============
  const horizontalBarOptions = {
    indexAxis: 'y',
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

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
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

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: Sales ${context.parsed.x.toFixed(1)}M, Volume ${context.parsed.y.toFixed(1)}M`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sales (Million EURO)'
        },
        ticks: {
          callback: function(value) {
            return value + 'M';
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Volume (Million KG)'
        },
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
        <Container maxW="container.xl" py={8}>
          <VStack spacing={4}>
            <Spinner size="xl" color="teal.500" />
            <Text>Loading dashboard...</Text>
          </VStack>
        </Container>
      </AppLayout>
    );
  }

  if (error || dataset?.status !== 'completed') {
    return (
      <AppLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status="error">
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

        {/* Custom Sliding Toggle Tabs */}
        <Box 
          bg="gray.100" 
          p={1} 
          borderRadius="lg" 
          mb={4}
          display="inline-flex"
          position="relative"
          boxShadow="sm"
        >
          {/* Sliding Background */}
          <Box
            position="absolute"
            bg="white"
            borderRadius="md"
            boxShadow="md"
            transition="all 0.3s ease"
            height="calc(100% - 8px)"
            width={`calc(33.33% - 5px)`}
            left={`calc(${activeTab * 33.33}% + 4px)`}
            top="4px"
            zIndex={0}
          />
          
          {/* Tab Buttons */}
          <Button
            variant="ghost"
            size="md"
            onClick={() => setActiveTab(0)}
            zIndex={1}
            fontWeight={activeTab === 0 ? 'bold' : 'normal'}
            color={activeTab === 0 ? 'teal.600' : 'gray.600'}
            _hover={{ bg: 'transparent' }}
            flex={1}
          >
            Trends
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setActiveTab(1)}
            zIndex={1}
            fontWeight={activeTab === 1 ? 'bold' : 'normal'}
            color={activeTab === 1 ? 'teal.600' : 'gray.600'}
            _hover={{ bg: 'transparent' }}
            flex={1}
          >
            CSF Results
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setActiveTab(2)}
            zIndex={1}
            fontWeight={activeTab === 2 ? 'bold' : 'normal'}
            color={activeTab === 2 ? 'teal.600' : 'gray.600'}
            _hover={{ bg: 'transparent' }}
            flex={1}
          >
            Scenario Planning
          </Button>
        </Box>

        {/* Sub Navigation with Underline Effect */}
        <HStack spacing={4} mb={4} overflowX="auto">
          <Box position="relative">
            <Button
              onClick={() => setActiveView('brand')}
              variant="ghost"
              colorScheme={activeView === 'brand' ? 'orange' : 'gray'}
              size="sm"
              fontWeight={activeView === 'brand' ? 'bold' : 'normal'}
            >
              Brand
            </Button>
            {activeView === 'brand' && (
              <Box
                position="absolute"
                bottom="-2px"
                left="0"
                right="0"
                height="3px"
                bg="linear-gradient(90deg, #FFA500, #FF8C00)"
                borderRadius="full"
              />
            )}
          </Box>

          <Box position="relative">
            <Button
              onClick={() => setActiveView('packtype')}
              variant="ghost"
              colorScheme={activeView === 'packtype' ? 'orange' : 'gray'}
              size="sm"
              fontWeight={activeView === 'packtype' ? 'bold' : 'normal'}
            >
              Pack Type
            </Button>
            {activeView === 'packtype' && (
              <Box
                position="absolute"
                bottom="-2px"
                left="0"
                right="0"
                height="3px"
                bg="linear-gradient(90deg, #FFA500, #FF8C00)"
                borderRadius="full"
              />
            )}
          </Box>

          <Box position="relative">
            <Button
              onClick={() => setActiveView('ppg')}
              variant="ghost"
              colorScheme={activeView === 'ppg' ? 'orange' : 'gray'}
              size="sm"
              fontWeight={activeView === 'ppg' ? 'bold' : 'normal'}
            >
              PPG
            </Button>
            {activeView === 'ppg' && (
              <Box
                position="absolute"
                bottom="-2px"
                left="0"
                right="0"
                height="3px"
                bg="linear-gradient(90deg, #FFA500, #FF8C00)"
                borderRadius="full"
              />
            )}
          </Box>

          <Box position="relative">
            <Button
              onClick={() => setActiveView('cross')}
              variant="ghost"
              colorScheme={activeView === 'cross' ? 'orange' : 'gray'}
              size="sm"
              fontWeight={activeView === 'cross' ? 'bold' : 'normal'}
            >
              Brand X Pack Type X PPC
            </Button>
            {activeView === 'cross' && (
              <Box
                position="absolute"
                bottom="-2px"
                left="0"
                right="0"
                height="3px"
                bg="linear-gradient(90deg, #FFA500, #FF8C00)"
                borderRadius="full"
              />
            )}
          </Box>

          <Box position="relative">
            <Button
              onClick={() => setActiveView('correlation')}
              variant="ghost"
              colorScheme={activeView === 'correlation' ? 'orange' : 'gray'}
              size="sm"
              fontWeight={activeView === 'correlation' ? 'bold' : 'normal'}
            >
              Correlation and Trends
            </Button>
            {activeView === 'correlation' && (
              <Box
                position="absolute"
                bottom="-2px"
                left="0"
                right="0"
                height="3px"
                bg="linear-gradient(90deg, #FFA500, #FF8C00)"
                borderRadius="full"
              />
            )}
          </Box>
        </HStack>

        {/* Active Filter Badge */}
        <Box mb={4}>
          <Badge colorScheme="teal" fontSize="md" p={2} borderRadius="md">
            📊 Showing: {getCurrentFilterLabel()}
          </Badge>
        </Box>

        {/* Filters */}
        <Flex gap={3} mb={6} wrap="wrap" align="flex-end">
          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">Channel</Text>
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

          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">Brand</Text>
            <Select
              value={selectedFilters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              borderRadius="lg"
              size="md"
            >
              <option value="">All Brands</option>
              {filters.brand?.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </VStack>

          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">Pack Type</Text>
            <Select
              value={selectedFilters.packtype}
              onChange={(e) => handleFilterChange('packtype', e.target.value)}
              borderRadius="lg"
              size="md"
            >
              <option value="">All Pack Types</option>
              {filters.packtype?.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </Select>
          </VStack>

          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">PPG</Text>
            <Select
              value={selectedFilters.ppg}
              onChange={(e) => handleFilterChange('ppg', e.target.value)}
              borderRadius="lg"
              size="md"
            >
              <option value="">All PPG</option>
              {filters.ppg?.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </VStack>

          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">Year</Text>
            <Select
              value={selectedFilters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              borderRadius="lg"
              size="md"
            >
              <option value="">All Years</option>
              {filters.year?.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </VStack>

          <Button onClick={handleReset} colorScheme="gray" leftIcon={<Text>🔄</Text>}>
            Reset
          </Button>
        </Flex>

        {/* Charts Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {activeView === 'brand' && (
            <>
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Sales Value by Brand (EURO)
                  {selectedFilters.brand && <Badge ml={2} colorScheme="blue">{selectedFilters.brand}</Badge>}
                </Text>
                {getHorizontalSalesData() && (
                  <Box height="300px">
                    <Bar data={getHorizontalSalesData()} options={horizontalBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Volume by Brand (KG)
                  {selectedFilters.brand && <Badge ml={2} colorScheme="blue">{selectedFilters.brand}</Badge>}
                </Text>
                {getHorizontalVolumeData() && (
                  <Box height="300px">
                    <Bar data={getHorizontalVolumeData()} options={horizontalBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Brand Comparison by Year
                  {selectedFilters.brand && <Badge ml={2} colorScheme="blue">{selectedFilters.brand}</Badge>}
                </Text>
                {getBrandComparisonData() && (
                  <Box height="300px">
                    <Bar data={getBrandComparisonData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>Monthly Sales Trend</Text>
                {getMonthlyTrendData() && (
                  <Box height="300px">
                    <Line data={getMonthlyTrendData()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
            </>
          )}
          
          {activeView === 'packtype' && (
            <>
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Sales by Pack Type
                  {selectedFilters.packtype && <Badge ml={2} colorScheme="purple">{selectedFilters.packtype}</Badge>}
                </Text>
                {getPackTypeSalesData() && (
                  <Box height="300px">
                    <Bar data={getPackTypeSalesData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Volume by Pack Type
                  {selectedFilters.packtype && <Badge ml={2} colorScheme="purple">{selectedFilters.packtype}</Badge>}
                </Text>
                {getPackTypeVolumeData() && (
                  <Box height="300px">
                    <Bar data={getPackTypeVolumeData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Pack Type Yearly Trend
                  {selectedFilters.packtype && <Badge ml={2} colorScheme="purple">{selectedFilters.packtype}</Badge>}
                </Text>
                {getPackTypeYearlyTrend() && (
                  <Box height="300px">
                    <Line data={getPackTypeYearlyTrend()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>Pack Type Market Share</Text>
                {getPackTypeMarketShare() && (
                  <Box height="300px">
                    <Bar data={getPackTypeMarketShare()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
            </>
          )}
          
          {activeView === 'ppg' && (
            <>
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Sales by PPG
                  {selectedFilters.ppg && <Badge ml={2} colorScheme="green">{selectedFilters.ppg}</Badge>}
                </Text>
                {getPPGSalesData() && (
                  <Box height="300px">
                    <Bar data={getPPGSalesData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Volume by PPG
                  {selectedFilters.ppg && <Badge ml={2} colorScheme="green">{selectedFilters.ppg}</Badge>}
                </Text>
                {getPPGVolumeData() && (
                  <Box height="300px">
                    <Bar data={getPPGVolumeData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  PPG Performance Over Time
                  {selectedFilters.ppg && <Badge ml={2} colorScheme="green">{selectedFilters.ppg}</Badge>}
                </Text>
                {getPPGPerformanceTrend() && (
                  <Box height="300px">
                    <Line data={getPPGPerformanceTrend()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  PPG Distribution
                  {selectedFilters.ppg && <Badge ml={2} colorScheme="green">{selectedFilters.ppg}</Badge>}
                </Text>
                {getPPGDistribution() && (
                  <Box height="300px">
                    <Bar data={getPPGDistribution()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
            </>
          )}
          
          {activeView === 'cross' && (
            <>
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Brand X Pack Type Analysis
                  {(selectedFilters.brand || selectedFilters.packtype) && (
                    <Badge ml={2} colorScheme="orange">
                      {[selectedFilters.brand, selectedFilters.packtype].filter(Boolean).join(' | ')}
                    </Badge>
                  )}
                </Text>
                {getCrossAnalysisData() && (
                  <Box height="300px">
                    <Bar data={getCrossAnalysisData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Cross-Dimensional Performance
                  {selectedFilters.brand && <Badge ml={2} colorScheme="orange">{selectedFilters.brand}</Badge>}
                </Text>
                {getCrossPerformanceData() && (
                  <Box height="300px">
                    <Bar data={getCrossPerformanceData()} options={groupedBarOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  PPC Correlation Matrix
                  {selectedFilters.brand && <Badge ml={2} colorScheme="orange">{selectedFilters.brand}</Badge>}
                </Text>
                {getPPCCorrelationData() && (
                  <Box height="300px">
                    <Line data={getPPCCorrelationData()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>Multi-Dimensional Insights</Text>
                {getMultiDimensionalInsights() && (
                  <Box height="300px">
                    <Line data={getMultiDimensionalInsights()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
            </>
          )}
          
          {activeView === 'correlation' && (
            <>
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>Sales-Volume Correlation</Text>
                {getSalesVolumeCorrelation() && (
                  <Box height="300px">
                    <Line data={getSalesVolumeCorrelation()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>Trend Analysis</Text>
                {getTrendAnalysisData() && (
                  <Box height="300px">
                    <Line data={getTrendAnalysisData()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Sales vs Volume Scatter Plot
                  {selectedFilters.brand && <Badge ml={2} colorScheme="teal">{selectedFilters.brand}</Badge>}
                </Text>
                {getSalesVolumeScatterData() && (
                  <Box height="300px">
                    <Scatter data={getSalesVolumeScatterData()} options={scatterOptions} />
                  </Box>
                )}
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Predictive Trends
                  {selectedFilters.brand && <Badge ml={2} colorScheme="teal">{selectedFilters.brand}</Badge>}
                </Text>
                {getPredictiveTrends() && (
                  <Box height="300px">
                    <Line data={getPredictiveTrends()} options={lineChartOptions} />
                  </Box>
                )}
              </Box>
            </>
          )}
        </SimpleGrid>
      </Container>
    </AppLayout>
  );
}

export default DashboardPage;
