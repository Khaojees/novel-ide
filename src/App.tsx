import React, { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Editor from "./components/Editor/Editor";
import CharacterPanel from "./components/CharacterPanel/CharacterPanel";
// import { useProjectStore } from './stores/projectStore';

const App: React.FC = () => {
  const [isProjectLoaded, setIsProjectLoaded] = useState<boolean>(false);

  // Temporary placeholder until we create the store
  // const {
  //   projectPath,
  //   setProjectPath,
  //   loadProject,
  //   createNewProject,
  //   saveCurrentFile
  // } = useProjectStore();

  const handleNewProject = async (): Promise<void> => {
    console.log("New project clicked");
    setIsProjectLoaded(true);
  };

  const handleOpenProject = async (): Promise<void> => {
    console.log("Open project clicked");
    setIsProjectLoaded(true);
  };

  const handleSave = (): void => {
    console.log("Save clicked");
  };

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
