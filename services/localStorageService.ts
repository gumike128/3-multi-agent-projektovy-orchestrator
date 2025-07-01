
import { ArchivedProject } from '@/types';
import { LOCAL_STORAGE_HISTORY_KEY } from '@/constants';

export const getArchivedProjects = (): ArchivedProject[] => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (serializedState === null) {
      return [];
    }
    const projects = JSON.parse(serializedState) as ArchivedProject[];
    // Sort by timestamp descending (newest first)
    return projects.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Could not load projects from local storage:", error);
    return [];
  }
};

// Saves a single project. If it's an update to an existing project (matched by ID),
// it updates it in the list. Otherwise, adds it as new.
export const saveArchivedProject = (project: ArchivedProject): void => {
  try {
    const currentProjects = getArchivedProjects();
    const existingProjectIndex = currentProjects.findIndex(p => p.id === project.id);

    let projectsToSave: ArchivedProject[];

    if (existingProjectIndex !== -1) {
      // Update existing project
      currentProjects[existingProjectIndex] = project;
      projectsToSave = [...currentProjects]; // Create new array reference
    } else {
      // Add new project to the beginning
      projectsToSave = [project, ...currentProjects];
    }
    
    // Sort by timestamp descending before saving
    projectsToSave.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const serializedState = JSON.stringify(projectsToSave);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, serializedState);
  } catch (error) {
    console.error("Could not save project to local storage:", error);
  }
};

export const clearArchivedProjects = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
  } catch (error) {
    console.error("Could not clear project history from local storage:", error);
  }
};