import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const loginUser = (username, password) => apiClient.post('/token/', { username, password });
export const registerUser = (username, password) => apiClient.post('/register/', { username, password });

// PROJECTS
export const getProjects = () => apiClient.get('/projects/');

export const createProject = (projectData, file) => {
  const formData = new FormData();
  formData.append('name', projectData.name);
  formData.append('description', projectData.description || '');
  if (file) {
    formData.append('file', file);
  }
  
  return apiClient.post('/projects/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// DATASETS
export const getDatasetDetails = (datasetId) => apiClient.get(`/datasets/${datasetId}/`);

export const getFilters = (datasetId) => apiClient.get(`/datasets/${datasetId}/filters/`);

export const getAnalytics = (datasetId, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  return apiClient.get(`/datasets/${datasetId}/analytics/`, { params });
};
