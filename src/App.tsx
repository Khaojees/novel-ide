import React, { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Editor from "./components/Editor/Editor";
import CharacterPanel from "./components/CharacterPanel/CharacterPanel";
import { useProjectStore } from "./store/projectStore";

const App: React.FC = () => {
  const [isProjectLoaded, setIsProjectLoaded] = useState<boolean>(false);
  const { projectPath, createNewProject, loadProject, saveCurrentFile } =
    useProjectStore();

  // Check if project is loaded
  useEffect(() => {
    if (projectPath) {
      setIsProjectLoaded(true);
    }
  }, [projectPath]);

  const handleNewProject = async (): Promise<void> => {
    try {
      // In browser mode, simulate directory selection
      if (!window.electronAPI) {
        const projectName = prompt("Enter project name:");
        if (projectName) {
          const mockPath = `/projects/${projectName}`;
          await createNewProject(mockPath);
          setIsProjectLoaded(true);
        }
      } else {
        // Electron mode - use real directory picker
        const result = await window.electronAPI.selectDirectory();
        if (!result.canceled && result.filePaths.length > 0) {
          await createNewProject(result.filePaths[0]);
          setIsProjectLoaded(true);
        }
      }
    } catch (error) {
      console.error("Error creating new project:", error);
      alert("Failed to create new project. Please try again.");
    }
  };

  const handleOpenProject = async (): Promise<void> => {
    try {
      if (!window.electronAPI) {
        // Browser mode - simulate project loading
        const existingProjects = [
          "/projects/fantasy-novel",
          "/projects/sci-fi-story",
          "/projects/mystery-book",
        ];

        const choice = prompt(
          `Available projects:\n${existingProjects
            .map((p, i) => `${i + 1}. ${p}`)
            .join("\n")}\n\nEnter project number:`
        );

        if (choice) {
          const index = parseInt(choice) - 1;
          if (index >= 0 && index < existingProjects.length) {
            await loadProject(existingProjects[index]);
            setIsProjectLoaded(true);
          }
        }
      } else {
        // Electron mode - use real directory picker
        const result = await window.electronAPI.selectDirectory();
        if (!result.canceled && result.filePaths.length > 0) {
          await loadProject(result.filePaths[0]);
          setIsProjectLoaded(true);
        }
      }
    } catch (error) {
      console.error("Error opening project:", error);
      alert("Failed to open project. Please try again.");
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      await saveCurrentFile();
      console.log("Project saved successfully");
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please try again.");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            handleSave();
            break;
          case "n":
            event.preventDefault();
            if (event.shiftKey) {
              handleNewProject();
            }
            break;
          case "o":
            event.preventDefault();
            handleOpenProject();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Show loading state
  if (projectPath && !isProjectLoaded) {
    return (
      <div className="app-container">
        <div className="welcome-screen">
          <h2>Loading Project...</h2>
          <p>Please wait while we load your project files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!isProjectLoaded ? (
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
          <div className="welcome-shortcuts">
            <p>Keyboard shortcuts:</p>
            <ul>
              <li>
                <kbd>Ctrl+Shift+N</kbd> - New Project
              </li>
              <li>
                <kbd>Ctrl+O</kbd> - Open Project
              </li>
              <li>
                <kbd>Ctrl+S</kbd> - Save
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="app-layout">
          <Sidebar />
          <Editor />
          <CharacterPanel />
        </div>
      )}
    </div>
  );
};

export default App;
