// src/App.tsx
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Editor from "./components/Editor/Editor";
import CharacterPanel from "./components/CharacterPanel/CharacterPanel";
import LocationPanel from "./components/LocationPanel/LocationPanel";
import { useProjectStore } from "./store/projectStore";
import { ConfirmDialogProvider } from "./components/ConfirmDialogContext/ConfirmDialogContext";

const App: React.FC = () => {
  const [isProjectLoaded, setIsProjectLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {
    projectPath,
    createNewProject,
    loadProject,
    saveCurrentFile,
    setProjectPath,
    clearProject,
  } = useProjectStore();

  // Validate existing project path on startup
  useEffect(() => {
    const validateProjectPath = async () => {
      if (projectPath && window.electronAPI) {
        try {
          // Check if project directory still exists
          const result = await window.electronAPI.readDirectory(projectPath);
          if (result.success) {
            // Try to load the project
            await loadProject(projectPath);
            setIsProjectLoaded(true);
          } else {
            // Path doesn't exist anymore, clear it
            console.log(
              "Project path no longer exists, clearing:",
              projectPath
            );
            setProjectPath("");
            setIsProjectLoaded(false);
          }
        } catch (error) {
          console.error("Error validating project path:", error);
          setProjectPath("");
          setIsProjectLoaded(false);
        }
      } else if (projectPath && !window.electronAPI) {
        // In browser mode, always try to load
        try {
          await loadProject(projectPath);
          setIsProjectLoaded(true);
        } catch (error) {
          setProjectPath("");
          setIsProjectLoaded(false);
        }
      }
      setIsLoading(false);
    };

    validateProjectPath();
  }, [projectPath, loadProject, setProjectPath]);

  const handleNewProject = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (!window.electronAPI) {
        // Browser mode
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
    } finally {
      setIsLoading(false);
    }
  }, [createNewProject]);

  const handleOpenProject = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (!window.electronAPI) {
        // Browser mode - simulate project selection
        const projectName = prompt("Enter project name to open:");
        if (projectName) {
          const mockPath = `/projects/${projectName}`;
          await loadProject(mockPath);
          setIsProjectLoaded(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [loadProject]);

  const handleCloseProject = useCallback((): void => {
    const confirm = window.confirm(
      "Are you sure you want to close this project? Any unsaved changes will be lost."
    );
    if (confirm) {
      clearProject();
      setIsProjectLoaded(false);
    }
  }, [clearProject]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isProjectLoaded) return;

    try {
      await saveCurrentFile();
      console.log("Project saved successfully");
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please try again.");
    }
  }, [isProjectLoaded, saveCurrentFile]);

  // Setup menu handlers
  useEffect(() => {
    if (window.electronAPI) {
      // Setup menu event listeners
      window.electronAPI.onMenuNewProject(() => {
        console.log("Menu: New Project");
        handleNewProject();
      });

      window.electronAPI.onMenuOpenProject(() => {
        console.log("Menu: Open Project");
        handleOpenProject();
      });

      window.electronAPI.onMenuSave(() => {
        console.log("Menu: Save");
        handleSave();
      });

      window.electronAPI.onMenuCloseProject(() => {
        console.log("Menu: Close Project");
        handleCloseProject();
      });

      // Cleanup listeners on unmount
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners("menu-new-project");
          window.electronAPI.removeAllListeners("menu-open-project");
          window.electronAPI.removeAllListeners("menu-close-project");
          window.electronAPI.removeAllListeners("menu-save");
        }
      };
    }
  }, [handleNewProject, handleOpenProject, handleSave, handleCloseProject]);

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
            if (event.shiftKey) {
              event.preventDefault();
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
  }, [isProjectLoaded, handleNewProject, handleOpenProject, handleSave]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="app-container">
        <div className="welcome-screen">
          <h2>Loading...</h2>
          <p>Please wait while we initialize the application.</p>
        </div>
      </div>
    );
  }

  return (
    <ConfirmDialogProvider>
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
            {projectPath && (
              <div className="welcome-info">
                <p
                  style={{
                    color: "#f85149",
                    fontSize: "0.9rem",
                    marginTop: "1rem",
                  }}
                >
                  Previous project path no longer exists: {projectPath}
                </p>
                <button
                  onClick={() => {
                    setProjectPath("");
                    window.location.reload(); // Force refresh to clear all state
                  }}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "#21262d",
                    border: "1px solid #f85149",
                    borderRadius: "6px",
                    color: "#f85149",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Clear Project Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="app-layout">
            <Sidebar />
            <Editor />
            <div className="right-panels">
              <div className="character-panel-container">
                <CharacterPanel />
              </div>
              <div className="location-panel-container">
                <LocationPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfirmDialogProvider>
  );
};

export default App;
