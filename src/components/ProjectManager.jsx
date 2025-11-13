import React, { useState, useEffect } from 'react';
import { getSavedProjects, deleteProject, updateProject } from '../utils/projectStorage';
import { projectTemplates, getAllTemplates } from '../data/projectTemplates';

export default function ProjectManager({ onLoadProject, currentProject, onSaveCurrent }) {
  const [savedProjects, setSavedProjects] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setSavedProjects(getSavedProjects());
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Удалить этот проект?')) {
      if (deleteProject(projectId)) {
        loadProjects();
      }
    }
  };

  const handleLoadTemplate = (template) => {
    onLoadProject(template);
    setShowTemplates(false);
  };

  const handleSaveCurrent = () => {
    if (currentProject) {
      const projectName = prompt('Введите название проекта:', `Проект_${new Date().toLocaleDateString()}`);
      if (projectName) {
        onSaveCurrent({
          ...currentProject,
          name: projectName
        });
        loadProjects();
      }
    }
  };

  const handleRenameProject = (project, newName) => {
    if (newName && newName.trim() !== '') {
      updateProject(project.id, { name: newName });
      setEditingProject(null);
      loadProjects();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#2e7d32' }}>Управление проектами</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            📋 Шаблоны
          </button>
          <button
            onClick={handleSaveCurrent}
            disabled={!currentProject}
            style={{
              padding: '8px 16px',
              backgroundColor: currentProject ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentProject ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            💾 Сохранить текущий
          </button>
        </div>
      </div>

      {showTemplates && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '15px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Выберите шаблон:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {getAllTemplates().map(template => (
              <div
                key={template.key}
                onClick={() => handleLoadTemplate(template)}
                style={{
                  padding: '10px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: '#f8f9fa',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#2196F3';
                  e.target.style.backgroundColor = '#e3f2fd';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e9ecef';
                  e.target.style.backgroundColor = '#f8f9fa';
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{template.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {template.treeType} • {template.areaHa} га • {template.projectYears} лет
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Сохраненные проекты:</h4>
        {savedProjects.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Нет сохраненных проектов</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedProjects.map(project => (
              <div
                key={project.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              >
                <div style={{ flex: 1 }}>
                  {editingProject === project.id ? (
                    <input
                      type="text"
                      defaultValue={project.name}
                      onBlur={(e) => handleRenameProject(project, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameProject(project, e.target.value);
                        }
                      }}
                      autoFocus
                      style={{ width: '100%', padding: '2px 5px' }}
                    />
                  ) : (
                    <div 
                      onClick={() => setEditingProject(project.id)}
                      style={{ cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {project.name}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {project.treeType} • {project.areaHa} га • {formatDate(project.timestamp)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => onLoadProject(project)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Загрузить
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}