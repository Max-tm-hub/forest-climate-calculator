// Утилиты для сохранения и загрузки проектов
export const saveProject = (projectData) => {
  try {
    const projects = getSavedProjects();
    const newProject = {
      id: Date.now().toString(),
      name: projectData.name || `Проект_${new Date().toLocaleDateString()}`,
      ...projectData,
      timestamp: new Date().toISOString()
    };
    
    projects.unshift(newProject);
    localStorage.setItem('forestProjects', JSON.stringify(projects));
    return newProject;
  } catch (error) {
    console.error('Error saving project:', error);
    return null;
  }
};

export const getSavedProjects = () => {
  try {
    return JSON.parse(localStorage.getItem('forestProjects') || '[]');
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

export const deleteProject = (projectId) => {
  try {
    const projects = getSavedProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('forestProjects', JSON.stringify(filteredProjects));
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
};

export const updateProject = (projectId, updates) => {
  try {
    const projects = getSavedProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      projects[projectIndex] = { ...projects[projectIndex], ...updates };
      localStorage.setItem('forestProjects', JSON.stringify(projects));
      return projects[projectIndex];
    }
    return null;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
};