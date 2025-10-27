import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Button, SimpleGrid, Card, CardBody,
  Text, Input, Textarea, VStack, useToast, Spinner, Badge
} from '@chakra-ui/react';
import AppLayout from '../components/AppLayout';
import { getProjects, createProject } from '../api/apiClient';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast({
        title: 'Project name required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      await createProject(newProject, selectedFile);
      toast({
        title: 'Project created successfully!',
        status: 'success',
        duration: 3000,
      });
      setShowCreateForm(false);
      setNewProject({ name: '', description: '' });
      setSelectedFile(null);
      fetchProjects();
    } catch (err) {
      toast({
        title: 'Failed to create project',
        description: err.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDashboard = (project) => {
    if (project.datasets && project.datasets.length > 0) {
      navigate(`/dashboard/${project.datasets[0]}`);
    } else {
      toast({
        title: 'No dataset available',
        description: 'Please upload a dataset first',
        status: 'info',
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">My Projects</Heading>
          <Button
            colorScheme="blue"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ Create Project'}
          </Button>
        </Box>

        {showCreateForm && (
          <Card mb={6}>
            <CardBody>
              <VStack spacing={4}>
                <Input
                  placeholder="Project Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
                <Input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <Button
                  colorScheme="blue"
                  onClick={handleCreateProject}
                  isLoading={isCreating}
                  width="full"
                >
                  Create Project
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {projects.map((project) => (
            <Card key={project.id} cursor="pointer" _hover={{ shadow: 'lg' }}>
              <CardBody>
                <Heading size="md" mb={2}>{project.name}</Heading>
                <Text color="gray.600" mb={4}>{project.description || 'No description'}</Text>
                <Badge colorScheme="blue" mb={4}>
                  {project.dataset_count} Dataset(s)
                </Badge>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  width="full"
                  onClick={() => handleViewDashboard(project)}
                >
                  View Dashboard
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {projects.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text color="gray.500">No projects yet. Create your first project!</Text>
          </Box>
        )}
      </Container>
    </AppLayout>
  );
}

export default ProjectsPage;
