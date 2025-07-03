import React, { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Editor from "./components/Editor/Editor";
import CharacterPanel from "./components/CharacterPanel/CharacterPanel";
import { useProjectStore } from "./stores/projectStore";

const App: React.FC = () => {
  const [isProjectLoaded, setIsProjectLoaded] = useState<boolean>(false);
  const {
    projectPath,
    setProjectPath,
    loadProject,
    createNewProject,
    saveCurrentFile,
  } = useProjectStore();

  useEffect(() => {
    // Check if project was already loaded
    if (projectPath) {
      setIsProjectLoaded(true);
    }

    // Listen for menu events
    if (window.electronAPI) {
      window.electronAPI.onMenuNewProject(handleNewProject);
      window.electronAPI.onMenuOpenProject(handleOpenProject);
      window.electronAPI.onMenuSave(handleSave);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners("menu-new-project");
        window.electronAPI.removeAllListeners("menu-open-project");
        window.electronAPI.removeAllListeners("menu-save");
      }
    };
  }, [projectPath]);

  const handleNewProject = async (): Promise<void> => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.selectDirectory();
    if (!result.canceled && result.filePaths.length > 0) {
      const projectDir = result.filePaths[0];
      await createNewProject(projectDir);
      setIsProjectLoaded(true);
    }
  };

  const handleOpenProject = async (): Promise<void> => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.selectDirectory();
    if (!result.canceled && result.filePaths.length > 0) {
      const projectDir = result.filePaths[0];
      await loadProject(projectDir);
      setIsProjectLoaded(true);
    }
  };

  const handleSave = (): void => {
    saveCurrentFile();
  };

  if (!isProjectLoaded) {
    return (
      <div className="app-container">
        <div className="welcome-screen">
          <h1>Novel IDE</h1>
          <p>AI-powered writing tool for novelists</p>
          <div className="welcome-actions">
            <button onClick={handleNewProject} className="btn-primary">
              New Project
            </button>
            <button onClick={handleOpenProject} className="btn-secondary">
              Open Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-layout">
        <Sidebar />
        <Editor />
        <CharacterPanel />
      </div>
    </div>
  );
};

export default App;
